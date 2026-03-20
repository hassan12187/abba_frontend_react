import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  MessMenuAPI,
  MessMenu,
  MealType,
  UpdateMealItemsPayload,
  UpdateMealTimingPayload,
} from "./messmenu.api"

// ─── Query keys — single source of truth ─────────────────────────────────────
export const menuKeys = {
  all:   ()    => ["mess-menu"]            as const,
  week:  ()    => ["mess-menu", "weekly"]  as const,
  today: ()    => ["mess-menu", "today"]   as const,
}

// ─── useWeeklyMenu ────────────────────────────────────────────────────────────
/**
 * Fetches all 7 days. Cached for 5 minutes — the weekly menu rarely changes
 * mid-session, so we avoid re-fetching on every tab focus.
 */
export function useWeeklyMenu(token: string) {
  return useQuery({
    queryKey: menuKeys.week(),
    queryFn:  () => MessMenuAPI.getWeekly(token).then((r) => r.data),
    staleTime: 5 * 60 * 1000,   // 5 min
    enabled:   !!token,
  })
}

// ─── useTodayMenu ─────────────────────────────────────────────────────────────
/**
 * Today's menu with the active meal field.
 * Refetches every 10 minutes so `currentMeal` stays accurate.
 */
export function useTodayMenu(token: string) {
  return useQuery({
    queryKey: menuKeys.today(),
    queryFn:  () => MessMenuAPI.getToday(token).then((r) => r.data),
    staleTime:          10 * 60 * 1000,
    refetchInterval:    10 * 60 * 1000,
    enabled:   !!token,
  })
}

// ─── useUpdateMealItems ───────────────────────────────────────────────────────
/**
 * Add / remove items from a specific meal.
 *
 * Optimistic update: the pill list in the UI changes immediately.
 * On error, the previous data is restored automatically.
 */
export function useUpdateMealItems(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      menuId,
      mealType,
      payload,
    }: {
      menuId:   string
      mealType: MealType
      payload:  UpdateMealItemsPayload
    }) => MessMenuAPI.updateMealItems(menuId, mealType, payload, token).then((r) => r.data),

    // ── Optimistic update ───────────────────────────────────────────────────
    onMutate: async ({ menuId, mealType, payload }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic data
      await queryClient.cancelQueries({ queryKey: menuKeys.week() })

      // Snapshot the current cache value for rollback
      const previous = queryClient.getQueryData<MessMenu[]>(menuKeys.week())

      queryClient.setQueryData<MessMenu[]>(menuKeys.week(), (old = []) =>
        old.map((menu) => {
          if (menu._id !== menuId) return menu

          const currentItems = menu[mealType].items
          const removeSet    = new Set((payload.remove ?? []).map((i) => i.toLowerCase()))
          const afterRemove  = currentItems.filter((i) => !removeSet.has(i.toLowerCase()))
          const existingLow  = new Set(afterRemove.map((i) => i.toLowerCase()))
          const afterAdd     = [
            ...afterRemove,
            ...(payload.add ?? []).filter((i) => !existingLow.has(i.toLowerCase())),
          ]

          return {
            ...menu,
            [mealType]: { ...menu[mealType], items: afterAdd },
          }
        })
      )

      return { previous }   // passed to onError as context
    },

    onError: (_err, _vars, context) => {
      // Roll back to the snapshot
      if (context?.previous) {
        queryClient.setQueryData(menuKeys.week(), context.previous)
      }
    },

    onSettled: () => {
      // Always sync with the server once the mutation resolves
      queryClient.invalidateQueries({ queryKey: menuKeys.week() })
    },
  })
}

// ─── useUpdateMealTiming ──────────────────────────────────────────────────────
/**
 * Update start / end time of a single meal.
 * Optimistically patches the timing displayed in the card header.
 */
export function useUpdateMealTiming(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      menuId,
      mealType,
      payload,
    }: {
      menuId:   string
      mealType: MealType
      payload:  UpdateMealTimingPayload
    }) => MessMenuAPI.updateMealTiming(menuId, mealType, payload, token).then((r) => r.data),

    onMutate: async ({ menuId, mealType, payload }) => {
      await queryClient.cancelQueries({ queryKey: menuKeys.week() })
      const previous = queryClient.getQueryData<MessMenu[]>(menuKeys.week())

      queryClient.setQueryData<MessMenu[]>(menuKeys.week(), (old = []) =>
        old.map((menu) => {
          if (menu._id !== menuId) return menu
          return {
            ...menu,
            [mealType]: {
              ...menu[mealType],
              ...(payload.startTime && { startTime: payload.startTime }),
              ...(payload.endTime   && { endTime:   payload.endTime   }),
            },
          }
        })
      )

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(menuKeys.week(), context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.week() })
    },
  })
}