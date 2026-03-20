"use client"

import React, { useState, useCallback, type ChangeEvent } from "react"
import {
  BedDouble, Plus, Eye, Pencil, Trash2, Loader2,
  AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2,
  Wrench, Users, X, Search, Filter,
} from "lucide-react"
import { useDebounce } from "../../components/hooks/useDebounce"
import { useCustom }   from "../../Store/Store"
import {
  useRooms, useRoomDetail, useBlockList, useUpdateRoom, useUpdateRoomStatus,
} from "./hostel.queries"
import type {
  Room, RoomStatus, RoomType,
  CreateRoomPayload, UpdateRoomPayload, BlockFilters,
} from "./hostel.api"

// ─── Status config using CSS variables ────────────────────────────────────────
// Colors stay semantic across themes — only the opacity shifts.
const STATUS_CFG: Record<RoomStatus, { label: string; color: string; bg: string; dot: string }> = {
  available:   { label: "Available",   color: "var(--green)",  bg: "rgba(16,185,129,.12)",  dot: "var(--green)"  },
  occupied:    { label: "Occupied",    color: "var(--accent)", bg: "var(--accent-lo)",       dot: "var(--accent)" },
  maintenance: { label: "Maintenance", color: "var(--amber)",  bg: "rgba(245,158,11,.12)",  dot: "var(--amber)"  },
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: RoomStatus }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.available
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"3px 10px", borderRadius:20,
      fontSize:11, fontWeight:600, letterSpacing:"0.04em",
      color: c.color, background: c.bg,
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, flexShrink:0 }} />
      {c.label}
    </span>
  )
}

// ─── OccupancyRing — SVG accepts CSS variables as stroke ──────────────────────
function OccupancyRing({ room }: { room: Room }) {
  const used  = room.capacity - (room.available_beds ?? room.capacity)
  const pct   = room.capacity > 0 ? Math.round((used / room.capacity) * 100) : 0
  const r = 22, circ = 2 * Math.PI * r

  // Keep semantic color names; these work identically in light + dark
  const color = pct === 0
    ? "var(--text-muted)"
    : pct < 60  ? "var(--green)"
    : pct < 85  ? "var(--amber)"
    : "var(--red)"

  return (
    <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
      <svg width={56} height={56} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          style={{ transition:"stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div style={{
        position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        color, fontSize:11, fontWeight:700, lineHeight:1.1,
        fontFamily:"'JetBrains Mono',monospace",
      }}>
        {pct}%
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Accepts a colorKey ("accent" | "green" | "amber" | "red") so we can build
// var(--accent) / var(--accent-lo) pairs without needing hex alpha strings.
type ColorKey = "accent" | "green" | "amber" | "red"

const COLOR_ALPHA: Record<ColorKey, string> = {
  accent: "var(--accent-lo)",
  green:  "rgba(16,185,129,.12)",
  amber:  "rgba(245,158,11,.12)",
  red:    "rgba(239,68,68,.12)",
}

function StatCard({ icon, label, value, colorKey, isLoading }: {
  icon: React.ReactNode; label: string; value: string | number
  colorKey: ColorKey; isLoading: boolean
}) {
  const colorVar = `var(--${colorKey})`
  const bgVar    = COLOR_ALPHA[colorKey]

  return (
    <div
      style={{
        background:    "var(--card)",
        border:        "1px solid var(--border)",
        borderRadius:  16, padding:"22px 24px",
        display:"flex", alignItems:"center", gap:18,
        transition:"transform .2s, box-shadow .2s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform  = "translateY(-2px)"
        el.style.boxShadow  = "var(--stat-shadow)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform  = "translateY(0)"
        el.style.boxShadow  = "none"
      }}
    >
      <div style={{
        width:48, height:48, borderRadius:14,
        display:"flex", alignItems:"center", justifyContent:"center",
        background: bgVar, color: colorVar, flexShrink:0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:12, color:"var(--text-sec)", fontWeight:500, marginBottom:4 }}>{label}</div>
        <div style={{
          fontSize:28, fontWeight:800, color:"var(--text-pri)", lineHeight:1,
          fontFamily:"'DM Serif Display',serif",
        }}>
          {isLoading
            ? <span style={{ display:"inline-block", width:48, height:24, borderRadius:6, background:"var(--border)", animation:"shimmer 1.4s ease-in-out infinite" }} />
            : value
          }
        </div>
      </div>
    </div>
  )
}

// ─── RoomCard ─────────────────────────────────────────────────────────────────
function RoomCard({ room, onView, onDelete }: { room: Room; onView:()=>void; onDelete:()=>void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background:    hovered ? "var(--card-hover)" : "var(--card)",
        border:        `1px solid ${hovered ? "var(--border-hover)" : "var(--border)"}`,
        borderRadius:  16, padding:20, cursor:"pointer",
        transition:    "all .2s", position:"relative", overflow:"hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onView}
    >
      {/* Status accent line */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:2,
        background: STATUS_CFG[room.status]?.dot ?? "var(--accent)",
        opacity: hovered ? 1 : 0.4, transition:"opacity .2s",
      }} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:"var(--text-pri)", letterSpacing:"-0.02em" }}>
            {room.room_no}
          </div>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{room.type}</div>
        </div>
        <StatusPill status={room.status} />
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>Block</div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-sec)" }}>
            {(room.block_id as any)?.block_no ?? "—"}
          </div>
        </div>
        <OccupancyRing room={room} />
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>Monthly</div>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--amber)" }}>
            ₹{room.fees?.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div
        style={{ display:"flex", gap:8, marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onView} style={{
          flex:1, padding:"8px 0", borderRadius:10,
          border:"1px solid var(--border)", background:"var(--accent-lo)",
          color:"var(--accent)", fontSize:12, fontWeight:600, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>
          <Eye size={13} /> Details
        </button>
        <button onClick={onDelete} style={{
          padding:"8px 12px", borderRadius:10,
          border:"1px solid rgba(239,68,68,.2)", background:"rgba(239,68,68,.08)",
          color:"var(--red)", fontSize:12, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── RoomForm ─────────────────────────────────────────────────────────────────
function RoomForm({ initialValues, onSubmit, isLoading, error, submitLabel, onCancel, token }: {
  initialValues?: Partial<CreateRoomPayload>
  onSubmit: (d: CreateRoomPayload) => Promise<void>
  isLoading: boolean; error: string | null
  submitLabel: string; onCancel?: () => void; token: string
}) {
  const [form, setForm] = useState<CreateRoomPayload>({
    room_no:  initialValues?.room_no  ?? "",
    fees:     initialValues?.fees     ?? 0,
    capacity: initialValues?.capacity ?? 4,
    block_id: initialValues?.block_id ?? "",
    type:     initialValues?.type     ?? "Single Seater",
    status:   initialValues?.status   ?? "available",
  })

  const bf: BlockFilters = { page:1, limit:100, sortBy:"block_no", sortOrder:"asc" }
  const { data: bd } = useBlockList(bf, token)
  const blocks = bd?.data ?? []

  const set = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: name==="fees"||name==="capacity" ? Number(value) : value }))
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"10px 14px", borderRadius:10,
    border:"1px solid var(--border)", background:"var(--input-bg)",
    color:"var(--text-pri)", fontSize:13, outline:"none", transition:"border-color .2s",
  }
  const labelStyle: React.CSSProperties = {
    fontSize:11, fontWeight:600, color:"var(--text-sec)",
    marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:"0.06em",
  }

  return (
    <form onSubmit={async e => { e.preventDefault(); await onSubmit(form) }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:16 }}>
        {[
          { label:"Room Number",       name:"room_no",  type:"text",   value:form.room_no,  required:true  },
          { label:"Capacity",          name:"capacity", type:"number", value:form.capacity, required:false },
          { label:"Monthly Fees (₹)", name:"fees",     type:"number", value:form.fees,     required:true  },
        ].map(f => (
          <div key={f.name}>
            <label style={labelStyle}>{f.label}{f.required && <span style={{color:"var(--red)"}}>*</span>}</label>
            <input type={f.type} name={f.name} value={f.value} onChange={set}
              required={f.required} disabled={isLoading} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        ))}

        <div>
          <label style={labelStyle}>Block<span style={{color:"var(--red)"}}>*</span></label>
          <select name="block_id" value={form.block_id} onChange={set} required disabled={isLoading} style={inputStyle}>
            <option value="">Select Block…</option>
            {blocks.map(b => <option key={b._id} value={b._id}>Block {b.block_no}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Room Type</label>
          <select name="type" value={form.type} onChange={set} disabled={isLoading} style={inputStyle}>
            <option>Single Seater</option>
            <option>Double Seater</option>
            <option>Triple Seater</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" value={form.status} onChange={set} disabled={isLoading} style={inputStyle}>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,.12)", color:"var(--red)", fontSize:12, marginBottom:16 }}>
          <AlertTriangle size={13} />{error}
        </div>
      )}

      <div style={{ display:"flex", gap:10 }}>
        <button type="submit" disabled={isLoading} style={{
          padding:"10px 24px", borderRadius:10, border:"none",
          background: isLoading ? "rgba(99,102,241,.4)" : "var(--accent)",
          color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
          display:"flex", alignItems:"center", gap:8,
        }}>
          {isLoading ? <><Loader2 size={14} style={{animation:"spin .8s linear infinite"}} />Saving…</> : <><Plus size={14} />{submitLabel}</>}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isLoading} style={{
            padding:"10px 20px", borderRadius:10,
            border:"1px solid var(--border)", background:"transparent",
            color:"var(--text-sec)", fontSize:13, cursor:"pointer",
          }}>Cancel</button>
        )}
      </div>
    </form>
  )
}

// ─── RoomModal ────────────────────────────────────────────────────────────────
function RoomModal({ roomId, token, onClose }: { roomId:string; token:string; onClose:()=>void }) {
  const [mode, setMode]         = useState<"view"|"edit">("view")
  const { data:room, isLoading, error } = useRoomDetail(roomId, token)
  const updateRoom   = useUpdateRoom(token)
  const updateStatus = useUpdateRoomStatus(token)

  const handleUpdate = async (p: UpdateRoomPayload) => {
    await updateRoom.mutateAsync({ id:roomId, payload:p })
    setMode("view")
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"var(--overlay)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={e => { if(e.target===e.currentTarget) onClose() }}>
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:24, width:"100%", maxWidth:680,
        maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow:"var(--shadow)",
      }}>
        {/* Header */}
        <div style={{
          padding:"24px 28px 20px", borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--accent-lo)", color:"var(--accent)" }}>
              <BedDouble size={22} />
            </div>
            <div>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, fontWeight:700, color:"var(--text-pri)" }}>
                {isLoading ? "Loading…" : `Room ${room?.room_no}`}
              </div>
              {room && (
                <div style={{ fontSize:12, color:"var(--text-sec)", marginTop:2 }}>
                  Block {(room.block_id as any)?.block_no} · {room.type}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {!isLoading && room && mode==="view" && (
              <button onClick={() => setMode("edit")} style={{
                padding:"8px 16px", borderRadius:10, border:"1px solid var(--border)",
                background:"transparent", color:"var(--text-sec)", fontSize:12, fontWeight:600,
                cursor:"pointer", display:"flex", alignItems:"center", gap:6,
              }}>
                <Pencil size={13} /> Edit
              </button>
            )}
            <button onClick={onClose} style={{
              width:36, height:36, borderRadius:10, border:"1px solid var(--border)",
              background:"transparent", color:"var(--text-sec)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto", padding:"24px 28px", flex:1 }}>
          {isLoading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
              <Loader2 size={28} color="var(--accent)" style={{animation:"spin .8s linear infinite"}} />
            </div>
          ) : error || !room ? (
            <div style={{ padding:"14px", borderRadius:12, background:"rgba(239,68,68,.12)", color:"var(--red)", fontSize:13 }}>
              {(error as Error)?.message ?? "Failed to load room."}
            </div>
          ) : mode==="edit" ? (
            <RoomForm
              initialValues={{ room_no:room.room_no, fees:room.fees, capacity:room.capacity, block_id:(room.block_id as any)?._id ?? room.block_id, type:room.type }}
              onSubmit={handleUpdate} isLoading={updateRoom.isPending}
              error={updateRoom.error?.message ?? null}
              submitLabel="Save Changes" onCancel={() => setMode("view")} token={token}
            />
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              {/* Left */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>Room Details</div>

                <div style={{ display:"flex", alignItems:"center", gap:20, padding:20, background:"var(--card)", borderRadius:16, border:"1px solid var(--border)", marginBottom:16 }}>
                  <OccupancyRing room={room} />
                  <div>
                    <div style={{ fontSize:13, color:"var(--text-sec)", marginBottom:4 }}>
                      <span style={{ color:"var(--text-pri)", fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                        {(room.capacity - (room.available_beds ?? 0)) || 0}
                      </span>{" of "}
                      <span style={{ color:"var(--text-pri)", fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                        {room.capacity}
                      </span>{" beds occupied"}
                    </div>
                    <StatusPill status={room.status} />
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { label:"Block",       value:`Block ${(room.block_id as any)?.block_no ?? "—"}` },
                    { label:"Type",        value:room.type },
                    { label:"Capacity",    value:`${room.capacity} beds` },
                    { label:"Available",   value:`${room.available_beds ?? 0} beds` },
                    { label:"Monthly Fee", value:`₹${room.fees?.toLocaleString("en-IN")}`, accent:true },
                  ].map(f => (
                    <div key={f.label} style={{ padding:"12px 14px", background:"var(--card)", borderRadius:12, border:"1px solid var(--border)" }}>
                      <div style={{ fontSize:10, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{f.label}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:(f as any).accent ? "var(--amber)" : "var(--text-pri)" }}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Change Status</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {(["available","occupied","maintenance"] as RoomStatus[]).map(s => {
                      const c      = STATUS_CFG[s]
                      const active = room.status === s
                      return (
                        <button key={s}
                          disabled={active || updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id:room._id, status:s })}
                          style={{
                            padding:"7px 16px", borderRadius:20,
                            border:`1px solid ${active ? c.dot : "var(--border)"}`,
                            background: active ? c.bg : "transparent",
                            color: active ? c.color : "var(--text-muted)",
                            fontSize:11, fontWeight:600, cursor: active ? "default" : "pointer",
                            opacity: updateStatus.isPending && !active ? 0.5 : 1,
                          }}
                        >{c.label}</button>
                      )
                    })}
                  </div>
                  {updateStatus.error && (
                    <div style={{ marginTop:10, fontSize:12, color:"var(--red)", display:"flex", alignItems:"center", gap:6 }}>
                      <AlertTriangle size={12} />{(updateStatus.error as Error).message}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: occupants */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>
                  Occupants ({room.occupants?.length ?? 0})
                </div>

                {!room.occupants?.length ? (
                  <div style={{ padding:40, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--card)", borderRadius:16, border:"1px dashed var(--border)", color:"var(--text-muted)", fontSize:13 }}>
                    <BedDouble size={32} style={{ marginBottom:10, opacity:.3 }} />
                    No occupants
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {room.occupants.map(occ => (
                      <div key={occ._id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--card)", borderRadius:12, border:"1px solid var(--border)" }}>
                        <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, background:"var(--accent-lo)", color:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>
                          {occ.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-pri)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            {occ.student_name}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'JetBrains Mono',monospace" }}>
                            #{occ.student_roll_no}
                          </div>
                        </div>
                        <span style={{ marginLeft:"auto", flexShrink:0, fontSize:10, fontWeight:700, color:"var(--green)", background:"rgba(16,185,129,.12)", padding:"3px 8px", borderRadius:8 }}>
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────
function DeleteModal({ room, onConfirm, onCancel, isLoading, error }: {
  room:Room; onConfirm:()=>void; onCancel:()=>void; isLoading:boolean; error:string|null
}) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1010,
      background:"var(--overlay)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={e => { if(e.target===e.currentTarget && !isLoading) onCancel() }}>
      <div style={{
        background:"var(--surface)", border:"1px solid rgba(239,68,68,.25)",
        borderRadius:20, padding:28, width:"100%", maxWidth:420,
        boxShadow:"var(--shadow)",
      }}>
        <div style={{ width:52, height:52, borderRadius:16, background:"rgba(239,68,68,.12)", color:"var(--red)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <Trash2 size={24} />
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text-pri)", marginBottom:8, fontFamily:"'DM Serif Display',serif" }}>Delete Room</div>
        <div style={{ fontSize:13, color:"var(--text-sec)", marginBottom:20, lineHeight:1.6 }}>
          This will permanently remove <strong style={{color:"var(--text-pri)"}}>Room {room.room_no}</strong>. The room must have no occupants before deletion.
        </div>
        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,.12)", color:"var(--red)", fontSize:12, marginBottom:16 }}>
            <AlertTriangle size={13} />{error}
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} disabled={isLoading} style={{
            flex:1, padding:"11px", borderRadius:12,
            border:"1px solid var(--border)", background:"transparent",
            color:"var(--text-sec)", fontSize:13, fontWeight:600, cursor:"pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={isLoading} style={{
            flex:1, padding:"11px", borderRadius:12, border:"none",
            background: isLoading ? "rgba(239,68,68,.4)" : "var(--red)",
            color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {isLoading ? <><Loader2 size={14} style={{animation:"spin .8s linear infinite"}} />Deleting…</> : <><Trash2 size={14} />Delete</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Rooms: React.FC = () => {
  const { token } = useCustom() as { token: string }
  const { data, isLoading, error, roomStats, createRoom, deleteRoom, filters, setFilters } = useRooms()

  const stats      = roomStats.data
  const rooms      = data?.data      ?? []
  const total      = data?.total     ?? 0
  const totalPages = data?.totalPages ?? 1

  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [searchInput,  setSearchInput]  = useState("")

  const applySearch = useDebounce((v: string) => setFilters({ search: v }), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); applySearch(e.target.value)
  }

  const handleCreate = useCallback(async (p: CreateRoomPayload) => { await createRoom.mutateAsync(p); setShowCreate(false) }, [createRoom])
  const handleDelete = useCallback(async () => { if(!deleteTarget) return; await deleteRoom.mutateAsync(deleteTarget._id); setDeleteTarget(null) }, [deleteTarget, deleteRoom])

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", padding:"28px 32px", fontFamily:"'DM Sans',sans-serif", color:"var(--text-pri)", transition:"background .25s ease" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:"var(--accent)", boxShadow:"0 0 12px var(--accent-glow)" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Hostel Management</span>
          </div>
          <h1 style={{ margin:0, fontSize:32, fontWeight:800, fontFamily:"'DM Serif Display',serif", color:"var(--text-pri)", lineHeight:1.1 }}>Rooms</h1>
          <p style={{ margin:"6px 0 0", fontSize:13, color:"var(--text-sec)" }}>Monitor occupancy, assign rooms, and manage availability</p>
        </div>
        <button
          onClick={() => setShowCreate(p => !p)}
          style={{
            padding:"11px 22px", borderRadius:12, border:"none",
            background: showCreate ? "var(--accent-lo)" : "var(--accent)",
            color: showCreate ? "var(--accent)" : "#fff",
            fontSize:13, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", gap:8,
            transition:"all .2s",
            boxShadow: showCreate ? "none" : "0 0 24px var(--accent-glow)",
          }}
        >
          {showCreate ? <><X size={15} />Cancel</> : <><Plus size={15} />Add Room</>}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
        <StatCard icon={<BedDouble size={22} />}    label="Total Rooms"    value={stats?.totalRooms ?? 0}            colorKey="accent" isLoading={roomStats.isLoading} />
        <StatCard icon={<CheckCircle2 size={22} />} label="Available Beds" value={stats?.availableBeds ?? 0}         colorKey="green"  isLoading={roomStats.isLoading} />
        <StatCard icon={<Users size={22} />}         label="Occupancy Rate" value={`${stats?.occupancyRate ?? 0}%`}  colorKey="amber"  isLoading={roomStats.isLoading} />
        <StatCard icon={<Wrench size={22} />}        label="Maintenance"    value={stats?.byStatus?.maintenance ?? 0} colorKey="red"    isLoading={roomStats.isLoading} />
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background:"var(--card)", border:"1px solid var(--border-hover)", borderRadius:20, padding:28, marginBottom:24, boxShadow:"var(--stat-shadow)" }}>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--text-pri)", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
            <Plus size={16} color="var(--accent)" /> Add New Room
          </div>
          <RoomForm onSubmit={handleCreate} isLoading={createRoom.isPending}
            error={createRoom.error?.message ?? null} submitLabel="Add Room"
            onCancel={() => setShowCreate(false)} token={token} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:220 }}>
          <Search size={14} color="var(--text-muted)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
          <input
            value={searchInput} onChange={handleSearch}
            placeholder="Search room number…"
            style={{ width:"100%", padding:"10px 14px 10px 38px", borderRadius:12, border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text-pri)", fontSize:13, outline:"none" }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        {[
          { name:"status", opts:[["","All Status"],["available","Available"],["occupied","Occupied"],["maintenance","Maintenance"]], val:filters.status ?? "" },
          { name:"type",   opts:[["","All Types"],["Single Seater","Single"],["Double Seater","Double"],["Triple Seater","Triple"]], val:filters.type ?? "" },
        ].map(f => (
          <select key={f.name} value={f.val}
            onChange={e => setFilters({ [f.name]: e.target.value || undefined } as any)}
            style={{ padding:"10px 14px", borderRadius:12, border:"1px solid var(--border)", background:"var(--input-bg)", color: f.val ? "var(--text-pri)" : "var(--text-muted)", fontSize:13, cursor:"pointer", outline:"none", minWidth:140 }}
          >
            {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 16px", borderRadius:12, border:"1px solid var(--border)", background:"var(--input-bg)", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>
          <Filter size={12} /> {isLoading ? "…" : `${total} room${total!==1?"s":""}`}
        </div>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderRadius:12, background:"rgba(239,68,68,.1)", color:"var(--red)", fontSize:13, marginBottom:20 }}>
          <AlertTriangle size={15} />{error}
        </div>
      )}

      {/* Rooms grid */}
      {isLoading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ background:"var(--card)", borderRadius:16, padding:20, border:"1px solid var(--border)", height:180, animation:"shimmer 1.4s ease-in-out infinite", opacity:.5 }} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0", color:"var(--text-muted)" }}>
          <BedDouble size={48} style={{ marginBottom:16, opacity:.3 }} />
          <div style={{ fontSize:16, fontWeight:600 }}>No rooms found</div>
          <div style={{ fontSize:13, marginTop:6 }}>Try adjusting your filters or add a new room</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
          {rooms.map(room => (
            <RoomCard key={room._id} room={room}
              onView={() => setSelectedId(room._id)}
              onDelete={() => setDeleteTarget(room)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:28, paddingTop:24, borderTop:"1px solid var(--border)" }}>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>Page {filters.page ?? 1} of {totalPages}</span>
          <div style={{ display:"flex", gap:8 }}>
            {[{ label:"← Prev", disabled:(filters.page??1)<=1,          action:()=>setFilters({page:(filters.page??1)-1}) },
              { label:"Next →", disabled:(filters.page??1)>=totalPages,  action:()=>setFilters({page:(filters.page??1)+1}) }
            ].map(b => (
              <button key={b.label} onClick={b.action} disabled={b.disabled || isLoading} style={{
                padding:"9px 20px", borderRadius:10, border:"1px solid var(--border)",
                background: b.disabled ? "transparent" : "var(--input-bg)",
                color: b.disabled ? "var(--text-muted)" : "var(--text-sec)",
                fontSize:12, fontWeight:600, cursor: b.disabled ? "not-allowed" : "pointer",
              }}>{b.label}</button>
            ))}
          </div>
        </div>
      )}

      {selectedId   && <RoomModal    roomId={selectedId}  token={token} onClose={() => setSelectedId(null)} />}
      {deleteTarget && <DeleteModal  room={deleteTarget}  onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isLoading={deleteRoom.isPending} error={deleteRoom.error?.message ?? null} />}
    </div>
  )
}

export default Rooms