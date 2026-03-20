"use client"

import React, { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import {
  Receipt, Plus, Pencil, Trash2, Search, X,
  Loader2, AlertTriangle, Filter, TrendingDown,
  TrendingUp, Wallet, CheckCircle2,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom }   from "../../Store/Store"
import { useDebounce } from "../../components/hooks/useDebounce"
import {
  ExpenseAPI,
  type Expense, type ExpenseCategory,
  type ExpenseFilters, type CreateExpenseDTO,
  EXPENSE_CATEGORIES,
} from "./expenses.api.js";

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CFG: Record<ExpenseCategory, { color: string; bg: string; border: string }> = {
  Salary:        { color: "var(--accent)", bg: "var(--accent-lo)",       border: "rgba(99,102,241,.25)"  },
  Utilities:     { color: "#06b6d4",       bg: "rgba(6,182,212,.10)",    border: "rgba(6,182,212,.25)"   },
  Maintenance:   { color: "var(--amber)",  bg: "rgba(245,158,11,.10)",   border: "rgba(245,158,11,.25)"  },
  Food:          { color: "var(--green)",  bg: "rgba(16,185,129,.10)",   border: "rgba(16,185,129,.25)"  },
  Rent:          { color: "#8b5cf6",       bg: "rgba(139,92,246,.10)",   border: "rgba(139,92,246,.25)"  },
  Equipment:     { color: "#ec4899",       bg: "rgba(236,72,153,.10)",   border: "rgba(236,72,153,.25)"  },
  Miscellaneous: { color: "var(--text-muted)", bg: "var(--input-bg)",   border: "var(--border)"         },
}

function CategoryPill({ category }: { category: ExpenseCategory }) {
  const c = CAT_CFG[category] ?? CAT_CFG.Miscellaneous
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      {category}
    </span>
  )
}

// ─── Avatar / icon ────────────────────────────────────────────────────────────
function CatIcon({ category }: { category: ExpenseCategory }) {
  const c = CAT_CFG[category] ?? CAT_CFG.Miscellaneous
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: c.bg, color: c.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 800,
    }}>
      {category[0]}
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 64px",
      gap: 16, alignItems: "center",
      padding: "14px 24px", borderBottom: "1px solid var(--border)",
      animation: "shimmer 1.4s ease-in-out infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--border)", flexShrink: 0 }} />
        <div>
          <div style={{ width: 160, height: 12, borderRadius: 6, background: "var(--border)", marginBottom: 6 }} />
          <div style={{ width: 90,  height: 10, borderRadius: 6, background: "var(--border)", opacity: .6 }} />
        </div>
      </div>
      {[80, 70, 80].map((w, i) => <div key={i} style={{ width: w, height: 12, borderRadius: 6, background: "var(--border)" }} />)}
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)" }} />
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)" }} />
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, colorVar, isLoading }: {
  icon: React.ReactNode; label: string; value: string
  sub?: string; colorVar: string; isLoading: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 14,
        transition: "transform .2s, box-shadow .2s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "var(--stat-shadow)" : "none",
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `color-mix(in srgb, ${colorVar} 12%, transparent)`, color: colorVar, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>
          {isLoading ? <span style={{ display: "inline-block", width: 70, height: 18, borderRadius: 6, background: "var(--border)", animation: "shimmer 1.4s ease-in-out infinite" }} /> : value}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Expense form (create & edit) ─────────────────────────────────────────────
function ExpenseForm({ editing, token, onDone, onCancel }: {
  editing?: Expense | null
  token:    string
  onDone:  () => void
  onCancel:() => void
}) {
  const [form, setForm] = useState<CreateExpenseDTO>({
    description: editing?.description ?? "",
    amount:      editing?.amount      ?? (0 as any),
    category:    editing?.category    ?? "Miscellaneous",
    date:        editing?.date ? editing.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    note:        editing?.note        ?? "",
  })
  const [err, setErr] = useState<string | null>(null)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (dto: CreateExpenseDTO) => {
      if (editing) return ExpenseAPI.update(editing._id, dto, token)
      return ExpenseAPI.create(dto, token)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] })
      onDone()
    },
    onError: (e: Error) => setErr(e.message),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { setErr("Amount must be greater than 0."); return }
    setErr(null)
    mutation.mutate({ ...form, amount: Number(form.amount) })
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
  const busy = mutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Description */}
      <div>
        <label style={labelStyle}>Description *</label>
        <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="e.g. March staff salary" required disabled={busy} style={inputStyle}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Amount */}
        <div>
          <label style={labelStyle}>Amount (₹) *</label>
          <input type="number" min="0.01" step="0.01" value={form.amount || ""}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value as any }))}
            required disabled={busy} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
        </div>
        {/* Date */}
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={form.date ?? ""} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            required disabled={busy} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
        </div>
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>Category</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {EXPENSE_CATEGORIES.map(cat => {
            const active = form.category === cat
            const c = CAT_CFG[cat]
            return (
              <button key={cat} type="button" disabled={busy}
                onClick={() => setForm(p => ({ ...p, category: cat }))}
                style={{
                  padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                  border:      `1px solid ${active ? c.border : "var(--border)"}`,
                  background:  active ? c.bg : "transparent",
                  color:       active ? c.color : "var(--text-muted)",
                  fontSize:    11, fontWeight: active ? 700 : 500,
                  transition:  "all .15s",
                }}>
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Note */}
      <div>
        <label style={labelStyle}>Note <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
        <input value={form.note ?? ""} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="Any additional details…" disabled={busy} style={inputStyle}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
      </div>

      {err && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.12)", color: "var(--red)", fontSize: 12 }}>
          <AlertTriangle size={13} />{err}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
        <button type="button" onClick={onCancel} disabled={busy}
          style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={busy}
          style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: busy ? "var(--border)" : "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {busy
            ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Saving…</>
            : editing ? <><CheckCircle2 size={13} />Save Changes</> : <><Plus size={13} />Add Expense</>
          }
        </button>
      </div>
    </form>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ expense, token, onDone, onCancel }: {
  expense: Expense; token: string; onDone: () => void; onCancel: () => void
}) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => ExpenseAPI.delete(expense._id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); onDone() },
  })
  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 16 }}>
        Permanently delete <strong style={{ color: "var(--text-pri)" }}>{expense.description}</strong>?
        This cannot be undone.
      </div>
      {mutation.error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.12)", color: "var(--red)", fontSize: 12, marginBottom: 14 }}>
          <AlertTriangle size={13} />{(mutation.error as Error).message}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} disabled={mutation.isPending}
          style={{ flex: 1, padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          style={{ flex: 1, padding: 10, borderRadius: 12, border: "none", background: mutation.isPending ? "var(--border)" : "var(--red)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {mutation.isPending ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Deleting…</> : <><Trash2 size={13} />Delete</>}
        </button>
      </div>
    </div>
  )
}

// ─── Slide-in panel ───────────────────────────────────────────────────────────
function SidePanel({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--overlay)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 460,
        background: "var(--surface)", borderLeft: "1px solid var(--border)",
        boxShadow: "var(--shadow)", display: "flex", flexDirection: "column",
        animation: "slideIn .25s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif" }}>{title}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Expenses: React.FC = () => {
  const { token }  = useCustom() as { token: string }

  const [searchInput, setSearchInput] = useState("")
  const [filters, setFiltersState]    = useState<ExpenseFilters>({ page: 1, limit: 15, sortBy: "date", sortOrder: "desc" })
  const [showFilters, setShowFilters] = useState(false)
  const [panel, setPanel]             = useState<
    | { mode: "create" }
    | { mode: "edit";   expense: Expense }
    | { mode: "delete"; expense: Expense }
    | null
  >(null)

  const setF = useCallback((partial: Partial<ExpenseFilters>) =>
    setFiltersState(p => ({ ...p, ...partial, page: 1 })), [])

  const applySearch = useDebounce((v: string) => setF({ search: v }), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); applySearch(e.target.value)
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey:  ["expenses", "list", filters],
    queryFn:   () => ExpenseAPI.getAll(filters, token),
    staleTime: 60_000,
    enabled:   !!token,
    placeholderData: (prev) => prev,
  })

  const statsQuery = useQuery({
    queryKey:  ["expenses", "stats"],
    queryFn:   () => ExpenseAPI.getStats(token),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })

  const expenses   = listQuery.data?.data       ?? []
  const total      = listQuery.data?.total      ?? 0
  const totalPages = listQuery.data?.totalPages ?? 1
  const pageTotal  = listQuery.data?.totalAmount ?? 0
  const stats      = statsQuery.data?.data

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  const monthDiff = stats ? stats.thisMonth - stats.lastMonth : 0
  const monthTrend = monthDiff >= 0 ? "up" : "down"

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 8px var(--red)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Finance</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>Expenses</h1>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>Track all hostel operational costs</p>
        </div>
        <button onClick={() => setPanel({ mode: "create" })}
          style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 0 20px var(--accent-glow)" }}>
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
        <StatCard icon={<Wallet       size={18} />} label="Total Expenses"  value={fmt(stats?.totalAmount ?? 0)}   colorVar="var(--red)"    isLoading={statsQuery.isLoading} />
        <StatCard icon={<TrendingDown size={18} />} label="This Month"      value={fmt(stats?.thisMonth   ?? 0)}   colorVar="var(--amber)"  isLoading={statsQuery.isLoading}
          sub={stats ? `${monthTrend === "up" ? "▲" : "▼"} ₹${Math.abs(monthDiff).toLocaleString("en-IN")} vs last month` : undefined} />
        <StatCard icon={<Receipt      size={18} />} label="Total Records"   value={String(stats?.totalCount ?? 0)} colorVar="var(--accent)" isLoading={statsQuery.isLoading} />
        <StatCard icon={<TrendingUp   size={18} />} label="Page Total"      value={fmt(pageTotal)}                 colorVar="#06b6d4"       isLoading={listQuery.isLoading}  />
      </div>

      {/* ── Table card ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pri)" }}>All Expenses</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {listQuery.isLoading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""}`}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input value={searchInput} onChange={handleSearch} placeholder="Search description…"
                style={{ padding: "8px 12px 8px 34px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-pri)", fontSize: 12, outline: "none", minWidth: 210 }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setF({ search: undefined }) }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div style={{ display: "flex", gap: 4, background: "var(--input-bg)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
              <button onClick={() => setF({ category: undefined })}
                style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: !filters.category ? "var(--accent)" : "transparent", color: !filters.category ? "#fff" : "var(--text-muted)", fontSize: 11, fontWeight: !filters.category ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
                All
              </button>
              {EXPENSE_CATEGORIES.map(cat => {
                const active = filters.category === cat
                const c = CAT_CFG[cat]
                return (
                  <button key={cat} onClick={() => setF({ category: active ? undefined : cat })}
                    style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: active ? c.bg : "transparent", color: active ? c.color : "var(--text-muted)", fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
                    {cat}
                  </button>
                )
              })}
            </div>

            {/* Date filter toggle */}
            <button onClick={() => setShowFilters(p => !p)}
              style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${showFilters ? "var(--accent)" : "var(--border)"}`, background: showFilters ? "var(--accent-lo)" : "transparent", color: showFilters ? "var(--accent)" : "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} /> Date
            </button>
          </div>
        </div>

        {/* Date filters */}
        {showFilters && (
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[{ label: "From", key: "from" }, { label: "To", key: "to" }].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{f.label}</div>
                <input type="date" value={(filters as any)[f.key] ?? ""}
                  onChange={e => setF({ [f.key]: e.target.value || undefined } as any)}
                  style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-pri)", fontSize: 12, outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
              </div>
            ))}
            <button onClick={() => { setF({ from: undefined, to: undefined }); setShowFilters(false) }}
              style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, cursor: "pointer" }}>
              Clear
            </button>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 64px", gap: 16, padding: "10px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          {["Description", "Category", "Amount", "Date", ""].map((h, i) => (
            <div key={h + i} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i === 4 ? "right" : "left" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {listQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : expenses.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <Receipt size={36} style={{ marginBottom: 12, opacity: .3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No expenses found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add Expense" to record one</div>
              </div>
            )
            : expenses.map((exp, idx) => (
              <div key={exp._id}
                style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 64px", gap: 16, alignItems: "center", padding: "13px 24px", borderBottom: idx < expenses.length - 1 ? "1px solid var(--border)" : "none", transition: "background .15s", animation: `fadeUp .25s ease ${idx * .025}s both` }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Description */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <CatIcon category={exp.category} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-pri)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.description}</div>
                    {exp.note && <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.note}</div>}
                  </div>
                </div>

                <div><CategoryPill category={exp.category} /></div>

                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--red)", fontFamily: "'DM Serif Display',serif" }}>
                  {fmt(exp.amount)}
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(exp.date)}</div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button onClick={() => setPanel({ mode: "edit", expense: exp })} title="Edit"
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "var(--accent-lo)", color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setPanel({ mode: "delete", expense: exp })} title="Delete"
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(239,68,68,.10)", color: "var(--red)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Page {filters.page ?? 1} of {totalPages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "← Prev", disabled: (filters.page ?? 1) <= 1,          action: () => setFiltersState(p => ({ ...p, page: (p.page ?? 1) - 1 })) },
              { label: "Next →", disabled: (filters.page ?? 1) >= totalPages,  action: () => setFiltersState(p => ({ ...p, page: (p.page ?? 1) + 1 })) },
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

      {/* ── Side panel ── */}
      {panel?.mode === "create" && (
        <SidePanel title="Add New Expense" onClose={() => setPanel(null)}>
          <ExpenseForm token={token} onDone={() => setPanel(null)} onCancel={() => setPanel(null)} />
        </SidePanel>
      )}
      {panel?.mode === "edit" && (
        <SidePanel title="Edit Expense" onClose={() => setPanel(null)}>
          <ExpenseForm editing={panel.expense} token={token} onDone={() => setPanel(null)} onCancel={() => setPanel(null)} />
        </SidePanel>
      )}
      {panel?.mode === "delete" && (
        <SidePanel title="Delete Expense" onClose={() => setPanel(null)}>
          <DeleteConfirm expense={panel.expense} token={token} onDone={() => setPanel(null)} onCancel={() => setPanel(null)} />
        </SidePanel>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shimmer  { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        select option { background: var(--card); color: var(--text-pri); }
      `}</style>
    </div>
  )
}

export default Expenses