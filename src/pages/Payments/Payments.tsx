"use client"

import React, { useState, useCallback, type ChangeEvent } from "react"
import {
  CreditCard, Search, X, Printer, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle,
  Wallet, TrendingUp, Hash, Filter,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom }  from "../../Store/Store"
import { useDebounce } from "../../components/hooks/useDebounce"
import {
  PaymentAPI,
  type PopulatedPayment,
  type PaymentMethod,
  type PaymentStatus,
} from "./payment.api"

// ─── Status / method configs ──────────────────────────────────────────────────
const STATUS_CFG: Record<PaymentStatus, { label: string; color: string; bg: string; dot: string; border: string; icon: React.ReactNode }> = {
  successful: { label: "Successful", color: "var(--green)",  bg: "rgba(16,185,129,.10)", dot: "var(--green)",  border: "rgba(16,185,129,.25)", icon: <CheckCircle2 size={11}/> },
  pending:    { label: "Pending",    color: "var(--amber)",  bg: "rgba(245,158,11,.10)", dot: "var(--amber)",  border: "rgba(245,158,11,.25)", icon: <Clock        size={11}/> },
  failed:     { label: "Failed",     color: "var(--red)",    bg: "rgba(239,68,68,.10)",  dot: "var(--red)",    border: "rgba(239,68,68,.25)",  icon: <XCircle      size={11}/> },
}

const METHOD_CFG: Record<PaymentMethod, { label: string; color: string; bg: string }> = {
  "Cash":          { label: "Cash",          color: "var(--green)",  bg: "rgba(16,185,129,.10)" },
  "Online":        { label: "Online",        color: "var(--accent)", bg: "var(--accent-lo)"     },
  "Bank Transfer": { label: "Bank Transfer", color: "#06b6d4",       bg: "rgba(6,182,212,.10)"  },
  "Cheque":        { label: "Cheque",        color: "var(--amber)",  bg: "rgba(245,158,11,.10)" },
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.successful
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:"0.04em",color:c.color,background:c.bg,border:`1px solid ${c.border}` }}>
      <span style={{ width:5,height:5,borderRadius:"50%",background:c.dot,flexShrink:0 }} />{c.label}
    </span>
  )
}

function MethodPill({ method }: { method: PaymentMethod }) {
  const c = METHOD_CFG[method] ?? METHOD_CFG["Cash"]
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,color:c.color,background:c.bg }}>
      {c.label}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = (name ?? "?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()
  const hue      = (name ?? "").split("").reduce((a,c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,background:`hsl(${hue},40%,28%)`,border:`1px solid hsl(${hue},40%,38%)`,color:`hsl(${hue},70%,82%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700 }}>
      {initials}
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 48px",gap:16,alignItems:"center",padding:"14px 24px",borderBottom:"1px solid var(--border)",animation:"shimmer 1.4s ease-in-out infinite" }}>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:10,background:"var(--border)",flexShrink:0 }} />
        <div>
          <div style={{ width:120,height:12,borderRadius:6,background:"var(--border)",marginBottom:6 }} />
          <div style={{ width:70,height:10,borderRadius:6,background:"var(--border)",opacity:.6 }} />
        </div>
      </div>
      {[80,80,70,80].map((w,i)=>(
        <div key={i} style={{ width:w,height:12,borderRadius:6,background:"var(--border)" }} />
      ))}
      <div style={{ width:28,height:28,borderRadius:8,background:"var(--border)" }} />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, colorVar, isLoading }: { icon:React.ReactNode; label:string; value:string|number; colorVar:string; isLoading:boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,transition:"transform .2s, box-shadow .2s",transform:hov?"translateY(-2px)":"none",boxShadow:hov?"var(--stat-shadow)":"none" }}>
      <div style={{ width:42,height:42,borderRadius:12,flexShrink:0,background:`color-mix(in srgb, ${colorVar} 12%, transparent)`,color:colorVar,display:"flex",alignItems:"center",justifyContent:"center" }}>{icon}</div>
      <div>
        <div style={{ fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:22,fontWeight:800,color:"var(--text-pri)",lineHeight:1,fontFamily:"'DM Serif Display',serif" }}>
          {isLoading ? <span style={{ display:"inline-block",width:60,height:18,borderRadius:6,background:"var(--border)",animation:"shimmer 1.4s ease-in-out infinite" }} /> : value}
        </div>
      </div>
    </div>
  )
}

// ─── Receipt printer ──────────────────────────────────────────────────────────
function printReceipt(p: PopulatedPayment) {
  const w = window.open("", "_blank")
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;padding:32px;color:#0f172a;max-width:420px;margin:auto}
    .logo{font-size:22px;font-weight:800;margin-bottom:4px}
    .sub{font-size:12px;color:#64748b;margin-bottom:24px}
    hr{border:none;border-top:1px solid #e2e8f0;margin:16px 0}
    .row{display:flex;justify-content:space-between;margin:8px 0;font-size:13px}
    .label{color:#64748b}.value{font-weight:600}
    .amount{font-size:28px;font-weight:800;color:#0f172a;margin:16px 0}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#d1fae5;color:#065f46}
    @media print{body{padding:16px}}
  </style></head><body>
    <div class="logo">Hostel Admin</div>
    <div class="sub">Payment Receipt</div>
    <hr/>
    <div class="row"><span class="label">Receipt ID</span><span class="value" style="font-family:monospace">${p._id?.toString().slice(-8).toUpperCase()}</span></div>
    <div class="row"><span class="label">Student</span><span class="value">${p.student?.student_name ?? "—"}</span></div>
    <div class="row"><span class="label">Roll No.</span><span class="value">${p.student?.student_roll_no ?? "—"}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${new Date(p.paymentDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</span></div>
    <div class="row"><span class="label">Method</span><span class="value">${p.paymentMethod}</span></div>
    ${p.transactionId ? `<div class="row"><span class="label">Transaction ID</span><span class="value">${p.transactionId}</span></div>` : ""}
    <hr/>
    <div class="amount">₹${p.totalAmount?.toLocaleString("en-IN")}</div>
    <div class="badge">✓ ${p.paymentStatus?.toUpperCase()}</div>
    <hr/>
    <div style="font-size:11px;color:#94a3b8;margin-top:16px;text-align:center">This is a computer-generated receipt.</div>
  </body></html>`)
  w.document.close()
  setTimeout(() => { w.print() }, 200)
}

// ─── Main component ───────────────────────────────────────────────────────────
const Payments: React.FC = () => {
  const { token }      = useCustom() as { token: string }
  const queryClient    = useQueryClient()

  const [searchInput,  setSearchInput]  = useState("")
  const [filters,      setFiltersState] = useState({ student_roll_no:"", paymentDate:"", paymentMethod:"" as PaymentMethod|"", paymentStatus:""as PaymentStatus|"", page:1, limit:10 })
  const [showFilters,  setShowFilters]  = useState(false)

  const applySearch = useDebounce((v:string) => setFiltersState(p=>({...p,student_roll_no:v,page:1})), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => { setSearchInput(e.target.value); applySearch(e.target.value) }
  const setF = useCallback((partial: Partial<typeof filters>) => setFiltersState(p=>({...p,...partial,page:1})), [])

  // ── Queries ─────────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey:  ["payments", "list", filters],
    queryFn:   () => PaymentAPI.getAll(filters, token),
    staleTime: 60_000,
    enabled:   !!token,
    placeholderData: (prev) => prev,
  })

  const statsQuery = useQuery({
    queryKey:  ["payments", "stats"],
    queryFn:   () => PaymentAPI.getStats(token),
    staleTime: 2 * 60_000,
    enabled:   !!token,
  })

  const payments   = listQuery.data?.data       ?? []
  const total      = listQuery.data?.total      ?? 0
  const totalPages = listQuery.data?.totalPages ?? 1
  const pageTotal  = listQuery.data?.totalAmount ?? 0
  const stats      = statsQuery.data?.data

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalRevenue  = stats?.byStatus?.successful?.amount ?? 0
  const pendingAmount = stats?.byStatus?.pending?.amount    ?? 0
  const totalCount    = (stats?.totalCount ?? 0)

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",color:"var(--text-pri)",display:"flex",flexDirection:"column",gap:24 }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:"var(--accent)",boxShadow:"0 0 8px var(--accent)" }} />
          <span style={{ fontSize:10,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em" }}>Finance</span>
        </div>
        <h1 style={{ margin:0,fontSize:28,fontWeight:800,color:"var(--text-pri)",lineHeight:1.1,fontFamily:"'DM Serif Display',serif" }}>Payments</h1>
        <p style={{ margin:"5px 0 0",fontSize:13,color:"var(--text-sec)" }}>Track and manage student payment records</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14 }}>
        <StatCard icon={<Wallet    size={18}/>} label="Total Revenue"   value={`₹${totalRevenue.toLocaleString("en-IN")}`}  colorVar="var(--green)"  isLoading={statsQuery.isLoading} />
        <StatCard icon={<Clock     size={18}/>} label="Pending"         value={`₹${pendingAmount.toLocaleString("en-IN")}`} colorVar="var(--amber)"  isLoading={statsQuery.isLoading} />
        <StatCard icon={<Hash      size={18}/>} label="Total Records"   value={totalCount}                                   colorVar="var(--accent)" isLoading={statsQuery.isLoading} />
        <StatCard icon={<TrendingUp size={18}/>} label="This Page Total" value={`₹${pageTotal.toLocaleString("en-IN")}`}    colorVar="#06b6d4"       isLoading={listQuery.isLoading}  />
      </div>

      {/* ── Table card ── */}
      <div style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,overflow:"hidden" }}>

        {/* Toolbar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:12 }}>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:"var(--text-pri)" }}>Payment History</div>
            <div style={{ fontSize:11,color:"var(--text-muted)",marginTop:2 }}>
              {listQuery.isLoading ? "Loading…" : `${total} record${total!==1?"s":""}`}
            </div>
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            <div style={{ position:"relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }} />
              <input value={searchInput} onChange={handleSearch} placeholder="Search by roll no…"
                style={{ padding:"8px 12px 8px 34px",borderRadius:10,border:"1px solid var(--border)",background:"var(--input-bg)",color:"var(--text-pri)",fontSize:12,outline:"none",minWidth:200 }}
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
              {searchInput && (
                <button onClick={()=>{setSearchInput("");setF({student_roll_no:""})}} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex" }}>
                  <X size={12}/>
                </button>
              )}
            </div>

            <button onClick={()=>setShowFilters(p=>!p)} style={{ padding:"8px 14px",borderRadius:10,border:`1px solid ${showFilters?"var(--accent)":"var(--border)"}`,background:showFilters?"var(--accent-lo)":"transparent",color:showFilters?"var(--accent)":"var(--text-sec)",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
              <Filter size={13}/> Filters
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div style={{ padding:"16px 24px",borderBottom:"1px solid var(--border)",background:"var(--surface)",display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end" }}>
            {[
              { label:"Date",   name:"paymentDate", type:"date", value:filters.paymentDate },
            ].map(f=>(
              <div key={f.name}>
                <div style={{ fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5 }}>{f.label}</div>
                <input type={f.type} value={f.value} onChange={e=>setF({[f.name]:e.target.value} as any)}
                  style={{ padding:"8px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--input-bg)",color:"var(--text-pri)",fontSize:12,outline:"none" }}
                  onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
              </div>
            ))}
            {[
              { label:"Method", name:"paymentMethod", opts:[["","All Methods"],["Cash","Cash"],["Online","Online"],["Bank Transfer","Bank Transfer"],["Cheque","Cheque"]], val:filters.paymentMethod },
              { label:"Status", name:"paymentStatus", opts:[["","All Status"],["successful","Successful"],["pending","Pending"],["failed","Failed"]], val:filters.paymentStatus },
            ].map(f=>(
              <div key={f.name}>
                <div style={{ fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5 }}>{f.label}</div>
                <select value={f.val} onChange={e=>setF({[f.name]:e.target.value} as any)}
                  style={{ padding:"8px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--input-bg)",color:"var(--text-pri)",fontSize:12,outline:"none" }}>
                  {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <button onClick={()=>setF({paymentDate:"",paymentMethod:"",paymentStatus:""})}
              style={{ padding:"8px 16px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:"var(--text-sec)",fontSize:12,cursor:"pointer" }}>
              Clear
            </button>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 48px",gap:16,padding:"10px 24px",borderBottom:"1px solid var(--border)",background:"var(--surface)" }}>
          {["Student","Amount","Method","Status","Date",""].map((h,i)=>(
            <div key={h+i} style={{ fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",textAlign:i===5?"right":"left" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {listQuery.isLoading
            ? Array.from({length:6}).map((_,i)=><SkeletonRow key={i}/>)
            : payments.length === 0
            ? (
              <div style={{ textAlign:"center",padding:"60px 0",color:"var(--text-muted)" }}>
                <CreditCard size={36} style={{ marginBottom:12,opacity:.3 }} />
                <div style={{ fontSize:14,fontWeight:600 }}>No payments found</div>
                <div style={{ fontSize:12,marginTop:4 }}>Payments recorded via Fee Invoice will appear here</div>
              </div>
            )
            : payments.map((p,idx) => (
              <div key={p._id}
                style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 48px",gap:16,alignItems:"center",padding:"13px 24px",borderBottom:idx<payments.length-1?"1px solid var(--border)":"none",transition:"background .15s",animation:`fadeUp .25s ease ${idx*.025}s both` }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--card-hover)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              >
                {/* Student */}
                <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
                  <Avatar name={p.student?.student_name ?? "?"} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"var(--text-pri)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{p.student?.student_name ?? "—"}</div>
                    <div style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"'JetBrains Mono',monospace" }}>#{p.student?.student_roll_no ?? "—"}</div>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ fontSize:14,fontWeight:800,color:"var(--green)",fontFamily:"'DM Serif Display',serif" }}>
                  ₹{p.totalAmount?.toLocaleString("en-IN")}
                </div>

                {/* Method */}
                <div><MethodPill method={p.paymentMethod} /></div>

                {/* Status */}
                <div><StatusPill status={p.paymentStatus} /></div>

                {/* Date */}
                <div style={{ fontSize:12,color:"var(--text-muted)" }}>
                  {new Date(p.paymentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                </div>

                {/* Print */}
                <div style={{ display:"flex",justifyContent:"flex-end" }}>
                  <button onClick={()=>printReceipt(p)} title="Print receipt"
                    style={{ width:30,height:30,borderRadius:8,border:"none",background:"var(--accent-lo)",color:"var(--accent)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Printer size={13}/>
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontSize:12,color:"var(--text-muted)" }}>Page {filters.page} of {totalPages}</span>
          <div style={{ display:"flex",gap:8 }}>
            {[
              { label:"← Prev", disabled:filters.page<=1,          action:()=>setFiltersState(p=>({...p,page:p.page-1})) },
              { label:"Next →", disabled:filters.page>=totalPages,  action:()=>setFiltersState(p=>({...p,page:p.page+1})) },
            ].map(b=>(
              <button key={b.label} onClick={b.action} disabled={b.disabled||listQuery.isLoading}
                style={{ padding:"9px 20px",borderRadius:10,border:"1px solid var(--border)",background:b.disabled?"transparent":"var(--input-bg)",color:b.disabled?"var(--text-muted)":"var(--text-sec)",fontSize:12,fontWeight:600,cursor:b.disabled?"not-allowed":"pointer" }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {listQuery.error && (
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderRadius:12,background:"rgba(239,68,68,.1)",color:"var(--red)",fontSize:13,border:"1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15}/>{(listQuery.error as Error).message}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select option { background: var(--card); color: var(--text-pri); }
      `}</style>
    </div>
  )
}

export default Payments