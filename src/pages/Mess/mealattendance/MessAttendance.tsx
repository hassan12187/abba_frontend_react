"use client"

import React, { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import {
  Coffee, UtensilsCrossed, Moon, Search, X,
  UserCheck, Clock, Loader2, AlertTriangle,
  CheckCircle2, XCircle, CalendarDays, Users,
  ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom } from "../../../Store/Store"
import { useDebounce } from "../../../components/hooks/useDebounce"
import {
  AttendanceAPI,
  MEAL_TYPES, MEAL_STATUSES,
  type MealType, type MealStatus,
  type AttendanceRecord, type AttendanceFilters,
  type BulkMarkDTO,
} from "./mealattendance.api"

// ─── Config ───────────────────────────────────────────────────────────────────
const MEAL_CFG: Record<MealType, {
  icon: React.ReactNode; color: string; bg: string; border: string; time: string
}> = {
  Breakfast: { icon: <Coffee      size={18}/>, color: "#f59e0b", bg: "rgba(245,158,11,.10)", border: "rgba(245,158,11,.25)", time: "7–9 AM"    },
  Lunch:     { icon: <UtensilsCrossed size={18}/>, color: "var(--accent)", bg: "var(--accent-lo)", border: "rgba(99,102,241,.25)", time: "12–2 PM" },
  Dinner:    { icon: <Moon        size={18}/>, color: "#8b5cf6", bg: "rgba(139,92,246,.10)", border: "rgba(139,92,246,.25)",time: "7–9 PM"  },
}

const STATUS_CFG: Record<MealStatus, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Present: { color: "var(--green)",  bg: "rgba(16,185,129,.10)", border: "rgba(16,185,129,.25)", icon: <CheckCircle2 size={11}/> },
  Absent:  { color: "var(--red)",    bg: "rgba(239,68,68,.10)",  border: "rgba(239,68,68,.25)",  icon: <XCircle      size={11}/> },
  Leave:   { color: "var(--amber)",  bg: "rgba(245,158,11,.10)", border: "rgba(245,158,11,.25)", icon: <Clock        size={11}/> },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function Avatar({ name }: { name: string }) {
  const initials = (name ?? "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const hue      = (name ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      background: `hsl(${hue},40%,28%)`, border: `1px solid hsl(${hue},40%,38%)`,
      color: `hsl(${hue},70%,82%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700,
    }}>
      {initials}
    </div>
  )
}

function StatusPill({ status }: { status: MealStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
      gap: 16, alignItems: "center",
      padding: "12px 24px", borderBottom: "1px solid var(--border)",
      animation: "shimmer 1.4s ease-in-out infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--border)", flexShrink: 0 }} />
        <div>
          <div style={{ width: 120, height: 11, borderRadius: 6, background: "var(--border)", marginBottom: 5 }} />
          <div style={{ width: 70,  height: 9,  borderRadius: 6, background: "var(--border)", opacity: .6 }} />
        </div>
      </div>
      {[70, 80, 60, 70].map((w, i) => (
        <div key={i} style={{ width: w, height: 11, borderRadius: 6, background: "var(--border)" }} />
      ))}
    </div>
  )
}

// ─── Meal stat card ───────────────────────────────────────────────────────────
function MealCard({ meal, present, total, active, onClick, isLoading }: {
  meal: MealType; present: number; total: number
  active: boolean; onClick: () => void; isLoading: boolean
}) {
  const cfg = MEAL_CFG[meal]
  const pct = total > 0 ? Math.round((present / total) * 100) : 0
  return (
    <div onClick={onClick}
      style={{
        background: active ? `color-mix(in srgb, ${cfg.color} 8%, var(--card))` : "var(--card)",
        border: `1px solid ${active ? cfg.border : "var(--border)"}`,
        borderRadius: 16, padding: "18px 20px", cursor: "pointer",
        transition: "all .2s",
        transform: active ? "translateY(-2px)" : "none",
        boxShadow: active ? "var(--stat-shadow)" : "none",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: cfg.bg, color: cfg.color,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {cfg.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>{meal}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{cfg.time}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: active ? cfg.color : "var(--text-pri)", fontFamily: "'DM Serif Display',serif", lineHeight: 1 }}>
            {isLoading ? "—" : present}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>present</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 2, transition: "width .6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
        <span>{pct}% attendance</span>
        <span>{total} enrolled</span>
      </div>
    </div>
  )
}

// ─── Status toggle button (inline per row) ────────────────────────────────────
function StatusToggle({ record, token }: { record: AttendanceRecord; token: string }) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status: MealStatus) =>
      AttendanceAPI.update(record._id, { status }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  })

  const statuses: MealStatus[] = ["Present", "Absent", "Leave"]
  const currentIdx = statuses.indexOf(record.status)
  const next = statuses[(currentIdx + 1) % statuses.length]

  return (
    <button
      onClick={() => mutation.mutate(next)}
      disabled={mutation.isPending}
      title={`Click to mark ${next}`}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      {mutation.isPending
        ? <Loader2 size={14} color="var(--text-muted)" style={{ animation: "spin .8s linear infinite" }} />
        : <StatusPill status={record.status} />
      }
    </button>
  )
}

// ─── Bulk mark panel ──────────────────────────────────────────────────────────
function BulkMarkPanel({ date, token, onClose }: {
  date: string; token: string; onClose: () => void
}) {
  const [meal,    setMeal]    = useState<MealType>("Lunch")
  const [status,  setStatus]  = useState<MealStatus>("Present")
  const [err,     setErr]     = useState<string | null>(null)
  const qc = useQueryClient()

  // Fetch enrolled students (approved)
  const studentsQuery = useQuery({
    queryKey: ["students-for-bulk"],
    queryFn:  () => fetch(`${(import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api"}/admin/applications?status=approved&limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    staleTime: 5 * 60_000,
    enabled:   !!token,
  })

  const students = studentsQuery.data?.data ?? []

  const mutation = useMutation({
    mutationFn: (dto: BulkMarkDTO) => AttendanceAPI.bulkMark(dto, token),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["attendance"] })
      onClose()
    },
    onError: (e: Error) => setErr(e.message),
  })

  const handleBulk = (e: FormEvent) => {
    e.preventDefault()
    if (!students.length) { setErr("No enrolled students found."); return }
    setErr(null)
    mutation.mutate({
      date,
      mealType: meal,
      records: students.map((s: any) => ({ student: s._id, status })),
    })
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--text-pri)", fontSize: 13, outline: "none",
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em",
    display: "block", marginBottom: 5,
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "var(--overlay)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget && !mutation.isPending) onClose() }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 22, width: "100%", maxWidth: 440,
        boxShadow: "var(--shadow)", animation: "fadeUp .2s ease",
      }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif" }}>
            Bulk Mark Attendance
          </div>
          <button onClick={onClose} disabled={mutation.isPending} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleBulk} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Info */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--accent-lo)", border: "1px solid var(--border-hover)", fontSize: 12, color: "var(--text-sec)" }}>
            This will mark <strong style={{ color: "var(--text-pri)" }}>{students.length} enrolled students</strong> for{" "}
            <strong style={{ color: "var(--text-pri)" }}>{meal}</strong> on <strong style={{ color: "var(--text-pri)" }}>{date}</strong>.
            Existing records for this meal will be updated.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Meal</label>
              <select value={meal} onChange={e => setMeal(e.target.value as MealType)} style={inputStyle}>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Default Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as MealStatus)} style={inputStyle}>
                {MEAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {err && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.12)", color: "var(--red)", fontSize: 12 }}>
              <AlertTriangle size={13} />{err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} disabled={mutation.isPending}
              style={{ flex: 1, padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending || studentsQuery.isLoading}
              style={{ flex: 1, padding: 10, borderRadius: 12, border: "none", background: mutation.isPending ? "var(--border)" : "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {mutation.isPending
                ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Marking…</>
                : <><CheckCircle2 size={13} />Mark {students.length} Students</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AttendancePanel() {
  const { token }  = useCustom() as { token: string }

  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [selectedMeal, setSelectedMeal] = useState<MealType | "All">("All")
  const [searchInput,  setSearchInput]  = useState("")
  const [search,       setSearch]       = useState("")
  const [page,         setPage]         = useState(1)
  const [bulkOpen,     setBulkOpen]     = useState(false)

  const applySearch = useDebounce((v: string) => { setSearch(v); setPage(1) }, 400)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); applySearch(e.target.value)
  }

  // Build filters for the list query
  const filters: AttendanceFilters = {
    date:     selectedDate,
    mealType: selectedMeal === "All" ? "" : selectedMeal,
    page,
    limit:    30,
    sortOrder:"asc",
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey:  ["attendance", "list", filters],
    queryFn:   () => AttendanceAPI.getAll(filters, token),
    staleTime: 60_000, enabled: !!token,
    placeholderData: (prev) => prev,
  })

  const dailyQuery = useQuery({
    queryKey:  ["attendance", "daily", selectedDate],
    queryFn:   () => AttendanceAPI.getDailySummary({ from: selectedDate, to: selectedDate }, token),
    staleTime: 2 * 60_000, enabled: !!token,
  })

  const records    = listQuery.data?.data       ?? []
  const total      = listQuery.data?.total      ?? 0
  const totalPages = listQuery.data?.totalPages ?? 1
  const daily      = dailyQuery.data?.data      ?? []

  // ── Derive per-meal counts from daily summary ──────────────────────────────
  const mealCounts: Record<MealType, { present: number; total: number }> = {
    Breakfast: { present: 0, total: 0 },
    Lunch:     { present: 0, total: 0 },
    Dinner:    { present: 0, total: 0 },
  }
  daily.forEach(d => {
    if (d.mealType in mealCounts) {
      mealCounts[d.mealType as MealType] = {
        present: d.present,
        total:   d.total,
      }
    }
  })

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = search
    ? records.filter(r =>
        r.student?.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(r.student?.student_roll_no).includes(search)
      )
    : records

  const fmtTime = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  })

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mess Management</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>
            Meal Attendance
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>
            {fmtDate(selectedDate)}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Date picker */}
          <div style={{ position: "relative" }}>
            <CalendarDays size={13} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="date"
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setPage(1) }}
              style={{ padding: "8px 12px 8px 34px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-pri)", fontSize: 12, outline: "none", cursor: "pointer" }}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Jump to today */}
          {selectedDate !== todayISO() && (
            <button onClick={() => { setSelectedDate(todayISO()); setPage(1) }}
              style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={13} /> Today
            </button>
          )}

          {/* Bulk mark */}
          <button onClick={() => setBulkOpen(true)}
            style={{ padding: "8px 18px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 0 20px var(--accent-glow)" }}>
            <Users size={14} /> Bulk Mark
          </button>
        </div>
      </div>

      {/* ── Meal cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {MEAL_TYPES.map(meal => (
          <MealCard
            key={meal}
            meal={meal}
            present={mealCounts[meal].present}
            total={mealCounts[meal].total}
            active={selectedMeal === meal}
            onClick={() => { setSelectedMeal(prev => prev === meal ? "All" : meal); setPage(1) }}
            isLoading={dailyQuery.isLoading}
          />
        ))}
      </div>

      {/* ── Table card ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pri)" }}>
              Check-in Records
              {selectedMeal !== "All" && (
                <span style={{
                  marginLeft: 10, padding: "2px 10px", borderRadius: 20,
                  fontSize: 11, fontWeight: 700, background: MEAL_CFG[selectedMeal].bg,
                  color: MEAL_CFG[selectedMeal].color, border: `1px solid ${MEAL_CFG[selectedMeal].border}`,
                }}>
                  {selectedMeal}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {listQuery.isLoading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""}`}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={searchInput} onChange={handleSearch}
                placeholder="Search by name or roll no…"
                style={{ padding: "8px 12px 8px 34px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-pri)", fontSize: 12, outline: "none", minWidth: 220 }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch("") }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: 4, background: "var(--input-bg)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
              {(["All", ...MEAL_TYPES] as const).map(m => {
                const active = selectedMeal === m
                const cfg    = m !== "All" ? MEAL_CFG[m] : null
                return (
                  <button key={m}
                    onClick={() => { setSelectedMeal(m as any); setPage(1) }}
                    style={{
                      padding: "5px 10px", borderRadius: 8, border: "none",
                      background: active ? (cfg?.bg ?? "var(--accent)") : "transparent",
                      color:      active ? (cfg?.color ?? "#fff") : "var(--text-muted)",
                      fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .15s",
                    }}>
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
          gap: 16, padding: "10px 24px",
          borderBottom: "1px solid var(--border)", background: "var(--surface)",
        }}>
          {["Student", "Meal", "Room", "Status", "Marked At"].map((h, i) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {listQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : filtered.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <UserCheck size={36} style={{ marginBottom: 12, opacity: .3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No records found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {total === 0
                    ? "No attendance marked for this date — use Bulk Mark to get started"
                    : "Try adjusting your search"
                  }
                </div>
              </div>
            )
            : filtered.map((rec, idx) => (
              <div key={rec._id}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  gap: 16, alignItems: "center",
                  padding: "11px 24px",
                  borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background .15s",
                  animation: `fadeUp .25s ease ${idx * .025}s both`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Student */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={rec.student?.student_name ?? "?"} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-pri)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {rec.student?.student_name ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>
                      #{rec.student?.student_roll_no ?? "—"}
                    </div>
                  </div>
                </div>

                {/* Meal */}
                <div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600, color: MEAL_CFG[rec.mealType].color,
                  }}>
                    {MEAL_CFG[rec.mealType].icon}
                    {rec.mealType}
                  </span>
                </div>

                {/* Room */}
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)", fontFamily: "'JetBrains Mono',monospace" }}>
                  {(rec.student as any)?.room_id?.room_no ?? "—"}
                </div>

                {/* Status — clickable to cycle */}
                <div>
                  <StatusToggle record={rec} token={token} />
                </div>

                {/* Marked at */}
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} />
                  {fmtTime(rec.markedAt)}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Page {page} of {totalPages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "← Prev", disabled: page <= 1,          action: () => setPage(p => p - 1) },
              { label: "Next →", disabled: page >= totalPages,  action: () => setPage(p => p + 1) },
            ].map(b => (
              <button key={b.label} onClick={b.action} disabled={b.disabled || listQuery.isLoading}
                style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--border)", background: b.disabled ? "transparent" : "var(--input-bg)", color: b.disabled ? "var(--text-muted)" : "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: b.disabled ? "not-allowed" : "pointer" }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {listQuery.error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,.1)", color: "var(--red)", fontSize: 13, border: "1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15} />{(listQuery.error as Error).message}
        </div>
      )}

      {/* Bulk mark modal */}
      {bulkOpen && (
        <BulkMarkPanel date={selectedDate} token={token} onClose={() => setBulkOpen(false)} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select option { background: var(--card); color: var(--text-pri); }
      `}</style>
    </div>
  )
}