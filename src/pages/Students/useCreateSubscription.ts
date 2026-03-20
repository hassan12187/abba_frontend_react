import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  MessSubscriptionAPI,
  CreateSubscriptionPayload,
  Subscription,
} from "../Mess/messSubscription/messSubscription.api"

// Re-export the existing subscription keys so this hook can invalidate correctly
export const subscriptionKeys = {
  all:    ()           => ["subscriptions"]                as const,
  list:   (f: object) => ["subscriptions", "list",   f]   as const,
  detail: (id: string)=> ["subscriptions", "detail", id]  as const,
  stats:  ()           => ["subscriptions", "stats"]      as const,
  byStudent: (id: string) => ["subscriptions", "student", id] as const,
}

// ─── useStudentSubscription ───────────────────────────────────────────────────
// Checks if a student already has an active subscription.
// Call this inside the AssignModal to show current state.
export function useStudentSubscription(studentId: string | null, token: string) {
  return useQuery({
    queryKey: subscriptionKeys.byStudent(studentId!),
    queryFn:  () =>
      MessSubscriptionAPI.getByStudentId(studentId!, token).then((r) => r.data),
    staleTime: 30_000,
    enabled:   !!token && !!studentId,
    // 404 means no subscription — treat as null not an error
    retry: (count, err) => {
      if ((err as Error).message.includes("404") || (err as Error).message.includes("not found")) return false
      return count < 2
    },
  })
}

// ─── useCreateSubscription ────────────────────────────────────────────────────
export function useCreateSubscription(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) =>
      MessSubscriptionAPI.create(payload, token).then((r) => r.data),

    onSuccess: (newSub: Subscription) => {
      // Invalidate global subscription list + stats so SubscriptionsPanel refreshes
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() })

      // Seed the per-student cache immediately so the modal shows it without refetch
      queryClient.setQueryData(
        subscriptionKeys.byStudent(newSub.student._id),
        newSub
      )
    },
  })
}