import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom }              from "../../Store/Store"
import { useState, useCallback }  from "react"
import { ApplicationFilters, Application } from "../StudentApplications/studentapplication.api"
import {StudentsAPI,BlocksAPI,RoomsAPI} from "./student.api";
import { RoomAPI }   from "./room.api"
import { applicationKeys }        from "../StudentApplications/studentapplication.queries";

// ─── Room query keys ──────────────────────────────────────────────────────────
export const roomKeys = {
  blocks:          ()          => ["blocks"]            as const,
  roomsByBlock:    (id: string) => ["rooms", "block", id] as const,
}

// ─── useBlocks ────────────────────────────────────────────────────────────────
export function useBlocks(token: string) {
  return useQuery({
    queryKey:  roomKeys.blocks(),
    queryFn:   () => RoomAPI.getBlocks(token).then((r) => r.data),
    staleTime: 10 * 60_000,   // blocks rarely change
    enabled:   !!token,
  })
}

// ─── useRoomsByBlock ──────────────────────────────────────────────────────────
export function useRoomsByBlock(blockId: string | null, token: string) {
  return useQuery({
    queryKey:  roomKeys.roomsByBlock(blockId!),
    queryFn:   () => RoomAPI.getRoomsByBlock(blockId!, token).then((r) => r.data),
    staleTime: 60_000,
    enabled:   !!token && !!blockId,
  })
}

// ─── useAssignRoom ────────────────────────────────────────────────────────────
export function useAssignRoom(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, roomId }: { studentId: string; roomId: string | null }) =>
      StudentsAPI.assignRoom(studentId, roomId, token),

    onSuccess: (_data, { studentId }) => {
      // Invalidate list + the specific student detail
      queryClient.invalidateQueries({ queryKey: applicationKeys.all() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(studentId) })
      // Also invalidate room availability — a bed was just taken/freed
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
    },
  })
}

// ─── useStudents — composite hook used by the Students page ───────────────────
export function useStudents() {
  const { token } = useCustom()

  const [filters, setFiltersState] = useState<ApplicationFilters>({
    status:    "approved",   // Students page shows approved + accepted only
    page:      1,
    limit:     10,
    sortBy:    "student_name",
    sortOrder: "asc",
  })

  const setFilters = useCallback((partial: Partial<ApplicationFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }))
  }, [])

  const listQuery = useQuery({
    queryKey:        applicationKeys.list(filters),
    queryFn:         () => StudentsAPI.getAll(filters, token),
    staleTime:       60_000,
    enabled:         !!token,
    placeholderData: (prev) => prev,
  })

  // Fetch detail for the currently selected student (for the modal)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey:  applicationKeys.detail(selectedId!),
    queryFn:   () => StudentsAPI.getById(selectedId!, token).then((r) => r.data),
    staleTime: 30_000,
    enabled:   !!token && !!selectedId,
  })

  const assignRoom = useAssignRoom(token)

  return {
    // List
    students:   listQuery.data?.data       ?? [],
    total:      listQuery.data?.total      ?? 0,
    totalPages: listQuery.data?.totalPages ?? 1,
    isLoading:  listQuery.isLoading,
    error:      listQuery.error?.message   ?? null,

    // Filters
    filters,
    setFilters,

    // Selected student detail
    selectedId,
    setSelectedId,
    selectedStudent:        detailQuery.data          ?? null,
    isLoadingStudentDetail: detailQuery.isLoading,

    // Room assignment
    assignRoom:     (studentId: string, roomId: string | null) =>
      assignRoom.mutateAsync({ studentId, roomId }),
    isAssigning:    assignRoom.isPending,
    assignError:    assignRoom.error?.message ?? null,

    token,
  }
}