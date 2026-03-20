import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom } from "../../../Store/Store"
import { MessSubscriptionAPI, Subscription, SubscriptionFilters, UpdateStatusPayload } from "./messSubscription.api"
import { useState, useCallback } from "react"

// ─── Query keys ───────────────────────────────────────────────────────────────
export const subscriptionKeys = {
  all:     ()                          => ["subscriptions"]                    as const,
  list:    (filters: SubscriptionFilters) => ["subscriptions", "list", filters] as const,
  stats:   ()                          => ["subscriptions", "stats"]           as const,
}

// ─── useSubscriptionList ──────────────────────────────────────────────────────
export function useSubscriptionList(filters: SubscriptionFilters, token: string) {
  return useQuery({
    queryKey: subscriptionKeys.list(filters),
    queryFn:  () => MessSubscriptionAPI.getAll(filters).then((r) => r),
    staleTime: 60_000,       // 1 min — subscription data changes infrequently
    enabled:   !!token,
    placeholderData: (prev) => prev,   // keeps previous page visible while next loads
  })
}

// ─── useSubscriptionStats ─────────────────────────────────────────────────────
export function useSubscriptionStats(token: string) {
  return useQuery({
    queryKey: subscriptionKeys.stats(),
    queryFn:  () => MessSubscriptionAPI.getStats().then((r) => r.data),
    staleTime: 2 * 60_000,   // 2 min — stats don't need to be real-time
    enabled:   !!token,
  })
}

// ─── useUpdateSubscriptionStatus ─────────────────────────────────────────────
export function useUpdateSubscriptionStatus(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStatusPayload }) =>
      MessSubscriptionAPI.updateStatus(id, payload).then((r) => r.data),

    // Optimistic update — change the row status immediately
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.all() })

      // Snapshot every list variation in the cache
      const previousQueries = queryClient.getQueriesData<{ data: Subscription[] }>({
        queryKey: subscriptionKeys.all(),
      })

      queryClient.setQueriesData<{ data: Subscription[]; [k: string]: unknown }>(
        { queryKey: subscriptionKeys.all() },
        (old) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((sub) =>
              sub._id === id ? { ...sub, status: payload.status } : sub
            ),
          }
        }
      )

      return { previousQueries }
    },

    onError: (_err, _vars, context) => {
      // Restore every list snapshot on failure
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },

    onSettled: () => {
      // Sync list + stats from the server
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() })
    },
  })
}

// ─── useMessSubscriptions — composite hook used by SubscriptionsPanel ─────────
/**
 * Combines list + stats queries and the status mutation into
 * a single ergonomic interface that matches the shape the panel expects.
 */
export function useMessSubscriptions() {
  const { token } = useCustom()

  const [filters, setFiltersState] = useState<SubscriptionFilters>({
    status: "All",
    page:   1,
    limit:  20,
  })

  const setFilters = useCallback((partial: Partial<SubscriptionFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  const listQuery  = useSubscriptionList(filters, token)
  const statsQuery = useSubscriptionStats(token)
  const mutation   = useUpdateSubscriptionStatus(token)

  const updateStatus = useCallback(
    (id: string, payload: UpdateStatusPayload) =>
      mutation.mutateAsync({ id, payload }),
    [mutation]
  )

  return {
    // List data
    subscriptions: listQuery.data?.data       ?? [],
    totalRecords:  listQuery.data?.total       ?? 0,
    totalPages:    listQuery.data?.totalPages  ?? 1,
    isLoading:     listQuery.isLoading,
    error:         listQuery.error?.message    ?? null,

    // Stats
    stats:          statsQuery.data            ?? null,
    isStatsLoading: statsQuery.isLoading,

    // Filters
    filters,
    setFilters,

    // Mutation
    updateStatus,
    actionLoading: mutation.isPending ? (mutation.variables as any)?.id : null,
    mutationError: mutation.error?.message ?? null,
  }
}