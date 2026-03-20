import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom } from "../../Store/Store"
import { useState, useCallback } from "react"
import {
  FeeInvoiceAPI,
  Invoice,
  InvoiceFilters,
  AddPaymentPayload,
} from "./feeInvoice.api"

// ─── Query keys ───────────────────────────────────────────────────────────────
export const invoiceKeys = {
  all:    ()                         => ["invoices"]                     as const,
  list:   (filters: InvoiceFilters)  => ["invoices", "list",   filters]  as const,
  detail: (id: string)               => ["invoices", "detail", id]       as const,
  stats:  ()                         => ["invoices", "stats"]            as const,
}

// ─── useInvoiceList ───────────────────────────────────────────────────────────
export function useInvoiceList(filters: InvoiceFilters, token: string) {
  return useQuery({
    queryKey:        invoiceKeys.list(filters),
    queryFn:         () => FeeInvoiceAPI.getAll(filters, token),
    staleTime:       60_000,
    enabled:         !!token,
    placeholderData: (prev) => prev,   // keeps previous page visible while next loads
  })
}

// ─── useInvoiceDetail ─────────────────────────────────────────────────────────
export function useInvoiceDetail(id: string | null, token: string) {
  return useQuery({
    queryKey:  invoiceKeys.detail(id!),
    queryFn:   () => FeeInvoiceAPI.getById(id!, token).then((r) => r.data),
    staleTime: 30_000,
    enabled:   !!token && !!id,
  })
}

// ─── useInvoiceStats ──────────────────────────────────────────────────────────
export function useInvoiceStats(token: string) {
  return useQuery({
    queryKey:  invoiceKeys.stats(),
    queryFn:   () => FeeInvoiceAPI.getStats(token).then((r) => r.data),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })
}

// ─── useAddPayment ────────────────────────────────────────────────────────────
export function useAddPayment(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: AddPaymentPayload }) =>
      FeeInvoiceAPI.addPayment(invoiceId, payload, token).then((r) => r.data),

    // Optimistic update — reflect new totals in the list immediately
    onMutate: async ({ invoiceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.all() })

      const previousQueries = queryClient.getQueriesData<{ data: Invoice[] }>({
        queryKey: invoiceKeys.all(),
      })

      queryClient.setQueriesData<{ data: Invoice[]; [k: string]: unknown }>(
        { queryKey: invoiceKeys.all() },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((inv) =>
              inv._id === invoiceId
                ? {
                    ...inv,
                    totalPaid:  inv.totalPaid + payload.amount,
                    balanceDue: inv.balanceDue - payload.amount,
                    // Optimistically derive status
                    status: inv.balanceDue - payload.amount <= 0 ? "Paid" : "Partially Paid",
                  }
                : inv
            ),
          }
        }
      )

      return { previousQueries }
    },

    onError: (_err, _vars, context) => {
      context?.previousQueries.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      )
    },

    onSettled: (_data, _err, { invoiceId }) => {
      // Sync list, detail, and stats
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all() })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
    },
  })
}

// ─── useFeeInvoice — composite hook used by FeeInvoiceUI ─────────────────────
export function useFeeInvoice() {
  const { token } = useCustom()

  const [filters, setFiltersState] = useState<InvoiceFilters>({
    page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc",
  })

  const setFilters = useCallback((partial: Partial<InvoiceFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  const listQuery  = useInvoiceList(filters, token)
  const statsQuery = useInvoiceStats(token)
  const mutation   = useAddPayment(token)

  const addPayment = useCallback(
    (invoiceId: string, payload: AddPaymentPayload) =>
      mutation.mutateAsync({ invoiceId, payload }),
    [mutation]
  )

  return {
    // List
    invoices:   listQuery.data?.data      ?? [],
    total:      listQuery.data?.total     ?? 0,
    totalPages: listQuery.data?.totalPages ?? 1,
    isLoading:  listQuery.isLoading,
    error:      listQuery.error?.message  ?? null,

    // Stats
    stats:          statsQuery.data         ?? null,
    isStatsLoading: statsQuery.isLoading,

    // Filters
    filters,
    setFilters,

    // Mutation
    addPayment,
    paymentLoading:  mutation.isPending ? (mutation.variables as any)?.invoiceId : null,
    paymentError:    mutation.error?.message ?? null,

    token,
  }
}