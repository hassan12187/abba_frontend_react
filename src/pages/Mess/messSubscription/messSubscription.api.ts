// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE_URL = "http://localhost:8000/api/admin"
const ENDPOINT = `${BASE_URL}/subscriptions`

// ─── Types ────────────────────────────────────────────────────────────────────
export type PlanType           = "Monthly" | "Semester" | "Pay_Per_Meal"
export type SubscriptionStatus = "Active"  | "Cancelled" | "Suspended"

export interface Subscription {
  _id:        string
  student: {
    _id:    string
    student_name:   string
    student_email:  string
    student_roll_no: string
  }
  planType:   PlanType
  status:     SubscriptionStatus
  monthlyFee: number
  validUntil?: string
  createdAt:  string
  updatedAt:  string
}

export interface SubscriptionStats {
  byStatus: Record<SubscriptionStatus, number>
  byPlan:   Record<PlanType, number>
  revenue: {
    totalMonthlyRevenue: number
    avgMonthlyFee:       number
    activeCount:         number
  }
}

export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface ApiResponse<T> {
  success:  boolean
  message?: string
  data:     T
}

export interface SubscriptionFilters {
  status?:   SubscriptionStatus | "All"
  planType?: PlanType
  page?:     number
  limit?:    number
}

export interface CreateSubscriptionPayload {
  student:    string        // ObjectId — field name is "student" not "student_id"
  planType?:  PlanType
  monthlyFee: number
  validUntil?: string      // ISO 8601 datetime — required for Monthly/Semester, omit for Pay_Per_Meal
}

export interface UpdateStatusPayload {
  status:  SubscriptionStatus
  reason?: string
}

// ─── Request helper — NOW passes token on every call ─────────────────────────
async function request<T>(
  url:     string,
  token:   string,
  options?: RequestInit
): Promise<T> {
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
export const MessSubscriptionAPI = {

  /** GET /subscriptions — paginated list */
  getAll(
    filters: SubscriptionFilters = {},
    token:   string
  ): Promise<PaginatedResponse<Subscription> & { success: boolean }> {
    const p = new URLSearchParams()
    if (filters.status && filters.status !== "All") p.set("status",   filters.status)
    if (filters.planType)                            p.set("planType", filters.planType)
    if (filters.page)                                p.set("page",     String(filters.page))
    if (filters.limit)                               p.set("limit",    String(filters.limit))
    const qs = p.toString()
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`, token)
  },

  /** GET /subscriptions/stats */
  getStats(token: string): Promise<ApiResponse<SubscriptionStats>> {
    return request(`${ENDPOINT}/stats`, token)
  },

  /** GET /subscriptions/student/:studentId — check if student already has one */
  getByStudentId(studentId: string, token: string): Promise<ApiResponse<Subscription | null>> {
    return request(`${ENDPOINT}/student/${studentId}`, token)
  },

  /**
   * POST /subscriptions — create a new mess subscription.
   *
   * Payload notes:
   *  - `student`    → ObjectId string (field name, not student_id)
   *  - `monthlyFee` → positive number, rounded to 2dp (backend validates with .transform)
   *  - `validUntil` → required for Monthly/Semester, omit for Pay_Per_Meal
   *  - `planType`   → optional, defaults to "Monthly" server-side
   */
  create(
    payload: CreateSubscriptionPayload,
    token:   string
  ): Promise<ApiResponse<Subscription>> {
    // Round fee before sending to avoid multipleOf(0.01) validation issues
    const safePayload = {
      ...payload,
      monthlyFee: Math.round(payload.monthlyFee * 100) / 100,
    }
    return request(`${ENDPOINT}`, token, {
      method: "POST",
      body:   JSON.stringify(safePayload),
    })
  },

  /** PATCH /subscriptions/:id/status */
  updateStatus(
    id:      string,
    payload: UpdateStatusPayload,
    token:   string
  ): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}/${id}/status`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },

  /** PATCH /subscriptions/:id */
  update(
    id:      string,
    payload: Partial<Pick<Subscription, "planType" | "monthlyFee" | "validUntil">>,
    token:   string
  ): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },

  /** DELETE /subscriptions/:id — only for Cancelled subscriptions */
  delete(id: string, token: string): Promise<ApiResponse<null>> {
    return request(`${ENDPOINT}/${id}`, token, { method: "DELETE" })
  },
}