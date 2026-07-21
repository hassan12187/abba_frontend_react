"use client"

import React, { useState, type FormEvent, type ChangeEvent } from "react"
import { useNavigate, NavLink } from "react-router-dom"
import { Eye, EyeOff, Loader2, AlertTriangle, Building2, Lock, Mail } from "lucide-react"
import { useCustom } from "../../Store/Store"

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE =
  `${import.meta.env.VITE_API_URL}/api` ||
  "http://localhost:8000/api"

async function loginRequest(email: string, password: string) {
  const res  = await fetch(`${BASE}/auth/login`, {
    method:      "POST",
    credentials: "include",           // sends/receives the httpOnly refresh token cookie
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Login failed.")
  return json   // { success, accessToken, data: { role, username, applicationId, … } }
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Field({
  id, label, type = "text", value, onChange,
  placeholder, disabled, error, icon, right,
}: {
  id: string; label: string; type: string
  value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string|undefined; disabled?: boolean|undefined; error?: string|undefined
  icon:  React.ReactNode
  right?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 12, fontWeight: 600, color: "var(--text-sec)",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          color: focused ? "var(--accent)" : "var(--text-muted)",
          display: "flex", transition: "color .2s", pointerEvents: "none",
        }}>
          {icon}
        </span>
        <input
          id={id} type={type} value={value}
          onChange={onChange} placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          style={{
            width: "100%", padding: "12px 14px 12px 42px",
            paddingRight: right ? 46 : 14,
            borderRadius: 12,
            border: `1.5px solid ${error ? "var(--red)" : focused ? "var(--accent)" : "var(--border)"}`,
            background: "var(--input-bg)",
            color: "var(--text-pri)", fontSize: 14, outline: "none",
            transition: "border-color .2s",
            opacity: disabled ? .6 : 1,
          }}
        />
        {right && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {right}
          </span>
        )}
      </div>
      {error && (
        <span style={{ fontSize: 11, color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
          <AlertTriangle size={11} />{error}
        </span>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Login: React.FC = () => {
  const { setToken } = useCustom() as { setToken: (t: string) => void }
  const navigate     = useNavigate()

  const [email,       setEmail]       = useState("")
  const [password,    setPassword]    = useState("")
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string|undefined ; password?: string|undefined }>({})

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof fieldErrors = {}
    if (!email.trim())          errs.email    = "Email is required."
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address."
    if (!password)              errs.password = "Password is required."
    else if (password.length < 8) errs.password = "Password must be at least 8 characters."
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const result = await loginRequest(email.trim().toLowerCase(), password)

      // Store the access token
      setToken(result.accessToken)

      // Route by role
      const role = result.data?.role
      if (role === "ADMIN" || role === "SUPERADMIN") {
        navigate("/")
      } else if (role === "STUDENT") {
        navigate("/student/dashboard")
      } else {
        navigate("/")
      }
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", fontFamily: "'DM Sans',sans-serif", padding: 20,
      position: "relative", overflow: "hidden",
    }}>

      {/* Background decoration */}
      <div style={{
        position: "absolute", top: "-30%", right: "-15%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 24, padding: "40px 36px",
        boxShadow: "var(--shadow)",
        animation: "fadeUp .35s ease",
        position: "relative", zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: "0 auto 14px",
            background: "var(--accent-lo)", border: "1.5px solid rgba(99,102,241,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px rgba(99,102,241,.2)",
          }}>
            <Building2 size={26} color="var(--accent)" />
          </div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif",
            letterSpacing: "-0.02em",
          }}>
            HostelMS
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <Field
            id="email" label="Email Address" type="email"
            value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })) }}
            placeholder="admin@hostel.com"
            disabled={loading} error={fieldErrors.email}
            icon={<Mail size={16} />}
          />

          <Field
            id="password" label="Password"
            type={showPw ? "text" : "password"}
            value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })) }}
            placeholder="Enter your password"
            disabled={loading} error={fieldErrors.password}
            icon={<Lock size={16} />}
            right={
              <button type="button" onClick={() => setShowPw(p => !p)} disabled={loading}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Remember + Forgot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "var(--text-sec)" }}>
              <input type="checkbox" style={{ accentColor: "var(--accent)", width: 14, height: 14 }} />
              Remember me
            </label>
            <NavLink to="/forgot-password" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Forgot password?
            </NavLink>
          </div>

          {/* Server error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 14px", borderRadius: 12,
              background: "rgba(239,68,68,.10)", color: "var(--red)",
              border: "1px solid rgba(239,68,68,.25)", fontSize: 13,
              animation: "fadeUp .2s ease",
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              padding: "13px", borderRadius: 14, border: "none",
              background: loading ? "var(--border)" : "var(--accent)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background .2s, transform .15s",
              boxShadow: loading ? "none" : "0 0 28px var(--accent-glow)",
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)" }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} />Signing in…</>
              : "Sign In"
            }
          </button>
        </form>

        {/* Footer */}
        {/* <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 11, color: "var(--text-muted)",
        }}>
          <Lock size={11} />
        
        </div> */}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

export default Login