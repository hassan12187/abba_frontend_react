import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom } from "../../Store/Store"
import { useState, useCallback } from "react"
import {
  BlocksAPI, RoomsAPI,
  Block, Room,
  BlockFilters, RoomFilters,
  CreateBlockPayload, UpdateBlockPayload,
  CreateRoomPayload, UpdateRoomPayload,
  RoomStatus,
} from "./hostel.api.js"

// ─── Query keys ───────────────────────────────────────────────────────────────
export const hostelKeys = {
  blocks:        ()                      => ["blocks"]                       as const,
  blockList:     (f: BlockFilters)       => ["blocks", "list",   f]          as const,
  blockDetail:   (id: string)            => ["blocks", "detail", id]         as const,
  blockOverview: ()                      => ["blocks", "overview"]           as const,
  blockStats:    ()                      => ["blocks", "stats"]              as const,
  rooms:         ()                      => ["rooms"]                        as const,
  roomList:      (f: RoomFilters)        => ["rooms",  "list",   f]          as const,
  roomDetail:    (id: string)            => ["rooms",  "detail", id]         as const,
  roomsByBlock:  (blockId: string)       => ["rooms",  "block",  blockId]    as const,
  roomStats:     (blockId?: string)      => ["rooms",  "stats",  blockId]    as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useBlockList(filters: BlockFilters, token: string) {
  return useQuery({
    queryKey:        hostelKeys.blockList(filters),
    queryFn:         () => BlocksAPI.getAll(filters, token),
    staleTime:       60_000,
    enabled:         !!token,
    placeholderData: (prev) => prev,
  })
}

export function useBlockDetail(id: string | null, token: string) {
  return useQuery({
    queryKey:  hostelKeys.blockDetail(id!),
    queryFn:   () => BlocksAPI.getById(id!, token).then((r) => r.data),
    staleTime: 30_000,
    enabled:   !!token && !!id,
  })
}

export function useBlockOverview(token: string) {
  return useQuery({
    queryKey:  hostelKeys.blockOverview(),
    queryFn:   () => BlocksAPI.getOverview(token).then((r) => r.data),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })
}

export function useBlockStats(token: string) {
  return useQuery({
    queryKey:  hostelKeys.blockStats(),
    queryFn:   () => BlocksAPI.getStats(token).then((r) => r.data),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })
}

export function useCreateBlock(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBlockPayload) => BlocksAPI.create(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.blocks() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.blockStats() })
    },
  })
}

export function useUpdateBlock(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBlockPayload }) =>
      BlocksAPI.update(id, payload, token),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.blocks() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.blockDetail(id) })
      queryClient.invalidateQueries({ queryKey: hostelKeys.blockOverview() })
    },
  })
}

export function useDeleteBlock(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => BlocksAPI.delete(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.blocks() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.blockStats() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.blockOverview() })
    },
  })
}

// ─── useBlocks composite hook ─────────────────────────────────────────────────
export function useBlocks() {
  const { token } = useCustom()
  const [filters, setFiltersState] = useState<BlockFilters>({
    page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc",
  })

  const setFilters = useCallback((partial: Partial<BlockFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  return {
    ...useBlockList(filters, token),
    stats:        useBlockStats(token),
    createBlock:  useCreateBlock(token),
    updateBlock:  useUpdateBlock(token),
    deleteBlock:  useDeleteBlock(token),
    filters,
    setFilters,
    token,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useRoomList(filters: RoomFilters, token: string) {
  return useQuery({
    queryKey:        hostelKeys.roomList(filters),
    queryFn:         () => RoomsAPI.getAll(filters, token),
    staleTime:       60_000,
    enabled:         !!token,
    placeholderData: (prev) => prev,
  })
}

export function useRoomDetail(id: string | null, token: string) {
  return useQuery({
    queryKey:  hostelKeys.roomDetail(id!),
    queryFn:   () => RoomsAPI.getById(id!, token).then((r) => r.data),
    staleTime: 30_000,
    enabled:   !!token && !!id,
  })
}

export function useRoomStats(token: string, blockId?: string) {
  return useQuery({
    queryKey:  hostelKeys.roomStats(blockId),
    queryFn:   () => RoomsAPI.getStats(token, blockId).then((r) => r.data),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })
}

export function useCreateRoom(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => RoomsAPI.create(payload, token),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomStats() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomsByBlock(vars.block_id) })
    },
  })
}

export function useUpdateRoom(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoomPayload }) =>
      RoomsAPI.update(id, payload, token),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomDetail(id) })
    },
  })
}

export function useUpdateRoomStatus(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) =>
      RoomsAPI.updateStatus(id, status, token),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomDetail(id) })
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomStats() })
    },
  })
}

export function useDeleteRoom(token: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => RoomsAPI.delete(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomStats() })
    },
  })
}

// ─── useRooms composite hook ──────────────────────────────────────────────────
export function useRooms() {
  const { token } = useCustom()
  const [filters, setFiltersState] = useState<RoomFilters>({
    page: 1, limit: 10, sortBy: "room_no", sortOrder: "asc",
  })

  const setFilters = useCallback((partial: Partial<RoomFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  return {
    ...useRoomList(filters, token),
    roomStats:    useRoomStats(token),
    createRoom:   useCreateRoom(token),
    updateRoom:   useUpdateRoom(token),
    updateStatus: useUpdateRoomStatus(token),
    deleteRoom:   useDeleteRoom(token),
    filters,
    setFilters,
    token,
  }
}