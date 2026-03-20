// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE_URL = "http://localhost:8000/api/admin"
const ENDPOINT = `${BASE_URL}/invoices`

// ─── Types ────────────────────────────────────────────────────────────────────
export type InvoiceStatus = "Paid" | "Partially Paid" | "Pending" | "Overdue" | "Cancelled"
export type PaymentMethod = "Cash" | "Bank Transfer" | "Online" | "Cheque"

export interface LineItem {
  description: string
  amount:      number
  paid:        number
}

export interface Invoice {
  _id:           string
  invoiceNumber: string
  student_name:  string
  student_id:    string
  room_no?:      string
  room_id?:      string
  billingMonth:  string
  totalAmount:   number
  totalPaid:     number
  balanceDue:    number
  status:        InvoiceStatus
  dueDate:       string
  issueDate:     string
  isLocked:      boolean
  generatedBy:   "AUTO" | "MANUAL"
  lineItems:     LineItem[]
  createdAt:     string
}

export interface InvoiceStats {
  byStatus:         Record<InvoiceStatus, number>
  totalRevenue:     number
  totalOutstanding: number
  overdueCount:     number
  collectionRate:   number
}

export interface PaginatedInvoices {
  success:    boolean
  data:       Invoice[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface StudentLookup {
  student_id:      string
  student_name:    string
  student_roll_no: number
  room_id:         string | null
  room_no:         string
}

export interface AddPaymentPayload {
  amount:        number
  paymentMethod: PaymentMethod
  note?:         string
}

export interface AddPaymentResult {
  invoiceNumber: string
  totalPaid:     number
  balanceDue:    number
  status:        InvoiceStatus
  paymentId:     string
}

export interface CreateInvoicePayload {
  student_id:   string
  room_id?:     string
  billingMonth: string
  dueDate:      string
  lineItems:    { description: string; amount: number }[]
  generatedBy?: "AUTO" | "MANUAL"
}

export interface InvoiceFilters {
  status?:       InvoiceStatus | "All"
  billingMonth?: string
  student_id?:   string
  page?:         number
  limit?:        number
  sortBy?:       "createdAt" | "dueDate" | "totalAmount"
  sortOrder?:    "asc" | "desc"
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
  console.log(json);
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const FeeInvoiceAPI = {

  /** GET /invoices — paginated list with optional filters */
  getAll(filters: InvoiceFilters, token: string): Promise<PaginatedInvoices> {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== "All") params.set("status",       filters.status)
    if (filters.billingMonth)                        params.set("billingMonth", filters.billingMonth)
    if (filters.student_id)                          params.set("student_id",   filters.student_id)
    if (filters.page)                                params.set("page",         String(filters.page))
    if (filters.limit)                               params.set("limit",        String(filters.limit))
    if (filters.sortBy)                              params.set("sortBy",       filters.sortBy)
    if (filters.sortOrder)                           params.set("sortOrder",    filters.sortOrder)
    const qs = params.toString()
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`, token)
  },

  /** GET /invoices/:id — single invoice with populated payments */
  getById(id: string, token: string): Promise<{ success: boolean; data: Invoice }> {
    return request(`${ENDPOINT}/${id}`, token)
  },

  /** GET /invoices/stats — dashboard KPIs */
  getStats(token: string): Promise<{ success: boolean; data: InvoiceStats }> {
    return request(`${ENDPOINT}/stats`, token)
  },

  /** GET /invoices/students/search?q=<rollNo> — student lookup while creating invoice */
  searchStudent(rollNo: string, token: string): Promise<{ success: boolean; data: StudentLookup }> {
    return request(`${ENDPOINT}/students/search?q=${encodeURIComponent(rollNo)}`, token)
  },

  /** POST /invoices/:invoiceId/payments — record a payment */
  addPayment(
    invoiceId: string,
    payload:   AddPaymentPayload,
    token:     string
  ): Promise<{ success: boolean; message: string; data: AddPaymentResult }> {
    return request(`${ENDPOINT}/${invoiceId}/payments`, token, {
      method: "POST",
      body:   JSON.stringify(payload),
    })
  },

  /** PATCH /invoices/:id/cancel — cancel an invoice */
  cancelInvoice(
    id:     string,
    reason: string,
    token:  string
  ): Promise<{ success: boolean; message: string; data: Invoice }> {
    return request(`${ENDPOINT}/${id}/cancel`, token, {
      method: "PATCH",
      body:   JSON.stringify({ reason }),
    })
  },

  /** POST /invoices — create a new invoice */
  createInvoice(
    payload: CreateInvoicePayload,
    token:   string
  ): Promise<{ success: boolean; message: string; data: Invoice }> {
    return request(`${ENDPOINT}`, token, {
      method: "POST",
      body:   JSON.stringify(payload),
    })
  },

    /** GET /invoices/templates — fee templates (Redis-cached on server) */
  getTemplates(token: string): Promise<{ success: boolean; data: unknown[] }> {
    return request(`${ENDPOINT}/templates`, token)
  },
}