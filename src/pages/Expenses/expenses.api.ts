// ─────────────────────────────────────────────────────────────────────────────
// expense.api.ts  —  types + API client, no external type imports needed
// ─────────────────────────────────────────────────────────────────────────────

// ─── Category enum ────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "Salary",
  "Utilities",
  "Maintenance",
  "Food",
  "Rent",
  "Equipment",
  "Miscellaneous",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// ─── Core model shape ─────────────────────────────────────────────────────────
export interface Expense {
  _id:         string
  description: string
  amount:      number
  category:    ExpenseCategory
  date:        string           // ISO datetime string from MongoDB
  note?:       string
  createdAt:   string
  updatedAt:   string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface CreateExpenseDTO {
  description: string
  amount:      number
  category?:   ExpenseCategory  // defaults to "Miscellaneous" server-side
  date?:       string           // YYYY-MM-DD; defaults to today server-side
  note?:       string
}

export type UpdateExpenseDTO = Partial<CreateExpenseDTO>

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface ExpenseFilters {
  category?:  ExpenseCategory | ""
  from?:      string            // YYYY-MM-DD
  to?:        string            // YYYY-MM-DD
  search?:    string            // description full-text search
  page?:      number
  limit?:     number
  sortBy?:    "date" | "amount" | "createdAt"
  sortOrder?: "asc" | "desc"
}

// ─── API response shapes ──────────────────────────────────────────────────────
export interface PaginatedExpensesResponse {
  success:     boolean
  data:        Expense[]
  total:       number           // total matching records (all pages)
  page:        number
  limit:       number
  totalPages:  number
  totalAmount: number           // sum of amount across ALL matching records
}

export interface SingleExpenseResponse {
  success:  boolean
  data:     Expense
  message?: string
}

export interface DeleteExpenseResponse {
  success: boolean
  message: string
}

export interface ExpenseStats {
  byCategory:  Partial<Record<ExpenseCategory, { count: number; amount: number }>>
  totalAmount: number
  totalCount:  number
  thisMonth:   number           // sum for current calendar month
  lastMonth:   number           // sum for previous calendar month
}

export interface ExpenseStatsResponse {
  success: boolean
  data:    ExpenseStats
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE = "http://localhost:8000/api"
// const BASE =
//   (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
//   process.env.NEXT_PUBLIC_API_URL ||
//   "http://localhost:5000/api"

const ENDPOINT = `${BASE}/admin/expenses`

// ─── Request helper ───────────────────────────────────────────────────────────
async function request<T>(
  url:    string,
  token:  string,
  opts?:  RequestInit
): Promise<T> {
  const res = await fetch(url, {
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

// ─── Query string builder ─────────────────────────────────────────────────────
function buildQS(filters: ExpenseFilters): string {
  const p = new URLSearchParams()
  if (filters.category  && filters.category !== "")  p.set("category",  filters.category)
  if (filters.from)      p.set("from",      filters.from)
  if (filters.to)        p.set("to",        filters.to)
  if (filters.search)    p.set("search",    filters.search.trim())
  if (filters.page)      p.set("page",      String(filters.page))
  if (filters.limit)     p.set("limit",     String(filters.limit))
  if (filters.sortBy)    p.set("sortBy",    filters.sortBy)
  if (filters.sortOrder) p.set("sortOrder", filters.sortOrder)
  return p.toString()
}

// ─── API client ───────────────────────────────────────────────────────────────
export const ExpenseAPI = {

  /**
   * GET /admin/expenses?category=&from=&to=&search=&page=&limit=&sortBy=&sortOrder=
   * Returns paginated list + totalAmount across all matching records.
   */
  getAll(
    filters: ExpenseFilters,
    token:   string
  ): Promise<PaginatedExpensesResponse> {
    const qs = buildQS(filters)
    return request(`${ENDPOINT}${qs ? `?${qs}` : ""}`, token)
  },

  /**
   * GET /admin/expenses/stats
   * Returns totals by category, this month vs last month.
   */
  getStats(token: string): Promise<ExpenseStatsResponse> {
    return request(`${ENDPOINT}/stats`, token)
  },

  /**
   * GET /admin/expenses/:id
   * Returns a single expense by MongoDB ObjectId.
   */
  getById(id: string, token: string): Promise<SingleExpenseResponse> {
    return request(`${ENDPOINT}/${id}`, token)
  },

  /**
   * POST /admin/expenses
   * Body: { description, amount, category?, date?, note? }
   * - amount is rounded to 2dp server-side
   * - date defaults to today if omitted
   * - category defaults to "Miscellaneous" if omitted
   */
  create(
    dto:   CreateExpenseDTO,
    token: string
  ): Promise<SingleExpenseResponse> {
    return request(ENDPOINT, token, {
      method: "POST",
      body:   JSON.stringify(dto),
    })
  },

  /**
   * PATCH /admin/expenses/:id
   * Body: any subset of { description, amount, category, date, note }
   * At least one field required.
   */
  update(
    id:    string,
    dto:   UpdateExpenseDTO,
    token: string
  ): Promise<SingleExpenseResponse> {
    return request(`${ENDPOINT}/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(dto),
    })
  },

  /**
   * DELETE /admin/expenses/:id
   * Returns { success, message }.
   */
  delete(id: string, token: string): Promise<DeleteExpenseResponse> {
    return request(`${ENDPOINT}/${id}`, token, { method: "DELETE" })
  },
}