import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom } from "../../Store/Store"
import { useState, useCallback } from "react"
import {
  StudentApplicationAPI,
  Application,
  ApplicationFilters,
  UpdateStatusPayload,
} from "./studentapplication.api"

// ─── Query keys ───────────────────────────────────────────────────────────────
export const applicationKeys = {
  all:    ()                              => ["applications"]                       as const,
  list:   (filters: ApplicationFilters)  => ["applications", "list",   filters]    as const,
  detail: (id: string)                   => ["applications", "detail", id]         as const,
  stats:  ()                             => ["applications", "stats"]              as const,
}

// ─── useApplicationList ───────────────────────────────────────────────────────
export function useApplicationList(filters: ApplicationFilters, token: string) {
  return useQuery({
    queryKey:        applicationKeys.list(filters),
    queryFn:         () => StudentApplicationAPI.getAll(filters, token),
    staleTime:       60_000,
    enabled:         !!token,
    placeholderData: (prev) => prev,
  })
}

// ─── useApplicationStats ──────────────────────────────────────────────────────
export function useApplicationStats(token: string) {
  return useQuery({
    queryKey:  applicationKeys.stats(),
    queryFn:   () => StudentApplicationAPI.getStats(token).then((r) => r.data),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })
}

// ─── useUpdateApplicationStatus ───────────────────────────────────────────────
export function useUpdateApplicationStatus(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStatusPayload }) =>
      StudentApplicationAPI.updateStatus(id, payload, token).then((r) => r.data),

    // Optimistic update — change status in every cached list variant immediately
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: applicationKeys.all() })

      const previousQueries = queryClient.getQueriesData<{ data: Application[] }>({
        queryKey: applicationKeys.all(),
      })

      queryClient.setQueriesData<{ data: Application[]; [k: string]: unknown }>(
        { queryKey: applicationKeys.all() },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((app) =>
              app._id === id ? { ...app, status: payload.status } : app
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

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
    },
  })
}

// ─── useStudentApplications — composite hook ──────────────────────────────────
export function useStudentApplications() {
  const { token } = useCustom()

  const [filters, setFiltersState] = useState<ApplicationFilters>({
    page:      1,
    limit:     10,
    sortBy:    "createdAt",
    sortOrder: "desc",
  })

  const setFilters = useCallback((partial: Partial<ApplicationFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  const listQuery  = useApplicationList(filters, token)
  const statsQuery = useApplicationStats(token)
  const mutation   = useUpdateApplicationStatus(token)

  const updateStatus = useCallback(
    (id: string, payload: UpdateStatusPayload) =>
      mutation.mutateAsync({ id, payload }),
    [mutation]
  )

  return {
    // List
    applications: listQuery.data?.data       ?? [],
    total:        listQuery.data?.total      ?? 0,
    totalPages:   listQuery.data?.totalPages ?? 1,
    isLoading:    listQuery.isLoading,
    error:        listQuery.error?.message   ?? null,

    // Stats — from the dedicated endpoint, not computed from current page
    stats:          statsQuery.data          ?? null,
    isStatsLoading: statsQuery.isLoading,

    // Filters
    filters,
    setFilters,

    // Mutation
    updateStatus,
    mutatingId:     mutation.isPending ? (mutation.variables as any)?.id : null,
    mutationError:  mutation.error?.message ?? null,

    token,
  }
}