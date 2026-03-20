// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE_URL = "http://localhost:8000/api/admin"
const ENDPOINT = `${BASE_URL}/applications`

// ─── Types ────────────────────────────────────────────────────────────────────
export type ApplicationStatus = "pending" | "accepted" | "approved" | "rejected"
export type Gender             = "male" | "female"

export interface Application {
  _id:                     string
  student_roll_no:         number
  student_name:            string
  student_email:           string
  student_cellphone?:      string
  student_reg_no?:         string
  father_name:             string
  father_cellphone?:       string
  guardian_name?:          string
  guardian_cellphone?:     string
  cnic_no?:                string
  active_whatsapp_no?:     string
  postal_address?:         string
  permanent_address?:      string
  city?:                   string
  province?:               string
  date_of_birth?:          string
  academic_year?:          string
  gender?:                 Gender
  status:                  ApplicationStatus
  messEnabled:             boolean
  isActive?:               boolean
  hostelJoinDate?:         string
  hostelLeaveDate?:        string
  application_submit_date: string
  student_image?:          string
  room_id?: {
    _id:        string
    room_no:    string
    floor?:     string
    block?:     string
    capacity?:  number
  }
  createdAt: string
  updatedAt: string
}

export interface ApplicationStats {
  byStatus: Record<ApplicationStatus, number>
  byGender: Record<Gender, number>
  access: {
    totalActive:  number
    messEnabled:  number
    withRoom:     number
    total:        number
  }
}

export interface PaginatedApplications {
  success:    boolean
  data:       Application[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface ApplicationFilters {
  status?:        ApplicationStatus | "All"
  gender?:        Gender
  academic_year?: string
  search?:        string
  page?:          number
  limit?:         number
  sortBy?:        "application_submit_date" | "student_name" | "createdAt"
  sortOrder?:     "asc" | "desc"
}

export interface UpdateStatusPayload {
  status: ApplicationStatus
  reason?: string
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

// ─── API ──────────────────────────────────────────────────────────────────────
export const StudentApplicationAPI = {

  getAll(filters: ApplicationFilters, token: string): Promise<PaginatedApplications> {
    const p = new URLSearchParams()
    if (filters.status && filters.status !== "All") p.set("status",        filters.status)
    if (filters.gender)                              p.set("gender",        filters.gender)
    if (filters.academic_year)                       p.set("academic_year", filters.academic_year)
    if (filters.search)                              p.set("search",        filters.search)
    if (filters.page)                                p.set("page",          String(filters.page))
    if (filters.limit)                               p.set("limit",         String(filters.limit))
    if (filters.sortBy)                              p.set("sortBy",        filters.sortBy)
    if (filters.sortOrder)                           p.set("sortOrder",     filters.sortOrder)
    const qs = p.toString()
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`, token)
  },

  getById(id: string, token: string): Promise<{ success: boolean; data: Application }> {
    return request(`${ENDPOINT}/${id}`, token)
  },

  getStats(token: string): Promise<{ success: boolean; data: ApplicationStats }> {
    return request(`${ENDPOINT}/stats`, token)
  },

  updateStatus(
    id:      string,
    payload: UpdateStatusPayload,
    token:   string
  ): Promise<{ success: boolean; message: string; data: Application }> {
    return request(`${ENDPOINT}/${id}/status`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },
}