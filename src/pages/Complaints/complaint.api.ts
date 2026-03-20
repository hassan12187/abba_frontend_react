// ─────────────────────────────────────────────────────────────────────────────
// complaint.api.ts  —  types + API client, fully self-contained
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ────────────────────────────────────────────────────────────────────
export const COMPLAINT_PRIORITIES = ["high", "medium", "low"] as const
export const COMPLAINT_CATEGORIES = [
  "electrical", "plumbing", "cleaning", "furniture", "internet", "other",
] as const
export const COMPLAINT_STATUSES = [
  "Pending", "In Progress", "Resolved", "Rejected",
] as const

export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number]
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]
export type ComplaintStatus   = (typeof COMPLAINT_STATUSES)[number]

// ─── Nested shapes ────────────────────────────────────────────────────────────
export interface ComplaintStudent {
  _id:             string
  student_name:    string
  student_roll_no: string | number
  student_email:   string
}

export interface ComplaintRoom {
  _id:     string
  room_no: string
  floor?:  string
  block?:  string
}

export interface StatusHistoryEntry {
  status:     ComplaintStatus
  changed_at: string
  note?:      string
}

// ─── Core shape ───────────────────────────────────────────────────────────────
export interface Complaint {
  _id:                    string
  student_id:             ComplaintStudent
  room_id:                ComplaintRoom
  title:                  string
  description:            string
  priority:               ComplaintPriority
  category:               ComplaintCategory
  status:                 ComplaintStatus
  assigned_to?:           string | null
  admin_comments?:        string | null
  resolved_at?:           string | null
  resolution_time_hours?: number | null
  status_history:         StatusHistoryEntry[]
  createdAt:              string
  updatedAt:              string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface CreateComplaintDTO {
  student_id:   string
  room_id:      string
  title:        string
  description:  string
  priority?:    ComplaintPriority
  category?:    ComplaintCategory
}

export interface UpdateComplaintDTO {
  title?:          string
  description?:    string
  priority?:       ComplaintPriority
  category?:       ComplaintCategory
  assigned_to?:    string | null
  admin_comments?: string
}

export interface UpdateStatusDTO {
  status:          ComplaintStatus
  admin_comments?: string
  note?:           string
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface ComplaintFilters {
  status?:    ComplaintStatus | "All"
  priority?:  ComplaintPriority | ""
  category?:  ComplaintCategory | ""
  search?:    string
  from?:      string
  to?:        string
  page?:      number
  limit?:     number
  sortBy?:    "createdAt" | "updatedAt" | "priority"
  sortOrder?: "asc" | "desc"
}

// ─── Response shapes ──────────────────────────────────────────────────────────
export interface PaginatedComplaintsResponse {
  success:    boolean
  data:       Complaint[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface SingleComplaintResponse {
  success:  boolean
  data:     Complaint
  message?: string
}

export interface ComplaintStats {
  byStatus:            Partial<Record<ComplaintStatus,   number>>
  byPriority:          Partial<Record<ComplaintPriority, number>>
  byCategory:          Partial<Record<ComplaintCategory, number>>
  total:               number
  avgResolutionHours:  number | null
  pendingHighPriority: number
}

export interface ComplaintStatsResponse {
  success: boolean
  data:    ComplaintStats
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE= "http://localhost:8000/api"
//   const BASE =
//   (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
//   process.env.NEXT_PUBLIC_API_URL ||
//   "http://localhost:5000/api"

const ENDPOINT = `${BASE}/admin/complaints`

// ─── Request helper ───────────────────────────────────────────────────────────
async function request<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res  = await fetch(url, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── QS builder ───────────────────────────────────────────────────────────────
function buildQS(f: ComplaintFilters): string {
  const p = new URLSearchParams()
  if (f.status   && f.status   !== "All") p.set("status",    f.status)
  if (f.priority && f.priority !== "")    p.set("priority",  f.priority)
  if (f.category && f.category !== "")    p.set("category",  f.category)
  if (f.search)                           p.set("search",    f.search.trim())
  if (f.from)                             p.set("from",      f.from)
  if (f.to)                               p.set("to",        f.to)
  if (f.page)                             p.set("page",      String(f.page))
  if (f.limit)                            p.set("limit",     String(f.limit))
  if (f.sortBy)                           p.set("sortBy",    f.sortBy)
  if (f.sortOrder)                        p.set("sortOrder", f.sortOrder)
  return p.toString()
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const ComplaintAPI = {

  /** GET /admin/complaints?... — paginated + filtered list */
  getAll(filters: ComplaintFilters, token: string): Promise<PaginatedComplaintsResponse> {
    const qs = buildQS(filters)
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`, token)
  },

  /** GET /admin/complaints/stats — dashboard KPI counters */
  getStats(token: string): Promise<ComplaintStatsResponse> {
    return request(`${ENDPOINT}/stats`, token)
  },

  /** GET /admin/complaints/:id — detail with populated student + room */
  getById(id: string, token: string): Promise<SingleComplaintResponse> {
    return request(`${ENDPOINT}/${id}`, token)
  },

  /** POST /admin/complaints — create a new complaint */
  create(dto: CreateComplaintDTO, token: string): Promise<SingleComplaintResponse> {
    return request(ENDPOINT, token, {
      method: "POST",
      body:   JSON.stringify(dto),
    })
  },

  /**
   * PATCH /admin/complaints/:id
   * Update title / description / priority / category / assignment / admin_comments.
   * At least one field required.
   */
  update(id: string, dto: UpdateComplaintDTO, token: string): Promise<SingleComplaintResponse> {
    return request(`${ENDPOINT}/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(dto),
    })
  },

  /**
   * PATCH /admin/complaints/:id/status
   * Controlled transition with server-side guard.
   * Allowed transitions:
   *   Pending     → In Progress | Rejected
   *   In Progress → Resolved | Rejected | Pending
   *   Resolved    → (terminal)
   *   Rejected    → Pending
   */
  updateStatus(id: string, dto: UpdateStatusDTO, token: string): Promise<SingleComplaintResponse> {
    return request(`${ENDPOINT}/${id}/status`, token, {
      method: "PATCH",
      body:   JSON.stringify(dto),
    })
  },

  /** DELETE /admin/complaints/:id */
  delete(id: string, token: string): Promise<{ success: boolean; message: string }> {
    return request(`${ENDPOINT}/${id}`, token, { method: "DELETE" })
  },
}