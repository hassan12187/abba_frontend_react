"use client"

import React, { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import {
  AlertCircle, Eye, Pencil, Trash2, Search, X,
  Loader2, AlertTriangle, Filter, CheckCircle2,
  Clock, XCircle, Zap, Droplets, Sparkles,
  Armchair, Wifi, HelpCircle, ChevronDown, Plus,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom }   from "../../Store/Store"
import { useDebounce } from "../../components/hooks/useDebounce"
import {
  ComplaintAPI,
  COMPLAINT_PRIORITIES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  type Complaint,
  type ComplaintFilters,
  type ComplaintPriority,
  type ComplaintCategory,
  type ComplaintStatus,
  type UpdateStatusDTO,
  type UpdateComplaintDTO,
} from "./complaint.api"

// ─── Config maps ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ComplaintStatus, {
  label: string; color: string; bg: string; dot: string; border: string; icon: React.ReactNode
}> = {
  Pending:     { label: "Pending",     color: "var(--amber)",  bg: "rgba(245,158,11,.10)", dot: "var(--amber)",  border: "rgba(245,158,11,.25)", icon: <Clock        size={11}/> },
  "In Progress":{ label: "In Progress",color: "var(--accent)", bg: "var(--accent-lo)",     dot: "var(--accent)", border: "rgba(99,102,241,.25)", icon: <Loader2      size={11}/> },
  Resolved:    { label: "Resolved",    color: "var(--green)",  bg: "rgba(16,185,129,.10)", dot: "var(--green)",  border: "rgba(16,185,129,.25)", icon: <CheckCircle2 size={11}/> },
  Rejected:    { label: "Rejected",    color: "var(--red)",    bg: "rgba(239,68,68,.10)",  dot: "var(--red)",    border: "rgba(239,68,68,.25)",  icon: <XCircle      size={11}/> },
}

const PRIORITY_CFG: Record<ComplaintPriority, { color: string; bg: string; border: string }> = {
  high:   { color: "var(--red)",    bg: "rgba(239,68,68,.10)",  border: "rgba(239,68,68,.25)"  },
  medium: { color: "var(--amber)",  bg: "rgba(245,158,11,.10)", border: "rgba(245,158,11,.25)" },
  low:    { color: "var(--green)",  bg: "rgba(16,185,129,.10)", border: "rgba(16,185,129,.25)" },
}

const CATEGORY_ICON: Record<ComplaintCategory, React.ReactNode> = {
  electrical: <Zap       size={14}/>,
  plumbing:   <Droplets  size={14}/>,
  cleaning:   <Sparkles  size={14}/>,
  furniture:  <Armchair  size={14}/>,
  internet:   <Wifi      size={14}/>,
  other:      <HelpCircle size={14}/>,
}

const CATEGORY_COLOR: Record<ComplaintCategory, string> = {
  electrical: "#f59e0b",
  plumbing:   "#06b6d4",
  cleaning:   "var(--green)",
  furniture:  "#8b5cf6",
  internet:   "var(--accent)",
  other:      "var(--text-muted)",
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ComplaintStatus }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.Pending
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20,
      fontSize:11, fontWeight:700, letterSpacing:"0.04em",
      color:c.color, background:c.bg, border:`1px solid ${c.border}`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot, flexShrink:0 }} />
      {c.label}
    </span>
  )
}

function PriorityPill({ priority }: { priority: ComplaintPriority }) {
  const c = PRIORITY_CFG[priority] ?? PRIORITY_CFG.medium
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      padding:"2px 8px", borderRadius:20,
      fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em",
      color:c.color, background:c.bg, border:`1px solid ${c.border}`,
    }}>
      {priority}
    </span>
  )
}

function CategoryBadge({ category }: { category: ComplaintCategory }) {
  const color = CATEGORY_COLOR[category] ?? "var(--text-muted)"
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:12, fontWeight:500, color:"var(--text-sec)",
    }}>
      <span style={{ color }}>{CATEGORY_ICON[category]}</span>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, colorVar, isLoading }: {
  icon:React.ReactNode; label:string; value:number|string; colorVar:string; isLoading:boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:"18px 20px",
        display:"flex", alignItems:"center", gap:14, transition:"transform .2s, box-shadow .2s",
        transform:hov?"translateY(-2px)":"none", boxShadow:hov?"var(--stat-shadow)":"none" }}>
      <div style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:`color-mix(in srgb, ${colorVar} 12%, transparent)`, color:colorVar, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:800, color:"var(--text-pri)", lineHeight:1, fontFamily:"'DM Serif Display',serif" }}>
          {isLoading ? <span style={{ display:"inline-block", width:48, height:18, borderRadius:6, background:"var(--border)", animation:"shimmer 1.4s ease-in-out infinite" }} /> : value}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr 80px",
      gap:16, alignItems:"center", padding:"14px 24px", borderBottom:"1px solid var(--border)",
      animation:"shimmer 1.4s ease-in-out infinite" }}>
      <div style={{ width:70, height:12, borderRadius:6, background:"var(--border)" }} />
      <div>
        <div style={{ width:160, height:12, borderRadius:6, background:"var(--border)", marginBottom:6 }} />
        <div style={{ width:100, height:10, borderRadius:6, background:"var(--border)", opacity:.6 }} />
      </div>
      {[80,80,80].map((w,i)=><div key={i} style={{ width:w, height:12, borderRadius:6, background:"var(--border)" }} />)}
      <div style={{ display:"flex", gap:6 }}>
        {[28,28,28].map((_,i)=><div key={i} style={{ width:28, height:28, borderRadius:8, background:"var(--border)" }} />)}
      </div>
    </div>
  )
}

// ─── Status transition dropdown (inline) ──────────────────────────────────────
// Allowed transitions matching the backend guard
const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  Pending:      ["In Progress", "Rejected"],
  "In Progress":["Resolved",   "Rejected", "Pending"],
  Resolved:     [],
  Rejected:     ["Pending"],
}

function StatusDropdown({ complaint, token, onDone }: {
  complaint: Complaint; token: string; onDone: () => void
}) {
  const [open,  setOpen]  = useState(false)
  const [pos,   setPos]   = useState({ top:0, left:0 })
  const [note,  setNote]  = useState("")
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const qc = useQueryClient()

  const allowed = TRANSITIONS[complaint.status] ?? []

  const mutation = useMutation({
    mutationFn: (dto: UpdateStatusDTO) =>
      ComplaintAPI.updateStatus(complaint._id, dto, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] })
      setOpen(false); setNote(""); onDone()
    },
  })

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 200) })
    }
    setOpen(p => !p)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-status-menu]")) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])

  if (!allowed.length) return <StatusPill status={complaint.status} />

  return (
    <>
      <button ref={btnRef} onClick={handleToggle} data-status-menu
        style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"inline-flex", alignItems:"center", gap:4 }}>
        <StatusPill status={complaint.status} />
        <ChevronDown size={11} color="var(--text-muted)" style={{ transform:open?"rotate(180deg)":"none", transition:"transform .2s" }} />
      </button>

      {open && (
        <div data-status-menu style={{
          position:"fixed", top:`-150px`, left:`auto`,
          background:"var(--card)", border:"1px solid var(--border)",
          borderRadius:14, padding:10, zIndex:9999, minWidth:200,
          boxShadow:"var(--shadow)", animation:"fadeUp .15s ease",
        }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, paddingLeft:4 }}>
            Change status
          </div>
          {allowed.map(s => {
            const c = STATUS_CFG[s]
            return (
              <button key={s}
                onClick={() => mutation.mutate({ status:s, note: note || undefined })}
                disabled={mutation.isPending}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", transition:"background .1s", fontSize:12, fontWeight:500, color:"var(--text-sec)" }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--card-hover)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              >
                {mutation.isPending ? <Loader2 size={12} style={{animation:"spin .8s linear infinite"}} /> : <span style={{ width:8, height:8, borderRadius:"50%", background:c.dot, flexShrink:0 }} />}
                {c.label}
              </button>
            )
          })}
          <div style={{ borderTop:"1px solid var(--border)", marginTop:6, paddingTop:6 }}>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note (optional)…"
              style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text-pri)", fontSize:11, outline:"none" }}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
          </div>
          {mutation.error && (
            <div style={{ fontSize:11, color:"var(--red)", padding:"6px 4px 2px", display:"flex", alignItems:"center", gap:4 }}>
              <AlertTriangle size={11}/>{(mutation.error as Error).message}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Detail / Edit side panel ─────────────────────────────────────────────────
function SidePanel({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000 }} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{ position:"absolute", inset:0, background:"var(--overlay)", backdropFilter:"blur(6px)" }} onClick={onClose} />
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"100%", maxWidth:500,
        background:"var(--surface)", borderLeft:"1px solid var(--border)",
        boxShadow:"var(--shadow)", display:"flex", flexDirection:"column", animation:"slideIn .25s ease" }}>
        <div style={{ padding:"22px 24px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text-pri)", fontFamily:"'DM Serif Display',serif" }}>{title}</div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--text-sec)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Complaint detail view ────────────────────────────────────────────────────
function DetailView({ complaint, token }: { complaint: Complaint; token: string }) {
  const inputStyle: React.CSSProperties = { fontSize:13, color:"var(--text-pri)", fontWeight:500 }
  const labelStyle: React.CSSProperties = { fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }
  const tileStyle:  React.CSSProperties = { padding:"12px 14px", background:"var(--card)", borderRadius:12, border:"1px solid var(--border)" }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header info */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={tileStyle}><div style={labelStyle}>Room</div><div style={inputStyle}>{complaint.room_id?.room_no ?? "—"}</div></div>
        <div style={tileStyle}><div style={labelStyle}>Category</div><div><CategoryBadge category={complaint.category}/></div></div>
        <div style={tileStyle}><div style={labelStyle}>Priority</div><div><PriorityPill priority={complaint.priority}/></div></div>
        <div style={tileStyle}><div style={labelStyle}>Status</div><div><StatusPill status={complaint.status}/></div></div>
        <div style={tileStyle}><div style={labelStyle}>Student</div><div style={inputStyle}>{complaint.student_id?.student_name ?? "—"}</div></div>
        <div style={tileStyle}><div style={labelStyle}>Roll No.</div><div style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace" }}>#{complaint.student_id?.student_roll_no ?? "—"}</div></div>
        <div style={{ ...tileStyle, gridColumn:"1/-1" }}><div style={labelStyle}>Submitted</div><div style={inputStyle}>{new Date(complaint.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div></div>
        {complaint.resolution_time_hours != null && (
          <div style={{ ...tileStyle, gridColumn:"1/-1" }}><div style={labelStyle}>Resolution Time</div><div style={{ ...inputStyle, color:"var(--green)" }}>{complaint.resolution_time_hours}h</div></div>
        )}
      </div>

      {/* Description */}
      <div>
        <div style={labelStyle}>Title</div>
        <div style={{ fontSize:15, fontWeight:700, color:"var(--text-pri)", marginBottom:8 }}>{complaint.title}</div>
        <div style={labelStyle}>Description</div>
        <div style={{ fontSize:13, color:"var(--text-sec)", lineHeight:1.7, background:"var(--card)", padding:"12px 14px", borderRadius:12, border:"1px solid var(--border)" }}>
          {complaint.description}
        </div>
      </div>

      {/* Admin comments */}
      {complaint.admin_comments && (
        <div>
          <div style={labelStyle}>Admin Comments</div>
          <div style={{ fontSize:13, color:"var(--text-sec)", lineHeight:1.7, background:"var(--accent-lo)", padding:"12px 14px", borderRadius:12, border:"1px solid var(--border-hover)" }}>
            {complaint.admin_comments}
          </div>
        </div>
      )}

      {/* Status history */}
      {complaint.status_history?.length > 0 && (
        <div>
          <div style={labelStyle}>Status History</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[...complaint.status_history].reverse().map((h, i) => {
              const c = STATUS_CFG[h.status]
              return (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", background:"var(--card)", borderRadius:12, border:"1px solid var(--border)" }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:c.dot, marginTop:4, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:c.color }}>{h.status}</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{new Date(h.changed_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                    </div>
                    {h.note && <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{h.note}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit form ────────────────────────────────────────────────────────────────
function EditForm({ complaint, token, onDone, onCancel }: {
  complaint: Complaint; token: string; onDone:()=>void; onCancel:()=>void
}) {
  const [form, setForm] = useState<UpdateComplaintDTO>({
    title:          complaint.title,
    description:    complaint.description,
    priority:       complaint.priority,
    category:       complaint.category,
    admin_comments: complaint.admin_comments ?? "",
  })
  const [err, setErr] = useState<string|null>(null)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (dto: UpdateComplaintDTO) => ComplaintAPI.update(complaint._id, dto, token),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:["complaints"] }); onDone() },
    onError:    (e:Error) => setErr(e.message),
  })

  const inputStyle: React.CSSProperties = { width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text-pri)", fontSize:13, outline:"none" }
  const labelStyle: React.CSSProperties = { fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:5 }

  return (
    <form onSubmit={e=>{e.preventDefault();mutation.mutate(form)}} style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input value={form.title??""} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required
          style={inputStyle} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
      </div>
      <div>
        <label style={labelStyle}>Description *</label>
        <textarea value={form.description??""} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required rows={4}
          style={{ ...inputStyle, resize:"vertical" }} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={labelStyle}>Priority</label>
          <select value={form.priority??""} onChange={e=>setForm(p=>({...p,priority:e.target.value as ComplaintPriority}))} style={inputStyle}>
            {COMPLAINT_PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select value={form.category??""} onChange={e=>setForm(p=>({...p,category:e.target.value as ComplaintCategory}))} style={inputStyle}>
            {COMPLAINT_CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Admin Comments</label>
        <textarea value={form.admin_comments??""} onChange={e=>setForm(p=>({...p,admin_comments:e.target.value}))} rows={3} placeholder="Internal notes…"
          style={{ ...inputStyle, resize:"vertical" }} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
      </div>
      {err && <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,.12)", color:"var(--red)", fontSize:12 }}><AlertTriangle size={13}/>{err}</div>}
      <div style={{ display:"flex", gap:10 }}>
        <button type="button" onClick={onCancel} disabled={mutation.isPending}
          style={{ flex:1, padding:10, borderRadius:12, border:"1px solid var(--border)", background:"transparent", color:"var(--text-sec)", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>
        <button type="submit" disabled={mutation.isPending}
          style={{ flex:1, padding:10, borderRadius:12, border:"none", background:mutation.isPending?"var(--border)":"var(--accent)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {mutation.isPending ? <><Loader2 size={13} style={{animation:"spin .8s linear infinite"}}/>Saving…</> : <><CheckCircle2 size={13}/>Save Changes</>}
        </button>
      </div>
    </form>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ complaint, token, onDone, onCancel }: {
  complaint:Complaint; token:string; onDone:()=>void; onCancel:()=>void
}) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => ComplaintAPI.delete(complaint._id, token),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:["complaints"] }); onDone() },
  })
  return (
    <div>
      <div style={{ fontSize:13, color:"var(--text-sec)", lineHeight:1.6, marginBottom:16 }}>
        Permanently delete <strong style={{ color:"var(--text-pri)" }}>"{complaint.title}"</strong>? This cannot be undone.
      </div>
      {mutation.error && <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,.12)", color:"var(--red)", fontSize:12, marginBottom:14 }}><AlertTriangle size={13}/>{(mutation.error as Error).message}</div>}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onCancel} disabled={mutation.isPending}
          style={{ flex:1, padding:10, borderRadius:12, border:"1px solid var(--border)", background:"transparent", color:"var(--text-sec)", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>
        <button onClick={()=>mutation.mutate()} disabled={mutation.isPending}
          style={{ flex:1, padding:10, borderRadius:12, border:"none", background:mutation.isPending?"var(--border)":"var(--red)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {mutation.isPending ? <><Loader2 size={13} style={{animation:"spin .8s linear infinite"}}/>Deleting…</> : <><Trash2 size={13}/>Delete</>}
        </button>
      </div>
    </div>
  )
}

// React.useEffect import for StatusDropdown
const { useEffect } = React

// ─── Main ─────────────────────────────────────────────────────────────────────
const Complaints: React.FC = () => {
  const { token } = useCustom() as { token: string }
  const [searchInput, setSearchInput]  = useState("")
  const [showFilters, setShowFilters]  = useState(false)
  const [filters, setFiltersState]     = useState<ComplaintFilters>({ page:1, limit:15, sortBy:"createdAt", sortOrder:"desc" })
  const [panel, setPanel] = useState<
    | { mode:"view";   complaint: Complaint }
    | { mode:"edit";   complaint: Complaint }
    | { mode:"delete"; complaint: Complaint }
    | null
  >(null)

  const setF = useCallback((partial: Partial<ComplaintFilters>) =>
    setFiltersState(p=>({...p,...partial,page:1})), [])

  const applySearch = useDebounce((v:string) => setF({ search:v }), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); applySearch(e.target.value)
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey:  ["complaints", "list", filters],
    queryFn:   () => ComplaintAPI.getAll(filters, token),
    staleTime: 60_000, enabled: !!token,
    placeholderData: (prev) => prev,
  })

  const statsQuery = useQuery({
    queryKey:  ["complaints", "stats"],
    queryFn:   () => ComplaintAPI.getStats(token),
    staleTime: 5 * 60_000, enabled: !!token,
  })

  const complaints = listQuery.data?.data       ?? []
  const total      = listQuery.data?.total      ?? 0
  const totalPages = listQuery.data?.totalPages ?? 1
  const stats      = statsQuery.data?.data

  const fmtDate = (d:string) => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"var(--text-pri)", display:"flex", flexDirection:"column", gap:24 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--amber)", boxShadow:"0 0 8px var(--amber)" }} />
            <span style={{ fontSize:10, fontWeight:700, color:"var(--amber)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Hostel Management</span>
          </div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:"var(--text-pri)", lineHeight:1.1, fontFamily:"'DM Serif Display',serif" }}>Complaints</h1>
          <p style={{ margin:"5px 0 0", fontSize:13, color:"var(--text-sec)" }}>Track, assign, and resolve student complaints</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14 }}>
        <StatCard icon={<Clock        size={18}/>} label="Pending"      value={stats?.byStatus?.Pending      ?? 0} colorVar="var(--amber)"  isLoading={statsQuery.isLoading} />
        <StatCard icon={<Loader2      size={18}/>} label="In Progress"  value={stats?.byStatus?.["In Progress"] ?? 0} colorVar="var(--accent)" isLoading={statsQuery.isLoading} />
        <StatCard icon={<CheckCircle2 size={18}/>} label="Resolved"     value={stats?.byStatus?.Resolved     ?? 0} colorVar="var(--green)"  isLoading={statsQuery.isLoading} />
        <StatCard icon={<AlertCircle  size={18}/>} label="High Priority" value={stats?.pendingHighPriority   ?? 0} colorVar="var(--red)"    isLoading={statsQuery.isLoading} />
      </div>

      {/* Table card */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:20, overflow:"hidden" }}>

        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:"1px solid var(--border)", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-pri)" }}>All Complaints</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
              {listQuery.isLoading ? "Loading…" : `${total} record${total!==1?"s":""}`}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {/* Search */}
            <div style={{ position:"relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
              <input value={searchInput} onChange={handleSearch} placeholder="Search title…"
                style={{ padding:"8px 12px 8px 34px", borderRadius:10, border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text-pri)", fontSize:12, outline:"none", minWidth:200 }}
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
              {searchInput && <button onClick={()=>{setSearchInput("");setF({search:undefined})}} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex" }}><X size={12}/></button>}
            </div>

            {/* Status pills */}
            <div style={{ display:"flex", gap:4, background:"var(--input-bg)", padding:3, borderRadius:10, border:"1px solid var(--border)" }}>
              <button onClick={()=>setF({status:"All"})}
                style={{ padding:"5px 10px", borderRadius:8, border:"none", background:(!filters.status||filters.status==="All")?"var(--accent)":"transparent", color:(!filters.status||filters.status==="All")?"#fff":"var(--text-muted)", fontSize:11, fontWeight:(!filters.status||filters.status==="All")?700:500, cursor:"pointer", transition:"all .15s" }}>All</button>
              {COMPLAINT_STATUSES.map(s => {
                const active = filters.status === s
                const c = STATUS_CFG[s]
                return (
                  <button key={s} onClick={()=>setF({status:active?undefined:s})}
                    style={{ padding:"5px 10px", borderRadius:8, border:"none", background:active?c.bg:"transparent", color:active?c.color:"var(--text-muted)", fontSize:11, fontWeight:active?700:500, cursor:"pointer", transition:"all .15s" }}>
                    {s}
                  </button>
                )
              })}
            </div>

            <button onClick={()=>setShowFilters(p=>!p)}
              style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${showFilters?"var(--accent)":"var(--border)"}`, background:showFilters?"var(--accent-lo)":"transparent", color:showFilters?"var(--accent)":"var(--text-sec)", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Filter size={13}/> More
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div style={{ padding:"14px 24px", borderBottom:"1px solid var(--border)", background:"var(--surface)", display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
            {[{ label:"Priority", name:"priority", opts:[["","All Priority"],["high","High"],["medium","Medium"],["low","Low"]], val:filters.priority??"" },
              { label:"Category", name:"category", opts:[["","All Category"],...COMPLAINT_CATEGORIES.map(c=>[c,c.charAt(0).toUpperCase()+c.slice(1)])], val:filters.category??"" },
              { label:"Sort By",  name:"sortBy",   opts:[["createdAt","Date"],["priority","Priority"],["updatedAt","Updated"]], val:filters.sortBy??"createdAt" },
            ].map(f=>(
              <div key={f.name}>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{f.label}</div>
                <select value={f.val} onChange={e=>setF({[f.name]:e.target.value||undefined} as any)}
                  style={{ padding:"8px 12px", borderRadius:10, border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text-pri)", fontSize:12, outline:"none" }}>
                  {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            {[{ label:"From", key:"from" },{ label:"To", key:"to" }].map(f=>(
              <div key={f.key}>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{f.label}</div>
                <input type="date" value={(filters as any)[f.key]??""} onChange={e=>setF({[f.key]:e.target.value||undefined} as any)}
                  style={{ padding:"8px 12px", borderRadius:10, border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text-pri)", fontSize:12, outline:"none" }}
                  onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
              </div>
            ))}
            <button onClick={()=>{setF({priority:undefined,category:undefined,from:undefined,to:undefined,sortBy:"createdAt"});setShowFilters(false)}}
              style={{ padding:"8px 14px", borderRadius:10, border:"1px solid var(--border)", background:"transparent", color:"var(--text-sec)", fontSize:12, cursor:"pointer" }}>Clear</button>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr 80px", gap:16, padding:"10px 24px", borderBottom:"1px solid var(--border)", background:"var(--surface)" }}>
          {["Room","Title","Category","Priority","Status",""].map((h,i)=>(
            <div key={h+i} style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", textAlign:i===5?"right":"left" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {listQuery.isLoading
            ? Array.from({length:6}).map((_,i)=><SkeletonRow key={i}/>)
            : complaints.length === 0
            ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-muted)" }}>
                <AlertCircle size={36} style={{ marginBottom:12, opacity:.3 }} />
                <div style={{ fontSize:14, fontWeight:600 }}>No complaints found</div>
                <div style={{ fontSize:12, marginTop:4 }}>Adjust your filters or search</div>
              </div>
            )
            : complaints.map((c, idx) => (
              <div key={c._id}
                style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr 1fr 1fr 80px", gap:16, alignItems:"center", padding:"13px 24px",
                  borderBottom:idx<complaints.length-1?"1px solid var(--border)":"none",
                  transition:"background .15s", animation:`fadeUp .25s ease ${idx*.025}s both` }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--card-hover)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              >
                {/* Room */}
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text-pri)", fontFamily:"'JetBrains Mono',monospace" }}>
                  {c.room_id?.room_no ?? "—"}
                </div>

                {/* Title + date */}
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-pri)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.title}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{fmtDate(c.createdAt)}</div>
                </div>

                {/* Category */}
                <div><CategoryBadge category={c.category}/></div>

                {/* Priority */}
                <div><PriorityPill priority={c.priority}/></div>

                {/* Status — inline change dropdown */}
                <div><StatusDropdown complaint={c} token={token} onDone={()=>{}}/></div>

                {/* Actions */}
                <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }}>
                  <button onClick={()=>setPanel({mode:"view",complaint:c})} title="View details"
                    style={{ width:28, height:28, borderRadius:8, border:"none", background:"var(--accent-lo)", color:"var(--accent)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Eye size={13}/>
                  </button>
                  <button onClick={()=>setPanel({mode:"edit",complaint:c})} title="Edit"
                    style={{ width:28, height:28, borderRadius:8, border:"none", background:"rgba(245,158,11,.10)", color:"var(--amber)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Pencil size={13}/>
                  </button>
                  <button onClick={()=>setPanel({mode:"delete",complaint:c})} title="Delete"
                    style={{ width:28, height:28, borderRadius:8, border:"none", background:"rgba(239,68,68,.10)", color:"var(--red)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>Page {filters.page??1} of {totalPages}</span>
          <div style={{ display:"flex", gap:8 }}>
            {[
              { label:"← Prev", disabled:(filters.page??1)<=1,         action:()=>setFiltersState(p=>({...p,page:(p.page??1)-1})) },
              { label:"Next →", disabled:(filters.page??1)>=totalPages, action:()=>setFiltersState(p=>({...p,page:(p.page??1)+1})) },
            ].map(b=>(
              <button key={b.label} onClick={b.action} disabled={b.disabled||listQuery.isLoading}
                style={{ padding:"9px 20px", borderRadius:10, border:"1px solid var(--border)", background:b.disabled?"transparent":"var(--input-bg)", color:b.disabled?"var(--text-muted)":"var(--text-sec)", fontSize:12, fontWeight:600, cursor:b.disabled?"not-allowed":"pointer" }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {listQuery.error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", borderRadius:12, background:"rgba(239,68,68,.1)", color:"var(--red)", fontSize:13, border:"1px solid rgba(239,68,68,.2)" }}>
          <AlertTriangle size={15}/>{(listQuery.error as Error).message}
        </div>
      )}

      {/* Side panels */}
      {panel?.mode==="view" && (
        <SidePanel title="Complaint Details" onClose={()=>setPanel(null)}>
          <DetailView complaint={panel.complaint} token={token}/>
        </SidePanel>
      )}
      {panel?.mode==="edit" && (
        <SidePanel title="Edit Complaint" onClose={()=>setPanel(null)}>
          <EditForm complaint={panel.complaint} token={token} onDone={()=>setPanel(null)} onCancel={()=>setPanel(null)}/>
        </SidePanel>
      )}
      {panel?.mode==="delete" && (
        <SidePanel title="Delete Complaint" onClose={()=>setPanel(null)}>
          <DeleteConfirm complaint={panel.complaint} token={token} onDone={()=>setPanel(null)} onCancel={()=>setPanel(null)}/>
        </SidePanel>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shimmer  { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        select option { background:var(--card); color:var(--text-pri); }
      `}</style>
    </div>
  )
}

export default Complaints