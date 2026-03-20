"use client"

import React, {
  useState, useEffect, useRef, useCallback, type ChangeEvent,
} from "react"
import { Chart, registerables } from "chart.js"
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Download,
  RefreshCw, Plus, Trash2, Pencil, Loader2, AlertTriangle,
  CreditCard, Receipt, Users, Wallet, X, Filter,
} from "lucide-react"
import { useCustom } from "../../Store/Store"

Chart.register(...registerables)

// ─── Types ────────────────────────────────────────────────────────────────────
// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE = "http://localhost:8000/api"

interface ReportSummary {
  total_enrolled_students: number
  total_payments_period:   number
  total_expenses_period:   number
  net_balance:             number
  total_outstanding:       number
  overdue_invoices:        number
}

interface TrendItem   { name: string; Income: number; Expense: number }
interface PieItem     { category: string; amount: number }
interface PaymentRow  { _id: string; student_name: string; invoiceNumber: string; totalAmount: number; paymentDate: string; paymentMethod: string }
interface ExpenseRow  { _id: string; description: string; amount: number; date: string; expense_type: string; note?: string }

interface ReportData {
  summaryCard:    ReportSummary
  charts:         { trendChart: TrendItem[]; expensePieChart: PieItem[] }
  recentActivity: { payments: PaymentRow[]; expenses: ExpenseRow[] }
  dateRange:      { from: string; to: string }
}

interface Filters { month: string; fromDate: string; toDate: string }

// ─── Request helper ───────────────────────────────────────────────────────────
async function req<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Error ${res.status}`)
  return json
}

// ─── Chart theme helpers ──────────────────────────────────────────────────────
// Read CSS variables at runtime so charts match the active theme
function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#999"
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, colorVar, trend }: {
  icon: React.ReactNode; label: string; value: string
  sub: string; colorVar: string; trend?: "up" | "down" | "neutral"
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 18, padding: "20px 22px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "transform .2s, box-shadow .2s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "var(--stat-shadow)" : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -16, right: -16, width: 80, height: 80, borderRadius: "50%", background: `color-mix(in srgb, ${colorVar} 6%, transparent)`, pointerEvents: "none" }} />
      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `color-mix(in srgb, ${colorVar} 12%, transparent)`, color: colorVar, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>{value}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          {trend === "up"      && <TrendingUp   size={11} color="var(--green)" />}
          {trend === "down"    && <TrendingDown  size={11} color="var(--red)"   />}
          {sub}
        </div>
      </div>
    </div>
  )
}

// ─── Add expense modal ────────────────────────────────────────────────────────
const CATEGORIES = ["Salary","Utilities","Maintenance","Food","Rent","Equipment","Miscellaneous"]

function ExpenseModal({ onClose, onSaved, token, editing }: {
  onClose: () => void; onSaved: () => void; token: string
  editing?: ExpenseRow | null
}) {
  const [form, setForm] = useState({
    description: editing?.description ?? "",
    amount:      editing?.amount      ?? "",
    category:    editing?.expense_type ?? "Miscellaneous",
    date:        editing?.date ? editing.date.slice(0,10) : new Date().toISOString().slice(0,10),
    note:        editing?.note ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string|null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setErr(null)
    try {
      if (editing) {
        await req(`${BASE}/admin/report/expenses/${editing._id}`, token, { method: "PATCH", body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      } else {
        await req(`${BASE}/admin/report/expenses`, token, { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      }
      onSaved()
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-pri)", fontSize: 13, outline: "none" }
  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--overlay)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, width: "100%", maxWidth: 460, boxShadow: "var(--shadow)", animation: "fadeUp .2s ease" }}>
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif" }}>
            {editing ? "Edit Expense" : "Record Expense"}
          </div>
          <button onClick={onClose} disabled={saving} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Description *</label>
              <input style={inputStyle} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} required disabled={saving} placeholder="e.g. Staff salary — March"
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} required disabled={saving}
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
            <div>
              <label style={labelStyle}>Date *</label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} required disabled={saving}
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} disabled={saving}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Note</label>
              <input style={inputStyle} value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} placeholder="Optional note" disabled={saving}
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
          </div>
          {err && <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:"rgba(239,68,68,.12)",color:"var(--red)",fontSize:12,marginBottom:14 }}><AlertTriangle size={13}/>{err}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ flex:1,padding:10,borderRadius:12,border:"1px solid var(--border)",background:"transparent",color:"var(--text-sec)",fontSize:12,fontWeight:600,cursor:"pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex:1,padding:10,borderRadius:12,border:"none",background:saving?"var(--border)":"var(--accent)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              {saving ? <><Loader2 size={13} style={{animation:"spin .8s linear infinite"}}/>Saving…</> : editing ? "Save Changes" : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const Reports: React.FC = () => {
  const { token } = useCustom() as { token: string }

  const [filters,    setFilters]    = useState<Filters>({ month: "", fromDate: "", toDate: "" })
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeTab,  setActiveTab]  = useState<"payments" | "expenses">("payments")
  const [expModal,   setExpModal]   = useState(false)
  const [editExp,    setEditExp]    = useState<ExpenseRow | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  const barRef = useRef<HTMLCanvasElement>(null)
  const pieRef = useRef<HTMLCanvasElement>(null)
  const barChart = useRef<Chart | null>(null)
  const pieChart = useRef<Chart | null>(null)

  // ── Fetch report ────────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setIsLoading(true); setFetchError(null)
    try {
      const params = new URLSearchParams()
      if (filters.month)    params.set("month",    filters.month)
      if (filters.fromDate) params.set("fromDate", filters.fromDate)
      if (filters.toDate)   params.set("toDate",   filters.toDate)
      const res = await req<{ success: boolean; data: ReportData }>(
        `${BASE}/admin/report?${params.toString()}`, token
      )
      setReportData(res.data)
    } catch (e: any) { setFetchError(e.message) }
    finally { setIsLoading(false) }
  }, [filters, token])

  useEffect(() => { fetchReport() }, [])    // initial load only; filter button triggers explicitly

  // ── Build charts whenever data changes ──────────────────────────────────────
  useEffect(() => {
    if (!reportData) return

    const textMuted  = cssVar("--text-muted")  || "#64748b"
    const borderCol  = cssVar("--border")       || "#334155"
    const cardCol    = cssVar("--card")         || "#1e293b"

    // Destroy previous instances
    barChart.current?.destroy()
    pieChart.current?.destroy()

    // Bar chart
    const barCtx = barRef.current?.getContext("2d")
    if (barCtx && reportData.charts.trendChart.length) {
      barChart.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: reportData.charts.trendChart.map(d => d.name),
          datasets: [
            {
              label:           "Income",
              data:            reportData.charts.trendChart.map(d => d.Income),
              backgroundColor: "rgba(16,185,129,.7)",
              borderColor:     "rgba(16,185,129,1)",
              borderWidth:     1,
              borderRadius:    6,
            },
            {
              label:           "Expenses",
              data:            reportData.charts.trendChart.map(d => d.Expense),
              backgroundColor: "rgba(239,68,68,.7)",
              borderColor:     "rgba(239,68,68,1)",
              borderWidth:     1,
              borderRadius:    6,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: textMuted, font: { family: "DM Sans" } } },
            title:  { display: false },
          },
          scales: {
            x: { ticks: { color: textMuted }, grid: { color: borderCol } },
            y: {
              beginAtZero: true,
              ticks: {
                color: textMuted,
                callback: v => `₹${(Number(v)/1000).toFixed(0)}K`,
              },
              grid: { color: borderCol },
            },
          },
        },
      })
    }

    // Pie chart
    const pieCtx = pieRef.current?.getContext("2d")
    if (pieCtx && reportData.charts.expensePieChart.length) {
      const palette = [
        "rgba(99,102,241,.8)",   // accent
        "rgba(16,185,129,.8)",   // green
        "rgba(245,158,11,.8)",   // amber
        "rgba(239,68,68,.8)",    // red
        "rgba(6,182,212,.8)",    // cyan
        "rgba(139,92,246,.8)",   // purple
        "rgba(236,72,153,.8)",   // pink
      ]
      pieChart.current = new Chart(pieCtx, {
        type: "doughnut",
        data: {
          labels: reportData.charts.expensePieChart.map(d => d.category),
          datasets: [{
            data:            reportData.charts.expensePieChart.map(d => d.amount),
            backgroundColor: palette.slice(0, reportData.charts.expensePieChart.length),
            borderColor:     cardCol,
            borderWidth:     3,
            hoverOffset:     8,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          cutout: "60%",
          plugins: {
            legend: {
              position: "bottom",
              labels:   { color: textMuted, font: { family: "DM Sans" }, padding: 16, boxWidth: 12 },
            },
          },
        },
      })
    }

    return () => { barChart.current?.destroy(); pieChart.current?.destroy() }
  }, [reportData])

  // ── Delete expense ───────────────────────────────────────────────────────────
  const handleDeleteExpense = async (id: string) => {
    setDeleting(id)
    try {
      await req(`${BASE}/admin/report/expenses/${id}`, token, { method: "DELETE" })
      fetchReport()
    } catch (e: any) { alert(e.message) }
    finally { setDeleting(null) }
  }

  // ── Format helpers ──────────────────────────────────────────────────────────
  const fmt   = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  const s   = reportData?.summaryCard
  const bal = (s?.net_balance ?? 0)

  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-pri)", fontSize: 12, outline: "none" }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Financial Reports</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>Reports & Analytics</h1>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>
            {reportData ? `${fmtDate(reportData.dateRange.from)} — ${fmtDate(reportData.dateRange.to)}` : "Comprehensive financial analysis"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setExpModal(true)}
            style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 0 20px var(--accent-glow)" }}
          >
            <Plus size={14} /> Record Expense
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: "9px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Filter size={13} color="var(--accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Filters</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Month</div>
            <input type="month" value={filters.month} onChange={e => setFilters(p=>({...p,month:e.target.value,fromDate:"",toDate:""}))} style={inputStyle}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", paddingBottom: 8 }}>or</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>From</div>
            <input type="date" value={filters.fromDate} onChange={e => setFilters(p=>({...p,fromDate:e.target.value,month:""}))} style={inputStyle}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>To</div>
            <input type="date" value={filters.toDate} onChange={e => setFilters(p=>({...p,toDate:e.target.value,month:""}))} style={inputStyle}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          <button onClick={fetchReport} disabled={isLoading} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
            {isLoading ? <Loader2 size={13} style={{animation:"spin .8s linear infinite"}}/> : <RefreshCw size={13}/>}
            Apply
          </button>
          <button onClick={() => { setFilters({month:"",fromDate:"",toDate:""}); setTimeout(fetchReport, 0) }} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 12, cursor: "pointer" }}>
            Clear
          </button>
        </div>
      </div>

      {fetchError && (
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:"rgba(239,68,68,.1)",color:"var(--red)",fontSize:13,border:"1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15}/>{fetchError}
        </div>
      )}

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        <KpiCard icon={<Users      size={20}/>} label="Enrolled Students"  value={isLoading?"—":String(s?.total_enrolled_students??0)} sub="Active hostel residents"  colorVar="var(--accent)" />
        <KpiCard icon={<CreditCard size={20}/>} label="Income Collected"   value={isLoading?"—":fmt(s?.total_payments_period??0)}      sub="Payments this period"    colorVar="var(--green)"  trend="up" />
        <KpiCard icon={<Receipt    size={20}/>} label="Total Expenses"     value={isLoading?"—":fmt(s?.total_expenses_period??0)}      sub="Expenditure this period" colorVar="var(--red)"    trend="down" />
        <KpiCard icon={<Wallet     size={20}/>} label="Net Balance"        value={isLoading?"—":fmt(bal)}                              sub={bal>=0?"Surplus period":"Deficit period"}  colorVar={bal>=0?"var(--green)":"var(--red)"} trend={bal>=0?"up":"down"} />
        <KpiCard icon={<TrendingDown size={20}/>} label="Outstanding Dues" value={isLoading?"—":fmt(s?.total_outstanding??0)}         sub="Uncollected from students" colorVar="var(--amber)" />
        <KpiCard icon={<AlertTriangle size={20}/>} label="Overdue Invoices" value={isLoading?"—":String(s?.overdue_invoices??0)}      sub="Require follow-up"        colorVar="var(--red)" />
      </div>

      {/* ── Financial summary table ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Financial Summary</div>
        </div>
        <div style={{ padding: "0 24px" }}>
          {[
            { label: "Total Income",   value: s?.total_payments_period??0,  color: "var(--green)", pct: 100 },
            { label: "Total Expenses", value: s?.total_expenses_period??0,  color: "var(--red)",
              pct: s?.total_payments_period ? Math.round((s.total_expenses_period/s.total_payments_period)*100) : 0 },
            { label: "Net Balance",    value: bal,                           color: bal>=0?"var(--green)":"var(--red)",
              pct: s?.total_payments_period ? Math.abs(Math.round((bal/s.total_payments_period)*100)) : 0 },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i<arr.length-1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-pri)" }}>{row.label}</div>
              {/* Progress bar */}
              <div style={{ width: 160, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100,row.pct)}%`, background: row.color, borderRadius: 3, transition: "width .6s ease" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", width: 36, textAlign: "right" }}>{row.pct}%</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: row.color, width: 130, textAlign: "right", fontFamily: "'DM Serif Display',serif" }}>
                {fmt(row.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <BarChart3 size={16} color="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Income vs Expenses Trend</span>
          </div>
          {isLoading
            ? <div style={{ height: 220, background: "var(--border)", borderRadius: 10, animation: "shimmer 1.4s ease-in-out infinite" }} />
            : reportData?.charts.trendChart.length === 0
            ? <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>No trend data yet — generate daily snapshots</div>
            : <canvas ref={barRef} style={{ maxHeight: 220 }} />
          }
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <PieChart size={16} color="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Expense Breakdown</span>
          </div>
          {isLoading
            ? <div style={{ height: 220, background: "var(--border)", borderRadius: 10, animation: "shimmer 1.4s ease-in-out infinite" }} />
            : reportData?.charts.expensePieChart.length === 0
            ? <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>No expenses recorded yet</div>
            : <canvas ref={pieRef} style={{ maxHeight: 220 }} />
          }
        </div>
      </div>

      {/* ── Transactions table ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["payments","expenses"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "14px 0", border: "none", background: "transparent",
              borderBottom: `2px solid ${activeTab===tab?"var(--accent)":"transparent"}`,
              color: activeTab===tab?"var(--accent)":"var(--text-muted)",
              fontSize: 12, fontWeight: activeTab===tab?700:500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all .15s",
            }}>
              {tab === "payments" ? <CreditCard size={13}/> : <Receipt size={13}/>}
              {tab === "payments" ? "Payments" : "Expenses"}
            </button>
          ))}
        </div>

        {/* Column headers */}
        {activeTab === "payments" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, padding: "10px 24px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              {["Student","Invoice","Amount","Date"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
              ))}
            </div>
            {isLoading
              ? Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16,padding:"13px 24px",borderBottom:"1px solid var(--border)",animation:"shimmer 1.4s ease-in-out infinite" }}>
                    {[120,80,70,80].map((w,j) => <div key={j} style={{width:w,height:12,borderRadius:6,background:"var(--border)"}}/>)}
                  </div>
                ))
              : !reportData?.recentActivity.payments.length
              ? <div style={{padding:"40px 0",textAlign:"center",color:"var(--text-muted)",fontSize:13,fontStyle:"italic"}}>No payments in this period</div>
              : reportData.recentActivity.payments.map((p, i, arr) => (
                  <div key={p._id} style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16,padding:"13px 24px",borderBottom:i<arr.length-1?"1px solid var(--border)":"none",transition:"background .15s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="var(--card-hover)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text-pri)"}}>{p.student_name}</div>
                    <div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"'JetBrains Mono',monospace"}}>{p.invoiceNumber}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--green)"}}>{fmt(p.totalAmount)}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>{fmtDate(p.paymentDate)}</div>
                  </div>
                ))
            }
          </>
        ) : (
          <>
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:16,padding:"10px 24px",background:"var(--surface)",borderBottom:"1px solid var(--border)" }}>
              {["Description","Category","Amount","Date",""].map(h => (
                <div key={h} style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</div>
              ))}
            </div>
            {isLoading
              ? Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:16,padding:"13px 24px",borderBottom:"1px solid var(--border)",animation:"shimmer 1.4s ease-in-out infinite"}}>
                    {[140,70,70,80,40].map((w,j) => <div key={j} style={{width:w,height:12,borderRadius:6,background:"var(--border)"}}/>)}
                  </div>
                ))
              : !reportData?.recentActivity.expenses.length
              ? <div style={{padding:"40px 0",textAlign:"center",color:"var(--text-muted)",fontSize:13,fontStyle:"italic"}}>No expenses recorded — click "Record Expense" to add one</div>
              : reportData.recentActivity.expenses.map((e, i, arr) => (
                  <div key={e._id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:16,alignItems:"center",padding:"13px 24px",borderBottom:i<arr.length-1?"1px solid var(--border)":"none",transition:"background .15s"}}
                    onMouseEnter={ev=>(ev.currentTarget.style.background="var(--card-hover)")}
                    onMouseLeave={ev=>(ev.currentTarget.style.background="transparent")}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text-pri)"}}>{e.description}</div>
                      {e.note && <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{e.note}</div>}
                    </div>
                    <span style={{display:"inline-block",padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"var(--accent-lo)",color:"var(--accent)"}}>{e.expense_type}</span>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--red)"}}>{fmt(e.amount)}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>{fmtDate(e.date)}</div>
                    <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                      <button onClick={() => { setEditExp(e); setExpModal(true) }} style={{width:26,height:26,borderRadius:7,border:"none",background:"var(--accent-lo)",color:"var(--accent)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Pencil size={12}/>
                      </button>
                      <button onClick={() => handleDeleteExpense(e._id)} disabled={!!deleting} style={{width:26,height:26,borderRadius:7,border:"none",background:"rgba(239,68,68,.1)",color:"var(--red)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {deleting===e._id ? <Loader2 size={12} style={{animation:"spin .8s linear infinite"}}/> : <Trash2 size={12}/>}
                      </button>
                    </div>
                  </div>
                ))
            }
          </>
        )}
      </div>

      {/* Expense modal */}
      {expModal && (
        <ExpenseModal
          token={token}
          editing={editExp}
          onClose={() => { setExpModal(false); setEditExp(null) }}
          onSaved={() => { setExpModal(false); setEditExp(null); fetchReport() }}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select option { background: var(--card); color: var(--text-pri); }
        @media print {
          button, .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

export default Reports