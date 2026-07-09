// ─────────────────────────────────────────────────────────────────────────────
// settings.api.ts  —  types + API client, fully self-contained
// ─────────────────────────────────────────────────────────────────────────────

export const USER_ROLES    = ["ADMIN", "STUDENT", "SUPERADMIN"] as const
export const USER_STATUSES = ["ACTIVE", "DISCONTINUED"]         as const

export type UserRole   = (typeof USER_ROLES)[number]
export type UserStatus = (typeof USER_STATUSES)[number]

// ─── Core user shape (what the API returns — no password/tokens) ──────────────
export interface User {
  _id:          string
  username:     string
  email:        string
  phone:        string | null
  avatar:       string | null
  role:         UserRole
  status:       UserStatus
  isFirstLogin: boolean
  lastLoginAt:  string | null
  createdAt:    string
  updatedAt:    string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface UpdateProfileDTO {
  username?: string|undefined
  phone?:    string | null
}

export interface ChangePasswordDTO {
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}

// ─── Response shapes ──────────────────────────────────────────────────────────
export interface UserResponse {
  success: boolean
  message?: string
  data:    User
}

export interface MessageResponse {
  success: boolean
  message: string
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
// const BASE =
//   (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
//   process.env.NEXT_PUBLIC_API_URL ||
//   "http://localhost:5000/api"
const BASE = "http://localhost:8000/api"

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

export const SettingsAPI = {

  /** GET /auth/me — fetch current user profile */
  getMe(token: string): Promise<UserResponse> {
    return request(`${BASE}/auth/me`, token)
  },

  /** PATCH /auth/me — update username or phone */
  updateProfile(dto: UpdateProfileDTO, token: string): Promise<UserResponse> {
    return request(`${BASE}/auth/me`, token, {
      method: "PATCH",
      body:   JSON.stringify(dto),
    })
  },

  /** PATCH /auth/me/password — change password */
  changePassword(dto: ChangePasswordDTO, token: string): Promise<MessageResponse> {
    return request(`${BASE}/auth/me/password`, token, {
      method: "PATCH",
      body:   JSON.stringify(dto),
    })
  },
}