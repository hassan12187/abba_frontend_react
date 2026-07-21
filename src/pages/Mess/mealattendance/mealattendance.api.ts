// ─────────────────────────────────────────────────────────────────────────────
// attendance.api.ts  —  types + API client, fully self-contained
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ────────────────────────────────────────────────────────────────────
export const MEAL_TYPES    = ["Breakfast", "Lunch", "Dinner"] as const
export const MEAL_STATUSES = ["Present",   "Absent", "Leave"] as const

export type MealType   = (typeof MEAL_TYPES)[number]
export type MealStatus = (typeof MEAL_STATUSES)[number]

// ─── Nested shapes ────────────────────────────────────────────────────────────
export interface AttendanceStudent {
  _id:             string
  student_name:    string
  student_roll_no: string | number
  student_email:   string
}

// ─── Core shape ───────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  _id:      string
  student:  AttendanceStudent
  date:     string           // ISO datetime
  mealType: MealType
  status:   MealStatus
  markedAt: string | null
  note:     string | null
  createdAt:string
  updatedAt:string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface MarkAttendanceDTO {
  student:  string           // ObjectId
  date:     string           // YYYY-MM-DD
  mealType: MealType
  status:   MealStatus
  note?:    string
}

export interface BulkMarkDTO {
  date:     string           // YYYY-MM-DD
  mealType: MealType
  records: {
    student: string          // ObjectId
    status:  MealStatus
    note?:   string
  }[]
}

export interface UpdateAttendanceDTO {
  status?: MealStatus
  note?:   string
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface AttendanceFilters {
  date?:      string         // YYYY-MM-DD  exact day
  from?:      string         // YYYY-MM-DD
  to?:        string         // YYYY-MM-DD
  mealType?:  MealType  | ""
  status?:    MealStatus | ""
  student?:   string         // ObjectId
  page?:      number
  limit?:     number
  sortOrder?: "asc" | "desc"
}

// ─── Response shapes ──────────────────────────────────────────────────────────
export interface PaginatedAttendanceResponse {
  success:    boolean
  data:       AttendanceRecord[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface SingleAttendanceResponse {
  success:  boolean
  data:     AttendanceRecord
  message?: string
}

export interface BulkMarkResponse {
  success:  boolean
  message:  string
  data: {
    upserted: number
    modified: number
    total:    number
  }
}

export interface DailyMealSummary {
  date:          string      // YYYY-MM-DD
  mealType:      MealType
  present:       number
  absent:        number
  onLeave:       number
  total:         number
  attendancePct: number
}

export interface DailySummaryResponse {
  success: boolean
  data:    DailyMealSummary[]
}

export interface StudentAttendanceSummary {
  student:         AttendanceStudent
  totalMeals:      number
  present:         number
  absent:          number
  onLeave:         number
  attendancePct:   number
  byMeal:          Record<MealType, { present: number; absent: number; onLeave: number }>
}

export interface StudentSummaryResponse {
  success: boolean
  data:    StudentAttendanceSummary
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
// const BASE =
//   (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
//   process.env.NEXT_PUBLIC_API_URL ||
//   "http://localhost:5000/api"
const BASE= `${import.meta.env.VITE_API_URL}/api` || "http://localhost:8000/api"

const ENDPOINT = `${BASE}/admin/attendance`

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
function buildQS(f: AttendanceFilters): string {
  const p = new URLSearchParams()
  if (f.date     )                  p.set("date",      f.date)
  if (f.from     )                  p.set("from",      f.from)
  if (f.to       )                  p.set("to",        f.to)
  if (f.mealType && f.mealType !== undefined) p.set("mealType",  f.mealType)
  if (f.status   && f.status   !== undefined) p.set("status",    f.status)
  if (f.student  )                  p.set("student",   f.student)
  if (f.page     )                  p.set("page",      String(f.page))
  if (f.limit    )                  p.set("limit",     String(f.limit))
  if (f.sortOrder)                  p.set("sortOrder", f.sortOrder)
  return p.toString()
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const AttendanceAPI = {

  /**
   * GET /admin/attendance
   * Paginated list with optional filters.
   * Use date= for a single day, or from= + to= for a range.
   */
  getAll(filters: AttendanceFilters, token: string): Promise<PaginatedAttendanceResponse> {
    const qs = buildQS(filters)
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`, token)
  },

  /** GET /admin/attendance/:id */
  getById(id: string, token: string): Promise<SingleAttendanceResponse> {
    return request(`${ENDPOINT}/${id}`, token)
  },

  /**
   * GET /admin/attendance/stats/daily?from=&to=&mealType=
   * Returns day-by-day present/absent/leave counts for the chart.
   */
  getDailySummary(
    params: { from?: string; to?: string; mealType?: MealType },
    token:  string
  ): Promise<DailySummaryResponse> {
    const p = new URLSearchParams()
    if (params.from)     p.set("from",     params.from)
    if (params.to)       p.set("to",       params.to)
    if (params.mealType) p.set("mealType", params.mealType)
    return request(`${ENDPOINT}/stats/daily?${p.toString()}`, token)
  },

  /**
   * GET /admin/attendance/stats/student/:studentId?from=&to=
   * Full breakdown for one student over a date range.
   */
  getStudentSummary(
    studentId: string,
    params:    { from?: string; to?: string },
    token:     string
  ): Promise<StudentSummaryResponse> {
    const p = new URLSearchParams()
    if (params.from) p.set("from", params.from)
    if (params.to)   p.set("to",   params.to)
    return request(`${ENDPOINT}/stats/student/${studentId}?${p.toString()}`, token)
  },

  /**
   * POST /admin/attendance
   * Mark or update a single meal record (upserts on student+date+mealType).
   */
  mark(dto: MarkAttendanceDTO, token: string): Promise<SingleAttendanceResponse> {
    return request(ENDPOINT, token, {
      method: "POST",
      body:   JSON.stringify(dto),
    })
  },

  /**
   * POST /admin/attendance/bulk
   * Mark all students for a meal in one call.
   * records: [{ student, status, note? }]
   * Max 500 records per call.
   */
  bulkMark(dto: BulkMarkDTO, token: string): Promise<BulkMarkResponse> {
    return request(`${ENDPOINT}/bulk`, token, {
      method: "POST",
      body:   JSON.stringify(dto),
    })
  },

  /**
   * PATCH /admin/attendance/:id
   * Update status or note on an existing record.
   */
  update(id: string, dto: UpdateAttendanceDTO, token: string): Promise<SingleAttendanceResponse> {
    return request(`${ENDPOINT}/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(dto),
    })
  },

  /** DELETE /admin/attendance/:id */
  delete(id: string, token: string): Promise<{ success: boolean; message: string }> {
    return request(`${ENDPOINT}/${id}`, token, { method: "DELETE" })
  },
}