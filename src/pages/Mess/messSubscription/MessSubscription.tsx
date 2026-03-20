"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Search, Ban, RefreshCw, Mail,
  IndianRupee, AlertTriangle, CheckCircle2, Loader2,
  TrendingUp, ChevronDown, X, Users,
} from "lucide-react"
import { useMessSubscriptions } from "./MessSubscription.queries"
import type { Subscription, SubscriptionStatus } from "./messSubscription.api"

// ─── Status config — semantic colors via CSS vars ─────────────────────────────
const STATUS_CFG: Record<SubscriptionStatus, {
  label: string; color: string; bg: string; dot: string; border: string
}> = {
  Active:    { label: "Active",    color: "var(--green)",  bg: "rgba(16,185,129,.10)", dot: "var(--green)",  border: "rgba(16,185,129,.25)" },
  Suspended: { label: "Suspended", color: "var(--amber)",  bg: "rgba(245,158,11,.10)", dot: "var(--amber)",  border: "rgba(245,158,11,.25)" },
  Cancelled: { label: "Cancelled", color: "var(--red)",    bg: "rgba(239,68,68,.10)",  dot: "var(--red)",    border: "rgba(239,68,68,.25)"  },
}

const ACTION_CFG = {
  suspend: {
    title:   "Suspend Subscription",
    desc:    "Meal access will be paused immediately. The student can be reinstated at any time.",
    button:  "Suspend Access",
    color:   "var(--amber)",
    bg:      "rgba(245,158,11,.12)",
    newStatus: "Suspended" as SubscriptionStatus,
  },
  renew: {
    title:   "Reactivate Subscription",
    desc:    "Meal access will be restored and the subscription set back to Active.",
    button:  "Reactivate",
    color:   "var(--green)",
    bg:      "rgba(16,185,129,.12)",
    newStatus: "Active" as SubscriptionStatus,
  },
  cancel: {
    title:   "Cancel Subscription",
    desc:    "This is permanent. The student will lose all meal access and cannot be reinstated.",
    button:  "Cancel Permanently",
    color:   "var(--red)",
    bg:      "rgba(239,68,68,.12)",
    newStatus: "Cancelled" as SubscriptionStatus,
  },
}

type ActionKey = keyof typeof ACTION_CFG

// ─── Tiny reusable primitives ─────────────────────────────────────────────────

function StatusPill({ status }: { status: SubscriptionStatus }) {
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

function Avatar({ name }: { name: string }) {
  const initials = name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  // deterministic hue from name
  const hue = name?.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: `hsl(${hue},45%,30%)`,
      border: `1px solid hsl(${hue},45%,40%)`,
      color: `hsl(${hue},80%,85%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
    }}>
      {initials}
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 40px",
      gap: 16, alignItems: "center",
      padding: "16px 24px", borderBottom: "1px solid var(--border)",
      animation: "shimmer 1.4s ease-in-out infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--border)" }} />
        <div>
          <div style={{ width: 120, height: 12, borderRadius: 6, background: "var(--border)", marginBottom: 6 }} />
          <div style={{ width: 80, height: 10, borderRadius: 6, background: "var(--border)", opacity: .6 }} />
        </div>
      </div>
      {[70, 80, 70, 90].map((w, i) => (
        <div key={i} style={{ width: w, height: 12, borderRadius: 6, background: "var(--border)" }} />
      ))}
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--border)" }} />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, colorVar, isLoading }: {
  icon: React.ReactNode; label: string; value: string | number
  sub?: string; colorVar: string; isLoading: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "transform .2s, box-shadow .2s, border-color .2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "var(--stat-shadow)" : "none",
        borderColor: hovered ? `color-mix(in srgb, ${colorVar} 35%, transparent)` : "var(--border)",
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
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>
          {isLoading
            ? <span style={{ display: "inline-block", width: 60, height: 20, borderRadius: 6, background: "var(--border)", animation: "shimmer 1.4s ease-in-out infinite" }} />
            : value
          }
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Row action menu ──────────────────────────────────────────────────────────
// Dropdown uses position:fixed with getBoundingClientRect so it escapes
// the parent card's overflow:hidden without needing a portal.
function ActionMenu({ sub, onAction }: {
  sub: Subscription
  onAction: (action: ActionKey, sub: Subscription) => void
}) {
  const [open,    setOpen]    = useState(false)
  const [pos,     setPos]     = useState({ top: 0, right: 0 })
  const btnRef  = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on scroll so the dropdown doesn't float away
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener("scroll", handler, true)
    return () => window.removeEventListener("scroll", handler, true)
  }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        // top:   rect.bottom + 6,
        top:-115,
        // left: window.innerWidth - rect.right,
        // right:0
      })
    }
    setOpen(p => !p)
  }

  const items: { action: ActionKey; icon: React.ReactNode; label: string; danger?: boolean }[] = []
  if (sub.status === "Active")    items.push({ action: "suspend", icon: <Ban size={13} />,       label: "Suspend Access" })
  if (sub.status !== "Active")    items.push({ action: "renew",   icon: <RefreshCw size={13} />, label: "Reactivate" })
  if (sub.status !== "Cancelled") items.push({ action: "cancel",  icon: <Ban size={13} />,       label: "Cancel Permanently", danger: true })

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: "1px solid var(--border)",
          background: open ? "var(--accent-lo)" : "transparent",
          color: open ? "var(--accent)" : "var(--text-muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all .15s",
        }}
      >
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            // Force string so React never omits the property when value is 0
            top:  `${pos.top}px`,
            left: `${pos.left}px`,
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 6,
            zIndex: 9999,
            minWidth: 190,
            boxShadow: "var(--shadow)",
            animation: "fadeUp .15s ease",
          }}
        >
          <button onClick={() => setOpen(false)} style={menuItemStyle(false)}>
            <Mail size={13} /> Send Email
          </button>

          {items.length > 0 && <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />}

          {items.map(item => (
            <button
              key={item.action}
              onClick={() => { setOpen(false); onAction(item.action, sub) }}
              style={menuItemStyle(!!item.danger)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

const menuItemStyle = (danger: boolean): React.CSSProperties => ({
  width: "100%", display: "flex", alignItems: "center", gap: 8,
  padding: "8px 10px", borderRadius: 8, border: "none",
  background: "transparent",
  color: danger ? "var(--red)" : "var(--text-sec)",
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  transition: "background .1s, color .1s",
})

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ action, sub, onConfirm, onClose, isLoading, error }: {
  action: ActionKey; sub: Subscription
  onConfirm: () => void; onClose: () => void
  isLoading: boolean; error: string | null
}) {
  const cfg = ACTION_CFG[action]
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "var(--overlay)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget && !isLoading) onClose() }}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 20, padding: 28, width: "100%", maxWidth: 420,
        boxShadow: "var(--shadow)", animation: "fadeUp .2s ease",
      }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, marginBottom: 18,
          background: cfg.bg, color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {action === "renew" ? <CheckCircle2 size={22} /> : <Ban size={22} />}
        </div>

        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, fontWeight: 700, color: "var(--text-pri)", marginBottom: 8 }}>
          {cfg.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 16 }}>
          {cfg.desc}
        </div>

        {/* Student chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 12,
          background: "var(--input-bg)", border: "1px solid var(--border)", marginBottom: 20,
        }}>
          <Avatar name={sub.student.student_name} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>{sub.student.student_name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>{sub.student.student_roll_no}</div>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.12)", color: "var(--red)", fontSize: 12, marginBottom: 16 }}>
            <AlertTriangle size={13} />{error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={isLoading} style={{
            flex: 1, padding: 11, borderRadius: 12,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-sec)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Go Back
          </button>
          <button onClick={onConfirm} disabled={isLoading} style={{
            flex: 1, padding: 11, borderRadius: 12, border: "none",
            background: isLoading ? "var(--border)" : cfg.color,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {isLoading
              ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />Processing…</>
              : cfg.button
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SubscriptionsPanel() {
  const {
    subscriptions, stats, totalRecords,
    isLoading, isStatsLoading, error, mutationError,
    actionLoading, filters, setFilters, updateStatus,
  } = useMessSubscriptions()

  const [search,  setSearch]  = useState("")
  const [confirm, setConfirm] = useState<{ action: ActionKey; sub: Subscription } | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return subscriptions
    const q = search.toLowerCase()
    return subscriptions.filter(s =>
      s.student.student_name.toLowerCase().includes(q)   ||
      s.student.student_roll_no.toLowerCase().includes(q) ||
      s.student.student_email.toLowerCase().includes(q)
    )
  }, [subscriptions, search])

  const handleConfirm = async () => {
    if (!confirm) return
    try {
      await updateStatus(confirm.sub._id, { status: ACTION_CFG[confirm.action].newStatus })
      setConfirm(null)
    } catch { /* mutationError surfaces from hook */ }
  }

  const activeCount = stats?.byStatus?.Active    ?? 0
  const suspCount   = stats?.byStatus?.Suspended ?? 0
  const revenue     = stats?.revenue?.totalMonthlyRevenue ?? 0

  const STATUS_FILTERS: (SubscriptionStatus | "All")[] = ["All", "Active", "Suspended", "Cancelled"]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mess Management</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>Subscriptions</h1>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>Manage student meal plans and billing</p>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,.1)", color: "var(--red)", fontSize: 13, border: "1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15} />{error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <StatCard icon={<Users size={18} />}        label="Active Plans"      value={isStatsLoading ? "—" : activeCount}                                  colorVar="var(--green)"  isLoading={isStatsLoading} />
        <StatCard icon={<AlertTriangle size={18} />} label="Suspended"        value={isStatsLoading ? "—" : suspCount}                                    colorVar="var(--amber)"  isLoading={isStatsLoading} />
        <StatCard icon={<IndianRupee size={18} />}  label="Monthly Revenue"   value={isStatsLoading ? "—" : `₹${revenue.toLocaleString("en-IN")}`}        colorVar="var(--accent)" isLoading={isStatsLoading} sub="this month" />
        <StatCard icon={<TrendingUp size={18} />}   label="Total Records"     value={isStatsLoading ? "—" : totalRecords}                                  colorVar="var(--text-sec)" isLoading={isStatsLoading} />
      </div>

      {/* Table card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pri)" }}>All Subscriptions</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {isLoading ? "Loading…" : `${filtered.length} of ${totalRecords} records`}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                style={{
                  padding: "9px 12px 9px 34px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text-pri)", fontSize: 12, outline: "none", minWidth: 220,
                  transition: "border-color .2s",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: 4, background: "var(--input-bg)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
              {STATUS_FILTERS.map(s => {
                const active = filters.status === s
                return (
                  <button key={s} onClick={() => setFilters({ status: s })} style={{
                    padding: "5px 12px", borderRadius: 8, border: "none",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
                    transition: "all .15s",
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
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 48px",
          gap: 16, padding: "10px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}>
          {["Student", "Plan", "Status", "Fee", "Valid Until", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i === 5 ? "right" : "left" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : filtered.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <Users size={36} style={{ marginBottom: 12, opacity: .3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No subscriptions found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter</div>
              </div>
            )
            : filtered.map((sub, idx) => {
              const isMutating = actionLoading === sub._id
              return (
                <div
                  key={sub._id}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 48px",
                    gap: 16, alignItems: "center",
                    padding: "14px 24px",
                    borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    opacity: isMutating ? 0.45 : 1,
                    transition: "opacity .2s, background .15s",
                    animation: `fadeUp .25s ease ${idx * .03}s both`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Student */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar name={sub.student.student_name} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-pri)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sub.student.student_name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>
                        {sub.student.student_roll_no}
                      </div>
                    </div>
                  </div>

                  {/* Plan */}
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sec)" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--input-bg)", border: "1px solid var(--border)", fontSize: 11 }}>
                      {sub.planType === "Pay_Per_Meal" ? "Per Meal" : sub.planType}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusPill status={sub.status} />
                  </div>

                  {/* Fee */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-pri)" }}>
                    {sub.monthlyFee > 0
                      ? `₹${sub.monthlyFee.toLocaleString("en-IN")}`
                      : <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Per meal</span>
                    }
                  </div>

                  {/* Valid Until */}
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {sub.validUntil
                      ? new Date(sub.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"
                    }
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {isMutating
                      ? <Loader2 size={16} color="var(--text-muted)" style={{ animation: "spin .8s linear infinite" }} />
                      : <ActionMenu sub={sub} onAction={(action, s) => setConfirm({ action, sub: s })} />
                    }
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          action={confirm.action}
          sub={confirm.sub}
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
          isLoading={!!actionLoading}
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