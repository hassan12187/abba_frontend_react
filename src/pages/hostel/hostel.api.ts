// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE_URL = "http://localhost:8000/api/admin"

// ─── Types ────────────────────────────────────────────────────────────────────
export type BlockStatus = "under construction" | "ready" | "maintenance"
export type RoomType    = "Single Seater" | "Double Seater" | "Triple Seater"
export type RoomStatus  = "available" | "occupied" | "maintenance"

export interface Block {
  _id:          string
  block_no:     string
  total_rooms:  number
  description?: string
  status:       BlockStatus
  createdAt:    string
  updatedAt:    string
}

export interface BlockSummary extends Block {
  room_count:      number
  available_rooms: number
  occupied_rooms:  number
  total_occupants: number
}

export interface BlockStats {
  total:          number
  byStatus:       Record<BlockStatus, number>
  totalRooms:     number
  totalOccupants: number
}

export interface Room {
  _id:            string
  room_no:        string
  type:           RoomType
  fees:           number
  capacity:       number
  available_beds: number          // virtual
  status:         RoomStatus
  block_id?: {
    _id:      string
    block_no: string
    status:   BlockStatus
  }
  occupants?: {
    _id:             string
    student_name:    string
    student_roll_no: number
    status:          string
  }[]
  amenities?: { _id: string; name: string }[]
}

export interface RoomStats {
  byStatus:       Record<RoomStatus, number>
  byType:         Record<RoomType, number>
  totalCapacity:  number
  totalOccupants: number
  availableBeds:  number
  occupancyRate:  number
  avgFees:        number
  totalRooms:     number
}

export interface PaginatedResponse<T> {
  success:    boolean
  data:       T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface BlockFilters {
  status?:    BlockStatus
  search?:    string
  page?:      number
  limit?:     number
  sortBy?:    "block_no" | "createdAt"
  sortOrder?: "asc" | "desc"
}

export interface RoomFilters {
  block_id?:  string
  type?:      RoomType
  status?:    RoomStatus
  available?: boolean
  search?:    string
  page?:      number
  limit?:     number
  sortBy?:    "room_no" | "fees" | "capacity"
  sortOrder?: "asc" | "desc"
}

export interface CreateBlockPayload {
  block_no:     string
  total_rooms:  number
  description?: string
  status?:      BlockStatus
}

export interface UpdateBlockPayload {
  block_no?:    string
  total_rooms?: number
  description?: string
  status?:      BlockStatus
}

export interface CreateRoomPayload {
  room_no:   string
  type?:     RoomType
  fees:      number
  capacity?: number
  block_id:  string
  status?:   RoomStatus
}

export interface UpdateRoomPayload {
  room_no?:  string
  type?:     RoomType
  fees?:     number
  capacity?: number
  status?:   RoomStatus
}

// ─── Request helper ───────────────────────────────────────────────────────────
async function request<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── Blocks API ───────────────────────────────────────────────────────────────
export const BlocksAPI = {

  getAll(filters: BlockFilters, token: string): Promise<PaginatedResponse<Block>> {
    const p = new URLSearchParams()
    if (filters.status)    p.set("status",    filters.status)
    if (filters.search)    p.set("search",    filters.search)
    if (filters.page)      p.set("page",      String(filters.page))
    if (filters.limit)     p.set("limit",     String(filters.limit))
    if (filters.sortBy)    p.set("sortBy",    filters.sortBy)
    if (filters.sortOrder) p.set("sortOrder", filters.sortOrder)
    return request(`${BASE_URL}/blocks?${p.toString()}`, token)
  },

  getById(id: string, token: string): Promise<{ success: boolean; data: Block }> {
    return request(`${BASE_URL}/blocks/${id}`, token)
  },

  getOverview(token: string): Promise<{ success: boolean; data: BlockSummary[] }> {
    return request(`${BASE_URL}/blocks/overview`, token)
  },

  getStats(token: string): Promise<{ success: boolean; data: BlockStats }> {
    return request(`${BASE_URL}/blocks/stats`, token)
  },

  create(payload: CreateBlockPayload, token: string): Promise<{ success: boolean; message: string; data: Block }> {
    return request(`${BASE_URL}/blocks`, token, {
      method: "POST",
      body:   JSON.stringify(payload),
    })
  },

  update(id: string, payload: UpdateBlockPayload, token: string): Promise<{ success: boolean; message: string; data: Block }> {
    return request(`${BASE_URL}/blocks/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },

  delete(id: string, token: string): Promise<{ success: boolean; message: string }> {
    return request(`${BASE_URL}/blocks/${id}`, token, { method: "DELETE" })
  },
}

// ─── Rooms API ────────────────────────────────────────────────────────────────
export const RoomsAPI = {

  getAll(filters: RoomFilters, token: string): Promise<PaginatedResponse<Room>> {
    const p = new URLSearchParams()
    if (filters.block_id)              p.set("block_id",  filters.block_id)
    if (filters.type)                  p.set("type",      filters.type)
    if (filters.status)                p.set("status",    filters.status)
    if (filters.available !== undefined) p.set("available", String(filters.available))
    if (filters.search)                p.set("search",    filters.search)
    if (filters.page)                  p.set("page",      String(filters.page))
    if (filters.limit)                 p.set("limit",     String(filters.limit))
    if (filters.sortBy)                p.set("sortBy",    filters.sortBy)
    if (filters.sortOrder)             p.set("sortOrder", filters.sortOrder)
    return request(`${BASE_URL}/rooms?${p.toString()}`, token)
  },

  getById(id: string, token: string): Promise<{ success: boolean; data: Room }> {
    return request(`${BASE_URL}/rooms/${id}`, token)
  },

  getByBlock(blockId: string, token: string, availableOnly = false): Promise<{ success: boolean; data: Room[] }> {
    return request(`${BASE_URL}/blocks/${blockId}/rooms${availableOnly ? "?available=true" : ""}`, token)
  },

  getStats(token: string, blockId?: string): Promise<{ success: boolean; data: RoomStats }> {
    const qs = blockId ? `?block_id=${blockId}` : ""
    return request(`${BASE_URL}/rooms/stats${qs}`, token)
  },

  create(payload: CreateRoomPayload, token: string): Promise<{ success: boolean; message: string; data: Room }> {
    return request(`${BASE_URL}/rooms`, token, {
      method: "POST",
      body:   JSON.stringify(payload),
    })
  },

  update(id: string, payload: UpdateRoomPayload, token: string): Promise<{ success: boolean; message: string; data: Room }> {
    return request(`${BASE_URL}/rooms/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },

  updateStatus(id: string, status: RoomStatus, token: string): Promise<{ success: boolean; message: string; data: Room }> {
    return request(`${BASE_URL}/rooms/${id}/status`, token, {
      method: "PATCH",
      body:   JSON.stringify({ status }),
    })
  },

  delete(id: string, token: string): Promise<{ success: boolean; message: string }> {
    return request(`${BASE_URL}/rooms/${id}`, token, { method: "DELETE" })
  },
}