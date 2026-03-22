// ─────────────────────────────────────────────────────────────────────────────
// notification.api.ts  —  types + API client, fully self-contained
// ─────────────────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = [
  "new_application",
  "application_accepted",
  "application_approved",
  "application_rejected",
  "payment_received",
  "complaint_submitted",
  "complaint_resolved",
  "invoice_generated",
  "subscription_expiring",
  "room_assigned",
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

// ─── Icon / color config for the UI ──────────────────────────────────────────
export const NOTIFICATION_CFG: Record<NotificationType, { color: string; bg: string }> = {
  new_application:      { color: "var(--accent)", bg: "var(--accent-lo)"       },
  application_accepted: { color: "#06b6d4",       bg: "rgba(6,182,212,.10)"    },
  application_approved: { color: "var(--green)",  bg: "rgba(16,185,129,.10)"   },
  application_rejected: { color: "var(--red)",    bg: "rgba(239,68,68,.10)"    },
  payment_received:     { color: "var(--green)",  bg: "rgba(16,185,129,.10)"   },
  complaint_submitted:  { color: "var(--amber)",  bg: "rgba(245,158,11,.10)"   },
  complaint_resolved:   { color: "var(--green)",  bg: "rgba(16,185,129,.10)"   },
  invoice_generated:    { color: "#8b5cf6",       bg: "rgba(139,92,246,.10)"   },
  subscription_expiring:{ color: "var(--amber)",  bg: "rgba(245,158,11,.10)"   },
  room_assigned:        { color: "var(--accent)", bg: "var(--accent-lo)"       },
}

// ─── Core shape ───────────────────────────────────────────────────────────────
export interface Notification {
  _id:        string
  type:       NotificationType
  title:      string
  message:    string
  audience:   "admin" | "student" | "all"
  recipient:  string | null
  isRead:     boolean
  entityId:   string | null
  entityType: string | null
  meta:       Record<string, any>
  createdAt:  string
}

export interface PaginatedNotificationsResponse {
  success:     boolean
  data:        Notification[]
  total:       number
  page:        number
  limit:       number
  totalPages:  number
  unreadCount: number
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:8000/api"

async function request<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res  = await fetch(url, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── Admin notification API ───────────────────────────────────────────────────
export const AdminNotificationAPI = {

  /** GET /admin/notifications?isRead=&type=&page=&limit= */
  getAll(
    params: { isRead?: boolean; type?: NotificationType; page?: number; limit?: number },
    token: string
  ): Promise<PaginatedNotificationsResponse> {
    const p = new URLSearchParams()
    if (params.isRead   !== undefined) p.set("isRead", String(params.isRead))
    if (params.type)                   p.set("type",   params.type)
    if (params.page)                   p.set("page",   String(params.page))
    if (params.limit)                  p.set("limit",  String(params.limit))
    return request(`${BASE}/admin/notifications?${p.toString()}`, token)
  },

  /** PATCH /admin/notifications/mark-read — mark all as read */
  markAllRead(token: string): Promise<{ success: boolean; message: string }> {
    return request(`${BASE}/admin/notifications/mark-read`, token, { method: "PATCH" })
  },

  /** PATCH /admin/notifications/:id/read */
  markOneRead(id: string, token: string): Promise<{ success: boolean }> {
    return request(`${BASE}/admin/notifications/${id}/read`, token, { method: "PATCH" })
  },

  /** DELETE /admin/notifications/:id */
  deleteOne(id: string, token: string): Promise<{ success: boolean }> {
    return request(`${BASE}/admin/notifications/${id}`, token, { method: "DELETE" })
  },

  /** DELETE /admin/notifications — clear all */
  clearAll(token: string): Promise<{ success: boolean }> {
    return request(`${BASE}/admin/notifications`, token, { method: "DELETE" })
  },
}

// ─── Student notification API ─────────────────────────────────────────────────
export const StudentNotificationAPI = {

  /** GET /student/notifications */
  getAll(
    params: { isRead?: boolean; page?: number; limit?: number },
    token: string
  ): Promise<PaginatedNotificationsResponse> {
    const p = new URLSearchParams()
    if (params.isRead !== undefined) p.set("isRead", String(params.isRead))
    if (params.page)                 p.set("page",   String(params.page))
    if (params.limit)                p.set("limit",  String(params.limit))
    return request(`${BASE}/student/notifications?${p.toString()}`, token)
  },

  /** PATCH /student/notifications/mark-read */
  markAllRead(token: string): Promise<{ success: boolean; message: string }> {
    return request(`${BASE}/student/notifications/mark-read`, token, { method: "PATCH" })
  },

  /** DELETE /student/notifications */
  clearAll(token: string): Promise<{ success: boolean }> {
    return request(`${BASE}/student/notifications`, token, { method: "DELETE" })
  },
}