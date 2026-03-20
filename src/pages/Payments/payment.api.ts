// ─── Enums ────────────────────────────────────────────────────────────────────
export type PaymentMethod = "Cash" | "Bank Transfer" | "Online" | "Cheque"
export type PaymentStatus = "successful" | "pending" | "failed"

// ─── Shapes returned by the API ───────────────────────────────────────────────
export interface PaymentStudent {
  _id:             string
  student_name:    string
  student_roll_no: string | number
  student_email:   string
}

export interface PaymentInvoiceRef {
  invoiceId:      string
  invoiceNumber?: string
  amountApplied:  number
}

export interface PopulatedPayment {
  _id:           string
  student:       PaymentStudent
  invoices:      PaymentInvoiceRef[]
  totalAmount:   number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentDate:   string          // ISO string
  transactionId?: string
  note?:         string
  createdAt:     string
}

// ─── API response wrappers ────────────────────────────────────────────────────
export interface PaginatedPaymentsResponse {
  success:     boolean
  data:        PopulatedPayment[]
  total:       number
  page:        number
  limit:       number
  totalPages:  number
  totalAmount: number            // sum of ALL matching records, not just this page
}

export interface SinglePaymentResponse {
  success: boolean
  data:    PopulatedPayment
  message?: string
}

export interface PaymentStatsResponse {
  success: boolean
  data: {
    byStatus: Record<PaymentStatus, { count: number; amount: number }>
    byMethod: Record<PaymentMethod, { count: number; amount: number }>
    totalAmount: number
    totalCount:  number
  }
}

// ─── Filters used by the list query ──────────────────────────────────────────
export interface PaymentFilters {
  student_roll_no?: string
  paymentDate?:     string           // YYYY-MM-DD
  fromDate?:        string           // YYYY-MM-DD
  toDate?:          string           // YYYY-MM-DD
  paymentMethod?:   PaymentMethod | ""
  paymentStatus?:   PaymentStatus  | ""
  page?:            number
  limit?:           number
  sortBy?:          "paymentDate" | "totalAmount" | "createdAt"
  sortOrder?:       "asc" | "desc"
}

// ─── API client ───────────────────────────────────────────────────────────────
// const BASE = (import.meta as any).env?.VITE_API_URL
//   ?? (process.env.NEXT_PUBLIC_API_URL)
//   ?? "http://localhost:8000/api"
const BASE = "http://localhost:8000/api";

const ENDPOINT = `${BASE}/admin/payments`

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

export const PaymentAPI = {

  /**
   * GET /admin/payments
   * Paginated list with optional filters.
   */
  getAll(filters: PaymentFilters, token: string): Promise<PaginatedPaymentsResponse> {
    const p = new URLSearchParams()
    if (filters.student_roll_no) p.set("student_roll_no", filters.student_roll_no)
    if (filters.paymentDate)     p.set("paymentDate",     filters.paymentDate)
    if (filters.fromDate)        p.set("fromDate",        filters.fromDate)
    if (filters.toDate)          p.set("toDate",          filters.toDate)
    if (filters.paymentMethod)   p.set("paymentMethod",   filters.paymentMethod)
    if (filters.paymentStatus)   p.set("paymentStatus",   filters.paymentStatus)
    if (filters.page)            p.set("page",            String(filters.page))
    if (filters.limit)           p.set("limit",           String(filters.limit))
    if (filters.sortBy)          p.set("sortBy",          filters.sortBy)
    if (filters.sortOrder)       p.set("sortOrder",       filters.sortOrder)
    return request(`${ENDPOINT}?${p.toString()}`, token)
  },

  /**
   * GET /admin/payments/stats
   * KPI totals: by status, by method, grand total.
   */
  getStats(token: string): Promise<PaymentStatsResponse> {
    return request(`${ENDPOINT}/stats`, token)
  },

  /**
   * GET /admin/payments/:id
   * Single payment with fully populated student + invoice refs.
   */
  getById(id: string, token: string): Promise<SinglePaymentResponse> {
    return request(`${ENDPOINT}/${id}`, token)
  },
}