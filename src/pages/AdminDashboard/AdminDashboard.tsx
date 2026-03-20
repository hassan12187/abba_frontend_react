"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import {
  Users, BedDouble, CreditCard, FileText,
  ArrowRight, TrendingUp, Building2, Utensils,
  ChevronRight, AlertCircle, CheckCircle2, Clock,
} from "lucide-react"
import useCustomQuery  from "../../components/hooks/useCustomQuery.js"
import { useCustom }      from "../../Store/Store"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityEvent {
  type:    "application" | "payment"
  message: string
  status:  string
  date:    string
}

interface DashboardData {
  // Students
  totalStudents:       number
  approvedStudents:    number
  acceptedStudents:    number
  pendingApplications: number
  studentsWithRoom:    number
  messEnabledStudents: number
  // Rooms
  totalRooms:          number
  totalCapacity:       number
  occupiedRooms:       number
  availableRooms:      number
  maintenanceRooms:    number
  occupancyRate:       number
  // Payments
  paymentsDone:        number
  overduePayments:     number
  totalRevenue:        number
  totalOutstanding:    number
  // Mess
  activeSubscriptions: number
  messMonthlyRevenue:  number
  // Activity
  recentActivity:      ActivityEvent[]
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, desc, colorVar, isLoading, onClick }: {
  icon:     React.ReactNode
  label:    string
  value:    string | number | undefined
  desc:     string
  colorVar: string
  isLoading:boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background:    "var(--card)",
        border:        `1px solid ${hovered && onClick ? `color-mix(in srgb, ${colorVar} 35%, transparent)` : "var(--border)"}`,
        borderRadius:  18,
        padding:       "22px 24px",
        display:       "flex",
        alignItems:    "center",
        gap:           18,
        cursor:        onClick ? "pointer" : "default",
        transition:    "transform .2s, box-shadow .2s, border-color .2s",
        transform:     hovered && onClick ? "translateY(-2px)" : "none",
        boxShadow:     hovered && onClick ? "var(--stat-shadow)" : "none",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Subtle background glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100, borderRadius: "50%",
        background: `color-mix(in srgb, ${colorVar} 6%, transparent)`,
        pointerEvents: "none",
      }} />

      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: `color-mix(in srgb, ${colorVar} 12%, transparent)`,
        color: colorVar,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>
          {isLoading
            ? <span style={{ display: "inline-block", width: 60, height: 26, borderRadius: 8, background: "var(--border)", animation: "shimmer 1.4s ease-in-out infinite" }} />
            : (value ?? "—")
          }
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{desc}</div>
      </div>

      {onClick && (
        <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: "opacity .2s" }} />
      )}
    </div>
  )
}

// ─── Quick action button ──────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, colorVar, onClick }: {
  icon:     React.ReactNode
  label:    string
  desc:     string
  colorVar: string
  onClick:  () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background:   hovered ? `color-mix(in srgb, ${colorVar} 8%, var(--card))` : "var(--card)",
        border:       `1px solid ${hovered ? `color-mix(in srgb, ${colorVar} 30%, transparent)` : "var(--border)"}`,
        borderRadius: 16,
        padding:      "18px 20px",
        cursor:       "pointer",
        textAlign:    "left",
        display:      "flex",
        alignItems:   "center",
        gap:          14,
        transition:   "all .2s",
        transform:    hovered ? "translateY(-1px)" : "none",
        boxShadow:    hovered ? "var(--stat-shadow)" : "none",
        width:        "100%",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${colorVar} 12%, transparent)`,
        color: colorVar,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform .2s",
        transform: hovered ? "scale(1.08)" : "scale(1)",
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
      </div>
      <ArrowRight size={14} color={colorVar} style={{ marginLeft: "auto", flexShrink: 0, opacity: hovered ? 1 : 0.3, transition: "opacity .2s" }} />
    </button>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────
function ActivityItem({ icon, message, time, color, last }: {
  icon: React.ReactNode; message: string; time: string; color: string; last: boolean
}) {
  return (
    <div style={{
      display:       "flex",
      alignItems:    "flex-start",
      gap:           14,
      padding:       "14px 0",
      borderBottom:  last ? "none" : "1px solid var(--border)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5 }}>{message}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{time}</div>
      </div>
    </div>
  )
}

// ─── Occupancy ring ───────────────────────────────────────────────────────────
function OccupancyRing({ rate }: { rate: number }) {
  const r    = 38
  const circ = 2 * Math.PI * r
  const pct  = Math.min(100, Math.max(0, rate))
  const color = pct < 50 ? "var(--green)" : pct < 80 ? "var(--amber)" : "var(--red)"

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>
          {pct}%
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          full
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navigate   = useNavigate()
  const { token }  = useCustom() as { token: string }

  const { data: raw, isLoading } = useCustomQuery(
    "/api/admin/report/home-dashboard",
    token,
    "dashboard"
  ) as { data: { data: DashboardData } | undefined; isLoading: boolean }
  // Backend wraps response in { success, data }
  const data = raw?.data
  console.log(data);

  const occupancyRate = data?.occupancyRate
    ? Number(data.occupancyRate)
    : data?.totalRooms && data?.occupiedRooms
    ? Math.round((Number(data.occupiedRooms) / Number(data.totalRooms)) * 100)
    : 0

  const now  = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const STATS = [
    { icon: <Users size={22} />,     label: "Total Students",      value: data?.totalStudents,       desc: "Currently enrolled",    colorVar: "var(--accent)", route: "/students"     },
    { icon: <BedDouble size={22} />,  label: "Occupied Rooms",      value: data?.occupiedRooms,       desc: "of total capacity",     colorVar: "var(--green)",  route: "/rooms"        },
    { icon: <CreditCard size={22} />, label: "Payments Collected",  value: data?.paymentsDone,        desc: "This month",            colorVar: "#06b6d4",        route: "/payments"     },
    { icon: <FileText size={22} />,   label: "Pending Applications",value: data?.pendingApplications, desc: "Awaiting your review",  colorVar: "var(--amber)",  route: "/applications" },
  ]

  const QUICK_ACTIONS = [
    { icon: <Users      size={17} />, label: "New Application",  desc: "Review & accept applicants",   colorVar: "var(--accent)", route: "/applications"  },
    { icon: <BedDouble  size={17} />, label: "Manage Rooms",     desc: "Assign rooms to students",     colorVar: "var(--green)",  route: "/rooms"         },
    { icon: <CreditCard size={17} />, label: "Fee Invoice",      desc: "Generate or collect payments", colorVar: "#06b6d4",       route: "/fee-invoice"   },
    { icon: <Utensils   size={17} />, label: "Mess Menu",        desc: "Update weekly mess schedule",  colorVar: "var(--amber)",  route: "/mess-menu"     },
    { icon: <Building2  size={17} />, label: "Hostel Blocks",    desc: "Manage blocks and rooms",      colorVar: "var(--red)",    route: "/blocks"        },
    { icon: <TrendingUp size={17} />, label: "View Reports",     desc: "Analytics and summaries",      colorVar: "#8b5cf6",       route: "/reports"       },
  ]

  // Use real activity from backend, fall back to placeholders while loading
  const ACTIVITY_ICON: Record<string, React.ReactNode> = {
    application: <FileText   size={15} />,
    payment:     <CreditCard size={15} />,
  }
  const ACTIVITY_COLOR: Record<string, string> = {
    application: "var(--accent)",
    payment:     "var(--green)",
  }
  const formatDate = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000
    if (diff < 3600)   return `${Math.round(diff / 60)} min ago`
    if (diff < 86400)  return `${Math.round(diff / 3600)} hours ago`
    if (diff < 172800) return "Yesterday"
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }
  const ACTIVITIES = data?.recentActivity?.length
    ? data.recentActivity.map(a => ({
        icon:    ACTIVITY_ICON[a.type]  ?? <FileText size={15} />,
        message: a.message,
        time:    formatDate(a.date),
        color:   ACTIVITY_COLOR[a.type] ?? "var(--accent)",
      }))
    : [
        { icon: <FileText    size={15} />, message: "New hostel application submitted by a student",    time: "—", color: "var(--accent)" },
        { icon: <CreditCard  size={15} />, message: "Fee payment received for a student",              time: "—", color: "var(--green)"  },
        { icon: <AlertCircle size={15} />, message: "3 subscriptions expiring within the next 7 days", time: "—", color: "var(--amber)"  },
      ]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Live Dashboard
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>
            {greeting}, Admin 👋
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>
            Here's what's happening in your hostel today.
          </p>
        </div>
        <div style={{
          padding: "8px 16px", borderRadius: 12,
          background: "var(--card)", border: "1px solid var(--border)",
          fontSize: 12, color: "var(--text-sec)", fontFamily: "'JetBrains Mono',monospace",
        }}>
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {STATS.map(s => (
          <StatCard
            key={s.label}
            icon={s.icon} label={s.label}
            value={s.value} desc={s.desc}
            colorVar={s.colorVar}
            isLoading={isLoading}
            onClick={() => navigate(s.route)}
          />
        ))}
      </div>

      {/* ── Middle row: occupancy + recent activity ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>

        {/* Occupancy widget */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>
            Occupancy
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <OccupancyRing rate={occupancyRate} />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Occupied",  value: data?.occupiedRooms ?? "—", color: "var(--green)"       },
                { label: "Total",     value: data?.totalRooms    ?? "—", color: "var(--text-muted)"  },
                { label: "Available", value: (Number(data?.totalRooms ?? 0) - Number(data?.occupiedRooms ?? 0)) || "—", color: "var(--accent)" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Recent Activity
            </div>
            <button
              onClick={() => navigate("/reports")}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, color: "var(--accent)",
              }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div>
            {ACTIVITIES.map((a, i) => (
              <ActivityItem key={i} {...a} last={i === ACTIVITIES.length - 1} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
          Quick Actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {QUICK_ACTIONS.map(a => (
            <QuickAction key={a.label} {...a} onClick={() => navigate(a.route)} />
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
    </div>
  )
}

export default AdminDashboard