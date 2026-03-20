"use client"

import React, { useState, useCallback, type ChangeEvent } from "react"
import {
  Eye, Check, X, Search, User, GraduationCap,
  Home, Loader2, AlertTriangle, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, FileText, Filter,
} from "lucide-react"
import { useStudentApplications } from "./studentapplication.queries"
import { useDebounce }            from "../../components/hooks/useDebounce"
import type { Application, ApplicationStatus } from "./studentapplication.api"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ApplicationStatus, {
  label: string; color: string; bg: string; dot: string; border: string; icon: React.ReactNode
}> = {
  pending:  { label: "Pending",  color: "var(--amber)",  bg: "rgba(245,158,11,.10)", dot: "var(--amber)",  border: "rgba(245,158,11,.25)", icon: <Clock        size={11} /> },
  accepted: { label: "Accepted", color: "#06b6d4",       bg: "rgba(6,182,212,.10)",  dot: "#06b6d4",       border: "rgba(6,182,212,.25)",  icon: <CheckCircle2 size={11} /> },
  approved: { label: "Approved", color: "var(--green)",  bg: "rgba(16,185,129,.10)", dot: "var(--green)",  border: "rgba(16,185,129,.25)", icon: <CheckCircle2 size={11} /> },
  rejected: { label: "Rejected", color: "var(--red)",    bg: "rgba(239,68,68,.10)",  dot: "var(--red)",    border: "rgba(239,68,68,.25)",  icon: <XCircle      size={11} /> },
}

const ACTION_CFG = {
  accept:  { title: "Accept Application",  desc: "Moves the application to Accepted — next step is full approval.", btn: "Accept",   color: "#06b6d4",      bg: "rgba(6,182,212,.12)",  newStatus: "accepted" as ApplicationStatus },
  approve: { title: "Approve Application", desc: "Fully approves the student for hostel admission.",                btn: "Approve",  color: "var(--green)", bg: "rgba(16,185,129,.12)", newStatus: "approved" as ApplicationStatus },
  reject:  { title: "Reject Application",  desc: "This will permanently reject the application.",                   btn: "Reject",   color: "var(--red)",   bg: "rgba(239,68,68,.12)",  newStatus: "rejected" as ApplicationStatus },
}

type ActionKey = keyof typeof ACTION_CFG

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const hue      = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
      background: `hsl(${hue},40%,28%)`, border: `1px solid hsl(${hue},40%,38%)`,
      color: `hsl(${hue},70%,82%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
    }}>
      {initials}
    </div>
  )
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ApplicationStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, desc, value, colorVar, isLoading }: {
  icon: React.ReactNode; label: string; desc: string
  value: number; colorVar: string; isLoading: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "20px 22px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "transform .2s, box-shadow .2s, border-color .2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "var(--stat-shadow)" : "none",
        cursor: "default",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${colorVar} 12%, transparent)`,
        color: colorVar,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>
          {isLoading
            ? <span style={{ display: "inline-block", width: 50, height: 20, borderRadius: 6, background: "var(--border)", animation: "shimmer 1.4s ease-in-out infinite" }} />
            : value
          }
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
      gap: 16, alignItems: "center",
      padding: "14px 24px", borderBottom: "1px solid var(--border)",
      animation: "shimmer 1.4s ease-in-out infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--border)", flexShrink: 0 }} />
        <div>
          <div style={{ width: 120, height: 12, borderRadius: 6, background: "var(--border)", marginBottom: 6 }} />
          <div style={{ width: 80, height: 10, borderRadius: 6, background: "var(--border)", opacity: .6 }} />
        </div>
      </div>
      {[70, 80, 80, 70].map((w, i) => (
        <div key={i} style={{ width: w, height: 12, borderRadius: 6, background: "var(--border)" }} />
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        {[28, 28, 28].map((_, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)" }} />
        ))}
      </div>
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ action, app, onConfirm, onCancel, isLoading, error }: {
  action: ActionKey; app: Application
  onConfirm: (reason?: string) => void; onCancel: () => void
  isLoading: boolean; error: string | null
}) {
  const [reason, setReason] = useState("")
  const cfg = ACTION_CFG[action]

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1060,
        background: "var(--overlay)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget && !isLoading) onCancel() }}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 20, padding: 28, width: "100%", maxWidth: 420,
        boxShadow: "var(--shadow)", animation: "fadeUp .2s ease",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, marginBottom: 18,
          background: cfg.bg, color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {action === "approve" || action === "accept" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
        </div>

        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, fontWeight: 700, color: "var(--text-pri)", marginBottom: 8 }}>{cfg.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 16 }}>{cfg.desc}</div>

        {/* Student chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 12,
          background: "var(--input-bg)", border: "1px solid var(--border)", marginBottom: action === "reject" ? 16 : 20,
        }}>
          <Avatar name={app.student_name} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>{app.student_name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>#{app.student_roll_no}</div>
          </div>
        </div>

        {action === "reject" && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Reason <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Provide a reason for rejection…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={isLoading}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text-pri)", fontSize: 13, outline: "none", resize: "none",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
        )}

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.12)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
            <AlertTriangle size={13} />{error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={isLoading} style={{
            flex: 1, padding: 11, borderRadius: 12,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-sec)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading || (action === "reject" && !reason.trim())}
            style={{
              flex: 1, padding: 11, borderRadius: 12, border: "none",
              background: (isLoading || (action === "reject" && !reason.trim())) ? "var(--border)" : cfg.color,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isLoading ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />Processing…</> : cfg.btn}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field / Section helpers for detail modal ─────────────────────────────────
function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: value ? "var(--text-pri)" : "var(--text-muted)" }}>{value || "—"}</div>
    </div>
  )
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
      textTransform: "uppercase", letterSpacing: "0.08em",
      paddingBottom: 10, borderBottom: "1px solid var(--border)", marginBottom: 14,
    }}>
      <span style={{ color: "var(--accent)" }}>{icon}</span>{title}
    </div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ app, onClose, onAction, mutatingId }: {
  app: Application; onClose: () => void
  onAction: (action: ActionKey) => void; mutatingId: string | null
}) {
  const isMutating = mutatingId === app._id

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1055,
        background: "var(--overlay)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 24, width: "100%", maxWidth: 720,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow)", animation: "fadeUp .2s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "22px 28px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={app.student_name} />
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, fontWeight: 700, color: "var(--text-pri)" }}>
                {app.student_name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>
                  #{app.student_roll_no}
                </span>
                <StatusPill status={app.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-sec)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            {/* Left */}
            <div>
              <SectionHeading icon={<User size={13} />} title="Personal Information" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Father's Name" value={app.father_name} />
                <Field label="Email"         value={app.student_email} />
                <Field label="Mobile"        value={app.student_cellphone} />
                <Field label="CNIC"          value={app.cnic_no} />
                <Field label="WhatsApp"      value={app.active_whatsapp_no} />
                <Field label="City"          value={app.city} />
                <Field label="Province"      value={app.province} />
              </div>
              <Field label="Address" value={app.permanent_address} />

              <div style={{ marginTop: 20 }}>
                <SectionHeading icon={<GraduationCap size={13} />} title="Academic Information" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="Academic Year" value={app.academic_year} />
                  <Field label="Reg. No"       value={app.student_reg_no} />
                  <Field label="Date of Birth" value={app.date_of_birth} />
                  <Field label="Gender"        value={app.gender} />
                  <Field label="Applied On"    value={new Date(app.application_submit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                </div>
              </div>
            </div>

            {/* Right */}
            <div>
              <SectionHeading icon={<User size={13} />} title="Guardian Information" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Guardian Name"  value={app.guardian_name} />
                <Field label="Guardian Phone" value={app.guardian_cellphone} />
                <Field label="Father Phone"   value={app.father_cellphone} />
              </div>

              <div style={{ marginTop: 20 }}>
                <SectionHeading icon={<Home size={13} />} title="Hostel Information" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="Room No"      value={app.room_id?.room_no} />
                  <Field label="Block"        value={app.room_id?.block} />
                  <Field label="Mess Enabled" value={app.messEnabled ? "Yes" : "No"} />
                  <Field label="Join Date"    value={app.hostelJoinDate} />
                  <Field label="Leave Date"   value={app.hostelLeaveDate} />
                </div>
              </div>

              {/* Status flow */}
              <div style={{ marginTop: 20 }}>
                <SectionHeading icon={<Clock size={13} />} title="Approval Flow" />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {(["pending", "accepted", "approved"] as ApplicationStatus[]).map((s, i) => {
                    const statusOrder = ["pending", "accepted", "approved"]
                    const currentIdx  = statusOrder.indexOf(app.status)
                    const reached     = app.status === "rejected" ? i === 0 : currentIdx >= i
                    const isCurrent   = app.status === s
                    const cfg         = STATUS_CFG[s]
                    return (
                      <React.Fragment key={s}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: reached ? cfg.bg : "var(--input-bg)",
                            border: `2px solid ${reached ? cfg.dot : "var(--border)"}`,
                            color: reached ? cfg.color : "var(--text-muted)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .3s",
                          }}>
                            {cfg.icon}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? cfg.color : "var(--text-muted)", letterSpacing: "0.04em" }}>
                            {cfg.label}
                          </span>
                        </div>
                        {i < 2 && (
                          <div style={{
                            flex: 1, height: 2, borderRadius: 1, marginBottom: 14,
                            background: currentIdx > i ? "var(--green)" : "var(--border)",
                            transition: "background .3s",
                          }} />
                        )}
                      </React.Fragment>
                    )
                  })}
                  {app.status === "rejected" && (
                    <>
                      <div style={{ flex: 1, height: 2, borderRadius: 1, marginBottom: 14, background: "var(--border)" }} />
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: STATUS_CFG.rejected.bg, border: `2px solid ${STATUS_CFG.rejected.dot}`, color: STATUS_CFG.rejected.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <XCircle size={11} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_CFG.rejected.color }}>Rejected</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: "8px 18px", borderRadius: 10, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Close</button>

          {app.status === "pending" && (
            <>
              <button onClick={() => onAction("accept")} disabled={isMutating} style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                background: "rgba(6,182,212,.15)", color: "#06b6d4",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Check size={14} /> Accept
              </button>
              <button onClick={() => onAction("reject")} disabled={isMutating} style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                background: "rgba(239,68,68,.15)", color: "var(--red)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <X size={14} /> Reject
              </button>
            </>
          )}
          {app.status === "accepted" && (
            <>
              <button onClick={() => onAction("approve")} disabled={isMutating} style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                background: "rgba(16,185,129,.15)", color: "var(--green)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {isMutating
                  ? <Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />
                  : <CheckCircle2 size={14} />
                }
                Approve
              </button>
              <button onClick={() => onAction("reject")} disabled={isMutating} style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                background: "rgba(239,68,68,.15)", color: "var(--red)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <X size={14} /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
type PendingAction = { app: Application; action: ActionKey } | null

const StudentApplications: React.FC = () => {
  const {
    applications, total, totalPages, isLoading, error,
    stats, isStatsLoading,
    filters, setFilters,
    updateStatus, mutatingId, mutationError,
  } = useStudentApplications()

  const [detailApp,     setDetailApp]     = useState<Application | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [searchInput,   setSearchInput]   = useState("")

  const applySearch = useDebounce((val: string) => setFilters({ search: val }), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); applySearch(e.target.value)
  }

  const STATUS_MAP: Record<ActionKey, ApplicationStatus> = {
    accept: "accepted", approve: "approved", reject: "rejected",
  }

  const handleConfirm = useCallback(async (reason?: string) => {
    if (!pendingAction) return
    await updateStatus(pendingAction.app._id, { status: STATUS_MAP[pendingAction.action], reason })
    setPendingAction(null)
    setDetailApp(null)
  }, [pendingAction, updateStatus])

  const openAction = useCallback((app: Application, action: ActionKey) => {
    setPendingAction({ app, action })
  }, [])

  const STATUS_FILTERS: (ApplicationStatus | "All")[] = ["All", "pending", "accepted", "approved", "rejected"]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hostel Management</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>Student Applications</h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>Review, accept, and approve hostel admission applications</p>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,.1)", color: "var(--red)", fontSize: 13, border: "1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15} />{error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <StatCard icon={<FileText size={18} />}     label="Total"    desc="All applications"      value={stats?.access?.total      ?? 0} colorVar="var(--accent)" isLoading={isStatsLoading} />
        <StatCard icon={<Clock size={18} />}         label="Pending"  desc="Awaiting decision"     value={stats?.byStatus?.pending  ?? 0} colorVar="var(--amber)"  isLoading={isStatsLoading} />
        <StatCard icon={<CheckCircle2 size={18} />}  label="Approved" desc="Fully approved"        value={stats?.byStatus?.approved ?? 0} colorVar="var(--green)"  isLoading={isStatsLoading} />
        <StatCard icon={<XCircle size={18} />}        label="Rejected" desc="Applications rejected" value={stats?.byStatus?.rejected ?? 0} colorVar="var(--red)"    isLoading={isStatsLoading} />
      </div>

      {/* Table card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pri)" }}>Applications List</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {isLoading ? "Loading…" : `${total} application${total !== 1 ? "s" : ""}`}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={searchInput} onChange={handleSearch}
                placeholder="Name, roll no, email…"
                style={{
                  padding: "9px 12px 9px 34px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text-pri)", fontSize: 12, outline: "none", minWidth: 220,
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setFilters({ search: undefined }) }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: 4, background: "var(--input-bg)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
              {STATUS_FILTERS.map(s => {
                const active = (filters.status ?? "All") === s
                return (
                  <button key={s} onClick={() => setFilters({ status: s === "All" ? undefined : s as ApplicationStatus })} style={{
                    padding: "5px 12px", borderRadius: 8, border: "none",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all .15s", textTransform: "capitalize",
                  }}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
          gap: 16, padding: "10px 24px",
          borderBottom: "1px solid var(--border)", background: "var(--surface)",
        }}>
          {["Student", "Mobile", "Father", "Year", "Status", "Actions"].map((h, i) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i === 5 ? "right" : "left" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : applications.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <FileText size={36} style={{ marginBottom: 12, opacity: .3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No applications found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter</div>
              </div>
            )
            : applications.map((app, idx) => {
              const isMutating = mutatingId === app._id
              return (
                <div
                  key={app._id}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
                    gap: 16, alignItems: "center",
                    padding: "14px 24px",
                    borderBottom: idx < applications.length - 1 ? "1px solid var(--border)" : "none",
                    opacity: isMutating ? 0.45 : 1,
                    transition: "opacity .2s, background .15s",
                    animation: `fadeUp .25s ease ${idx * .025}s both`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Student */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar name={app.student_name} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-pri)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {app.student_name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>
                        #{app.student_roll_no}
                      </div>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{app.student_cellphone ?? "—"}</div>

                  {/* Father */}
                  <div style={{ fontSize: 12, color: "var(--text-sec)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {app.father_name ?? "—"}
                  </div>

                  {/* Year */}
                  <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{app.academic_year ?? "—"}</div>

                  {/* Status */}
                  <div><StatusPill status={app.status} /></div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    {isMutating ? (
                      <Loader2 size={16} color="var(--text-muted)" style={{ animation: "spin .8s linear infinite" }} />
                    ) : (
                      <>
                        {/* View */}
                        <button title="View details" onClick={() => setDetailApp(app)} style={actionBtnStyle("var(--accent)", "var(--accent-lo)")}>
                          <Eye size={13} />
                        </button>

                        {/* Accept */}
                        {app.status === "pending" && (
                          <button title="Accept" onClick={() => openAction(app, "accept")} style={actionBtnStyle("#06b6d4", "rgba(6,182,212,.12)")}>
                            <Check size={13} />
                          </button>
                        )}

                        {/* Approve */}
                        {app.status === "accepted" && (
                          <button title="Approve" onClick={() => openAction(app, "approve")} style={actionBtnStyle("var(--green)", "rgba(16,185,129,.12)")}>
                            <CheckCircle2 size={13} />
                          </button>
                        )}

                        {/* Reject */}
                        {(app.status === "pending" || app.status === "accepted") && (
                          <button title="Reject" onClick={() => openAction(app, "reject")} style={actionBtnStyle("var(--red)", "rgba(239,68,68,.1)")}>
                            <X size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Page {filters.page ?? 1} of {totalPages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "← Prev", disabled: (filters.page ?? 1) <= 1,          action: () => setFilters({ page: (filters.page ?? 1) - 1 }) },
              { label: "Next →", disabled: (filters.page ?? 1) >= totalPages,  action: () => setFilters({ page: (filters.page ?? 1) + 1 }) },
            ].map(b => (
              <button key={b.label} onClick={b.action} disabled={b.disabled || isLoading} style={{
                padding: "9px 20px", borderRadius: 10, border: "1px solid var(--border)",
                background: b.disabled ? "transparent" : "var(--input-bg)",
                color: b.disabled ? "var(--text-muted)" : "var(--text-sec)",
                fontSize: 12, fontWeight: 600, cursor: b.disabled ? "not-allowed" : "pointer",
              }}>{b.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {detailApp && (
        <DetailModal
          app={detailApp}
          onClose={() => setDetailApp(null)}
          onAction={action => openAction(detailApp, action)}
          mutatingId={mutatingId}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          action={pendingAction.action}
          app={pendingAction.app}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
          isLoading={mutatingId === pendingAction.app._id}
          error={mutationError ?? null}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select option { background: var(--card); color: var(--text-pri); }
      `}</style>
    </div>
  )
}

// ─── Action button style helper ───────────────────────────────────────────────
function actionBtnStyle(color: string, bg: string): React.CSSProperties {
  return {
    width: 28, height: 28, borderRadius: 8,
    border: "none", background: bg, color,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "opacity .15s",
  }
}

export default StudentApplications