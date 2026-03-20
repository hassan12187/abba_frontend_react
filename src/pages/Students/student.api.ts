const BASE_URL = "http://localhost:8000/api/admin"
// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"

// ─── Types ────────────────────────────────────────────────────────────────────
export type ApplicationStatus = "pending" | "accepted" | "approved" | "rejected"

export interface Room {
  _id:             string
  room_no:         string
  floor?:          string
  block?:          string
  total_beds?:     number
  available_beds?: number
}

export interface Block {
  _id:      string
  block_no: string
}

export interface Student {
  _id:                     string
  student_name:            string
  student_email:           string
  student_cellphone?:      string
  student_reg_no?:         string
  student_roll_no?:        number
  father_name:             string
  cnic_no?:                string
  postal_address?:         string
  permanent_address?:      string
  city?:                   string
  province?:               string
  academic_year?:          string
  gender?:                 "male" | "female"
  status:                  ApplicationStatus
  messEnabled:             boolean
  isActive?:               boolean
  hostelJoinDate?:         string
  hostelLeaveDate?:        string
  application_submit_date: string
  room_id?:                Room
  createdAt:               string
  updatedAt:               string
}

export interface StudentFilters {
  status?:    ApplicationStatus | "All"
  search?:    string
  page?:      number
  limit?:     number
  sortBy?:    "student_name" | "createdAt" | "application_submit_date"
  sortOrder?: "asc" | "desc"
}

export interface PaginatedStudents {
  success:    boolean
  data:       Student[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface StudentStats {
  byStatus: Record<ApplicationStatus, number>
  byGender: Record<"male" | "female", number>
  access: {
    totalActive: number
    messEnabled: number
    withRoom:    number
    total:       number
  }
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

// ─── Students API ─────────────────────────────────────────────────────────────
// Students are student_application documents.
// The Students page filters to accepted + approved by default.
// All operations go through /applications.

export const StudentsAPI = {

  /**
   * GET /applications
   * Paginated list — pass status filter to narrow to accepted/approved.
   */
  getAll(filters: StudentFilters, token: string): Promise<PaginatedStudents> {
    const params = new URLSearchParams()

    if (filters.status && filters.status !== "All")
      params.set("status",    filters.status)
    if (filters.search)
      params.set("search",    filters.search)
    if (filters.page)
      params.set("page",      String(filters.page))
    if (filters.limit)
      params.set("limit",     String(filters.limit))
    if (filters.sortBy)
      params.set("sortBy",    filters.sortBy)
    if (filters.sortOrder)
      params.set("sortOrder", filters.sortOrder)

    const qs = params.toString()
    return request(`${BASE_URL}/applications${qs ? `?${qs}` : ""}`, token)
  },

  /**
   * GET /applications/:id
   * Single student with room, payments, and other refs populated.
   */
  getById(id: string, token: string): Promise<{ success: boolean; data: Student }> {
    return request(`${BASE_URL}/applications/${id}`, token)
  },

  /**
   * GET /applications/stats
   * Aggregated counts by status, gender, and access flags.
   */
  getStats(token: string): Promise<{ success: boolean; data: StudentStats }> {
    return request(`${BASE_URL}/applications/stats`, token)
  },

  /**
   * PATCH /applications/:id/room
   * Assign a room by passing { room_id: "<ObjectId>" }.
   * Unassign by passing { room_id: null }.
   * Only works for students with status "approved".
   */
  assignRoom(
    studentId: string,
    roomId:    string | null,
    token:     string
  ): Promise<{ success: boolean; message: string; data: Student }> {
    return request(`${BASE_URL}/applications/${studentId}/room`, token, {
      method: "PATCH",
      body:   JSON.stringify({ room_id: roomId }),
    })
  },

  /**
   * PATCH /applications/:id/access
   * Toggle messEnabled and/or isActive flags.
   * Mess can only be enabled for approved students (enforced server-side).
   */
  toggleAccess(
    studentId: string,
    payload:   { messEnabled?: boolean; isActive?: boolean },
    token:     string
  ): Promise<{ success: boolean; data: Student }> {
    return request(`${BASE_URL}/applications/${studentId}/access`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },
}

// ─── Blocks API ───────────────────────────────────────────────────────────────

export const BlocksAPI = {
  /**
   * GET /blocks
   * All hostel blocks — used to populate the block selector in room assignment.
   */
  getAll(token: string): Promise<{ success: boolean; data: Block[] }> {
    return request(`${BASE_URL}/blocks`, token)
  },
}

// ─── Rooms API ────────────────────────────────────────────────────────────────

export const RoomsAPI = {
  /**
   * GET /rooms?block_id=<id>&available=true
   * Rooms in a specific block that still have available beds.
   */
  getByBlock(
    blockId: string,
    token:   string
  ): Promise<{ success: boolean; data: Room[] }> {
    return request(
      `${BASE_URL}/rooms?block_id=${encodeURIComponent(blockId)}&available=true`,
      token
    )
  },
}