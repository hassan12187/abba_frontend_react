"use client"

import React, { useState, type FormEvent, type ChangeEvent } from "react"
import {
  User, Mail, Phone, Lock, ShieldCheck,
  Loader2, AlertTriangle, CheckCircle2, Eye, EyeOff,
  Edit3, Save, X, Clock, CalendarDays, BadgeCheck,
  KeyRound, UserCog,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom } from "../../Store/Store"
import {
  SettingsAPI,
  type User as IUser,
  type UpdateProfileDTO,
  type ChangePasswordDTO,
} from "./settings.api.js"

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUPERADMIN: { label: "Super Admin", color: "#f59e0b",       bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.3)"  },
  ADMIN:      { label: "Admin",       color: "var(--accent)", bg: "var(--accent-lo)",     border: "rgba(99,102,241,.3)"  },
  STUDENT:    { label: "Student",     color: "var(--green)",  bg: "rgba(16,185,129,.12)", border: "rgba(16,185,129,.3)" },
}

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:       { label: "Active",       color: "var(--green)", dot: "var(--green)" },
  DISCONTINUED: { label: "Discontinued", color: "var(--red)",   dot: "var(--red)"   },
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 11,
  border: "1px solid var(--border)", background: "var(--input-bg)",
  color: "var(--text-pri)", fontSize: 13, outline: "none",
  transition: "border-color .2s",
}
const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
  textTransform: "uppercase", letterSpacing: "0.07em",
  display: "block", marginBottom: 6,
}
const sectionStyle: React.CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: 20, overflow: "hidden",
}
const sectionHeaderStyle: React.CSSProperties = {
  padding: "20px 24px", borderBottom: "1px solid var(--border)",
  display: "flex", alignItems: "center", justifyContent: "space-between",
}

// ─── Avatar with initials ─────────────────────────────────────────────────────
function ProfileAvatar({ user }: { user: IUser }) {
  const initials = user.username.slice(0, 2).toUpperCase()
  const hue      = user.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 72, height: 72, borderRadius: 22, flexShrink: 0,
      background: `hsl(${hue},45%,30%)`,
      border: `2px solid hsl(${hue},45%,45%)`,
      color: `hsl(${hue},80%,85%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em",
      fontFamily: "'DM Serif Display',serif",
      boxShadow: `0 0 0 4px hsl(${hue},45%,20%)`,
    }}>
      {initials}
    </div>
  )
}

// ─── Feedback banner ──────────────────────────────────────────────────────────
function Banner({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 14px", borderRadius: 10, fontSize: 12,
      background: type === "success" ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
      color:      type === "success" ? "var(--green)"         : "var(--red)",
      border:     `1px solid ${type === "success" ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.25)"}`,
      marginTop: 14,
    }}>
      {type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {msg}
    </div>
  )
}

// ─── Profile section ─────────────────────────────────────────────────────────
function ProfileSection({ user, token }: { user: IUser; token: string }) {
  const qc           = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState<UpdateProfileDTO>({
    username: user.username,
    phone:    user.phone ?? "",
  })
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; msg: string } | null>(null)

  const mutation = useMutation({
    mutationFn: (dto: UpdateProfileDTO) => SettingsAPI.updateProfile(dto, token),
    onSuccess: (res) => {
      qc.setQueryData(["settings", "me"], res)
      setEditing(false)
      setFeedback({ type: "success", msg: "Profile updated successfully." })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (e: Error) => setFeedback({ type: "error", msg: e.message }),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    mutation.mutate({
      username: form.username?.trim() || undefined,
      phone:    form.phone?.trim()    || null,
    })
  }

  const role   = ROLE_CFG[user.role]   ?? ROLE_CFG.STUDENT
  const status = STATUS_CFG[user.status] ?? STATUS_CFG.ACTIVE

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserCog size={16} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>Profile</span>
        </div>
        {!editing && (
          <button onClick={() => { setEditing(true); setFeedback(null) }}
            style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Edit3 size={13} /> Edit
          </button>
        )}
      </div>

      <div style={{ padding: "24px" }}>
        {/* Avatar + identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <ProfileAvatar user={user} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif", marginBottom: 6 }}>
              {user.username}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {/* Role badge */}
              <span style={{
                padding: "3px 10px", borderRadius: 20,
                fontSize: 11, fontWeight: 700,
                color: role?.color, background: role?.bg, border: `1px solid ${role?.border}`,
              }}>
                {role?.label}
              </span>
              {/* Status dot */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: status?.color }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: status?.dot }} />
                {status?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Info tiles */}
        {!editing ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: <User  size={14}/>, label: "Username", value: user.username },
              { icon: <Mail  size={14}/>, label: "Email",    value: user.email },
              { icon: <Phone size={14}/>, label: "Phone",    value: user.phone ?? "Not set" },
              {
                icon: <Clock size={14}/>, label: "Last Login",
                value: user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Never",
              },
              {
                icon: <CalendarDays size={14}/>, label: "Member Since",
                value: new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
              },
              { icon: <BadgeCheck size={14}/>, label: "Role", value: role?.label },
            ].map(f => (
              <div key={f.label} style={{ padding: "12px 14px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", marginBottom: 4 }}>
                  {f.icon}
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: f.value === "Not set" ? "var(--text-muted)" : "var(--text-pri)", fontStyle: f.value === "Not set" ? "italic" : "normal" }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input value={form.username ?? ""} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required minLength={3} maxLength={30} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
            </div>

            {/* Email is read-only */}
            <div>
              <label style={labelStyle}>Email <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(cannot be changed)</span></label>
              <input value={user.email} disabled style={{ ...inputStyle, opacity: .5, cursor: "not-allowed" }} />
            </div>

            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone ?? ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+92 300 0000000" maxLength={15} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
            </div>

            {feedback && <Banner type={feedback.type} msg={feedback.msg} />}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={() => { setEditing(false); setFeedback(null) }} disabled={mutation.isPending}
                style={{ flex: 1, padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <X size={13} /> Cancel
              </button>
              <button type="submit" disabled={mutation.isPending}
                style={{ flex: 1, padding: 10, borderRadius: 12, border: "none", background: mutation.isPending ? "var(--border)" : "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {mutation.isPending ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Saving…</> : <><Save size={13} />Save Changes</>}
              </button>
            </div>
          </form>
        )}

        {feedback && !editing && <Banner type={feedback.type} msg={feedback.msg} />}
      </div>
    </div>
  )
}

// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection({ token }: { token: string }) {
  const [form, setForm] = useState<ChangePasswordDTO>({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; msg: string } | null>(null)

  const mutation = useMutation({
    mutationFn: (dto: ChangePasswordDTO) => SettingsAPI.changePassword(dto, token),
    onSuccess: (res) => {
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setFeedback({ type: "success", msg: res.message ?? "Password changed successfully." })
      setTimeout(() => setFeedback(null), 5000)
    },
    onError: (e: Error) => setFeedback({ type: "error", msg: e.message }),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    if (form.newPassword !== form.confirmPassword) {
      setFeedback({ type: "error", msg: "New passwords do not match." })
      return
    }
    if (form.newPassword.length < 8) {
      setFeedback({ type: "error", msg: "New password must be at least 8 characters." })
      return
    }
    if (form.newPassword === form.currentPassword) {
      setFeedback({ type: "error", msg: "New password must be different from your current password." })
      return
    }
    mutation.mutate(form)
  }

  const strength = (() => {
    const p = form.newPassword
    if (!p) return null
    let score = 0
    if (p.length >= 8)             score++
    if (p.length >= 12)            score++
    if (/[A-Z]/.test(p))           score++
    if (/[0-9]/.test(p))           score++
    if (/[^A-Za-z0-9]/.test(p))   score++
    if (score <= 1) return { label: "Weak",   color: "var(--red)",   width: 25  }
    if (score <= 2) return { label: "Fair",   color: "var(--amber)", width: 50  }
    if (score <= 3) return { label: "Good",   color: "#06b6d4",      width: 75  }
    return             { label: "Strong", color: "var(--green)", width: 100 }
  })()

  const fields = [
    { key: "currentPassword" as const, label: "Current Password",      showKey: "current" as const },
    { key: "newPassword"     as const, label: "New Password",          showKey: "new"     as const },
    { key: "confirmPassword" as const, label: "Confirm New Password",  showKey: "confirm" as const },
  ]

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <KeyRound size={16} color="var(--amber)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>Change Password</span>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={show[f.showKey] ? "text" : "password"}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required disabled={mutation.isPending}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShow(p => ({ ...p, [f.showKey]: !p[f.showKey] }))}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  {show[f.showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength meter — only on new password field */}
              {f.key === "newPassword" && strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${strength.width}%`, background: strength.color, borderRadius: 2, transition: "width .3s ease, background .3s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: strength.color, marginTop: 4 }}>
                    {strength.label} password
                  </div>
                </div>
              )}
            </div>
          ))}

          {feedback && <Banner type={feedback.type} msg={feedback.msg} />}

          <button type="submit" disabled={mutation.isPending}
            style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: mutation.isPending ? "var(--border)" : "var(--amber)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "flex-start", minWidth: 160 }}>
            {mutation.isPending ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Updating…</> : <><Lock size={13} />Update Password</>}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Security info section ────────────────────────────────────────────────────
function SecuritySection({ user }: { user: IUser }) {
  const items = [
    {
      icon: <ShieldCheck size={18} />,
      label: "Account Status",
      value: user.status === "ACTIVE" ? "Your account is active and in good standing." : "Your account has been discontinued.",
      color: user.status === "ACTIVE" ? "var(--green)" : "var(--red)",
    },
    {
      icon: <Clock size={18} />,
      label: "Last Login",
      value: user.lastLoginAt
        ? `Last seen on ${new Date(user.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
        : "No previous login recorded.",
      color: "var(--text-sec)",
    },
    {
      icon: <BadgeCheck size={18} />,
      label: "Role & Permissions",
      value: {
        SUPERADMIN: "Full system access — can manage all admins and settings.",
        ADMIN:      "Administrative access — can manage students, rooms, and reports.",
        STUDENT:    "Student access — limited to personal information.",
      }[user.role] ?? "Standard access.",
      color: ROLE_CFG[user.role]?.color ?? "var(--text-sec)",
    },
  ]

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} color="var(--green)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>Security Overview</span>
        </div>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)" }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: `color-mix(in srgb, ${item.color} 10%, transparent)`,
              color: item.color,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, color: item.color, lineHeight: 1.5 }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[200, 260, 180].map((h, i) => (
        <div key={i} style={{ height: h, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, animation: "shimmer 1.4s ease-in-out infinite" }} />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Settings: React.FC = () => {
  const { token } = useCustom() as { token: string }

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "me"],
    queryFn:  () => SettingsAPI.getMe(token),
    staleTime:5 * 60_000,
    enabled:  !!token,
  })

  const user = data?.data

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>Settings</h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>Manage your profile, password, and account security</p>
      </div>

      {isLoading && <SettingsSkeleton />}

      {error!=undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 12, background: "rgba(239,68,68,.1)", color: "var(--red)", fontSize: 13, border: "1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15} />{(error as unknown as Error).message}
        </div>
      )}

      {user && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ProfileSection  user={user} token={token} />
            <PasswordSection token={token} />
          </div>

          {/* Right column */}
          <SecuritySection user={user} />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

export default Settings