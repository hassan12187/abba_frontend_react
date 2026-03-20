// ─── Base config ─────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:8000/api/admin"
const ENDPOINT = `${BASE_URL}/subscriptions`

// ─── Types (mirrors your backend DTOs) ───────────────────────────────────────
export type PlanType = "Monthly" | "Semester" | "Pay_Per_Meal"
export type SubscriptionStatus = "Active" | "Cancelled" | "Suspended"

export interface Subscription {
  _id: string
  student: {
    _id: string
    name: string
    email: string
    rollNo: string
  }
  planType: PlanType
  status: SubscriptionStatus
  monthlyFee: number
  validUntil?: string
  createdAt: string
  updatedAt: string
}

export interface SubscriptionStats {
  byStatus: Record<SubscriptionStatus, number>
  byPlan: Record<PlanType, number>
  revenue: {
    totalMonthlyRevenue: number
    avgMonthlyFee: number
    activeCount: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus | "All"
  planType?: PlanType
  page?: number
  limit?: number
}

export interface CreateSubscriptionPayload {
  student: string
  planType?: PlanType
  monthlyFee: number
  validUntil?: string
}

export interface UpdateStatusPayload {
  status: SubscriptionStatus
  reason?: string
}

// ─── Request helper ───────────────────────────────────────────────────────────
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  const json = await res.json()

  if (!res.ok) {
    // Surface the server's error message to the caller
    throw new Error(json.message ?? `Request failed with status ${res.status}`)
  }

  return json as T
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const MessSubscriptionAPI = {
  /**
   * GET /subscriptions
   * Paginated list with optional status / planType filters.
   */
  async getAll(
    filters: SubscriptionFilters = {}
  ): Promise<PaginatedResponse<Subscription> & { success: boolean }> {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== "All") params.set("status", filters.status)
    if (filters.planType) params.set("planType", filters.planType)
    if (filters.page) params.set("page", String(filters.page))
    if (filters.limit) params.set("limit", String(filters.limit))

    const qs = params.toString()
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`)
  },

  /**
   * GET /subscriptions/stats
   */
  async getStats(): Promise<ApiResponse<SubscriptionStats>> {
    return request(`${ENDPOINT}/stats`)
  },

  /**
   * GET /subscriptions/expiring-soon?withinDays=7
   */
  async getExpiringSoon(withinDays = 7): Promise<ApiResponse<Subscription[]>> {
    return request(`${ENDPOINT}/expiring-soon?withinDays=${withinDays}`)
  },

  /**
   * GET /subscriptions/:id
   */
  async getById(id: string): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}/${id}`)
  },

  /**
   * GET /subscriptions/student/:studentId
   */
  async getByStudentId(studentId: string): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}/student/${studentId}`)
  },

  /**
   * POST /subscriptions
   */
  async create(payload: CreateSubscriptionPayload): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  /**
   * PATCH /subscriptions/:id/status
   * Controlled status transition — suspend, cancel, or reactivate.
   */
  async updateStatus(
    id: string,
    payload: UpdateStatusPayload
  ): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  /**
   * PATCH /subscriptions/:id
   * Update plan type, monthly fee, or validUntil.
   */
  async update(
    id: string,
    payload: Partial<Pick<Subscription, "planType" | "monthlyFee" | "validUntil">>
  ): Promise<ApiResponse<Subscription>> {
    return request(`${ENDPOINT}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  /**
   * DELETE /subscriptions/:id
   * Only succeeds for Cancelled subscriptions.
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    return request(`${ENDPOINT}/${id}`, { method: "DELETE" })
  },

  /**
   * POST /subscriptions/suspend-expired
   * Bulk-suspend all expired active subscriptions (cron / manual trigger).
   */
  async suspendExpired(): Promise<ApiResponse<{ modifiedCount: number }>> {
    return request(`${ENDPOINT}/suspend-expired`, { method: "POST" })
  },
}