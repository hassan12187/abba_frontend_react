"use client"

import React, { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import {
  Eye, Home, X, Search, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, CheckCircle2, RotateCcw,
  BedDouble, ShieldCheck, Coffee, Users, Utensils, CalendarCheck, Plus,
} from "lucide-react"
import { useStudents, useBlocks, useRoomsByBlock } from "./student.queries"
import { useStudentSubscription, useCreateSubscription } from "./useCreateSubscription"
import { useDebounce } from "../../components/hooks/useDebounce"
import type { Application, ApplicationStatus } from "../StudentApplications/studentapplication.api"
import type { Room, Block } from "./room.api"
import type { PlanType } from "../Mess/messSubscription/messSubscription.api"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Partial<Record<ApplicationStatus, {
  label: string; color: string; bg: string; dot: string; border: string
}>> = {
  approved: { label: "Approved", color: "var(--green)",  bg: "rgba(16,185,129,.10)", dot: "var(--green)",  border: "rgba(16,185,129,.25)" },
  accepted: { label: "Accepted", color: "#06b6d4",       bg: "rgba(6,182,212,.10)",  dot: "#06b6d4",       border: "rgba(6,182,212,.25)"  },
  rejected: { label: "Rejected", color: "var(--red)",    bg: "rgba(239,68,68,.10)",  dot: "var(--red)",    border: "rgba(239,68,68,.25)"  },
  pending:  { label: "Pending",  color: "var(--amber)",  bg: "rgba(245,158,11,.10)", dot: "var(--amber)",  border: "rgba(245,158,11,.25)" },
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const c = STATUS_CFG[status] ?? {
    label: status, color: "var(--text-muted)",
    bg: "var(--input-bg)", dot: "var(--text-muted)", border: "var(--border)",
  }
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

// ─── Room pill ────────────────────────────────────────────────────────────────
function RoomPill({ room }: { room?: Application["room_id"] }) {
  if (!room) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        color: "var(--text-muted)", background: "var(--input-bg)", border: "1px solid var(--border)",
      }}>
        <BedDouble size={10} /> Not Assigned
      </span>
    )
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: "var(--green)", background: "rgba(16,185,129,.10)", border: "1px solid rgba(16,185,129,.25)",
    }}>
      <BedDouble size={10} /> {room.room_no}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
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

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 64px",
      gap: 16, alignItems: "center",
      padding: "14px 24px", borderBottom: "1px solid var(--border)",
      animation: "shimmer 1.4s ease-in-out infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--border)", flexShrink: 0 }} />
        <div>
          <div style={{ width: 120, height: 12, borderRadius: 6, background: "var(--border)", marginBottom: 6 }} />
          <div style={{ width: 80,  height: 10, borderRadius: 6, background: "var(--border)", opacity: .6 }} />
        </div>
      </div>
      {[70, 80, 80].map((w, i) => (
        <div key={i} style={{ width: w, height: 12, borderRadius: 6, background: "var(--border)" }} />
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)" }} />
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)" }} />
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, colorVar, isLoading }: {
  icon: React.ReactNode; label: string; value: number | string
  colorVar: string; isLoading: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 14,
        transition: "transform .2s, box-shadow .2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "var(--stat-shadow)" : "none",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${colorVar} 12%, transparent)`,
        color: colorVar, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 24, fontWeight: 800, color: "var(--text-pri)",
          lineHeight: 1, fontFamily: "'DM Serif Display',serif",
        }}>
          {isLoading
            ? <span style={{ display: "inline-block", width: 48, height: 20, borderRadius: 6, background: "var(--border)", animation: "shimmer 1.4s ease-in-out infinite" }} />
            : value
          }
        </div>
      </div>
    </div>
  )
}

// ─── Plan defaults ────────────────────────────────────────────────────────────
const PLAN_DEFAULTS: Record<PlanType, { fee: number; months: number | null }> = {
  Monthly:      { fee: 3000, months: 1    },
  Semester:     { fee: 2500, months: 6    },
  Pay_Per_Meal: { fee: 0,    months: null },
}

function addMonths(date: Date, n: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d.toISOString()
}

// ─── Mess subscription tab content ───────────────────────────────────────────
function MessTab({ student, token }: { student: Application; token: string }) {
  const [planType,   setPlanType]   = useState<PlanType>("Monthly")
  const [monthlyFee, setMonthlyFee] = useState(PLAN_DEFAULTS.Monthly.fee)
  const [success,    setSuccess]    = useState(false)

  const { data: existingSub, isLoading: subLoading } = useStudentSubscription(student._id, token)
  const createSub = useCreateSubscription(token)

  const handlePlanChange = (plan: PlanType) => {
    setPlanType(plan)
    setMonthlyFee(PLAN_DEFAULTS[plan].fee)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const months = PLAN_DEFAULTS[planType].months
    await createSub.mutateAsync({
      student:    student._id,
      planType,
      monthlyFee: Math.round(monthlyFee * 100) / 100,
      validUntil: months ? addMonths(new Date(), months) : undefined,
    })
    setSuccess(true)
  }

  if (subLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <Loader2 size={24} color="var(--accent)" style={{ animation: "spin .8s linear infinite" }} />
      </div>
    )
  }

  if (existingSub) {
    return (
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", borderRadius: 14,
          background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
          marginBottom: 16,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(16,185,129,.15)", color: "var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CalendarCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-pri)" }}>
              Subscription Active
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {existingSub.planType} · ₹{existingSub.monthlyFee.toLocaleString("en-IN")}/mo
              {existingSub.validUntil && (
                ` · Expires ${new Date(existingSub.validUntil).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}`
              )}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          Manage this subscription from the{" "}
          <strong style={{ color: "var(--accent)" }}>Subscriptions</strong> panel.
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(16,185,129,.12)", color: "var(--green)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
        }}>
          <CheckCircle2 size={28} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pri)", marginBottom: 6 }}>
          Subscription Created
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {student.student_name} now has an active mess subscription.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Plan type */}
      <div style={{ marginBottom: 18 }}>
        <label style={{
          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.07em",
          display: "block", marginBottom: 8,
        }}>
          Plan Type
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {(["Monthly", "Semester", "Pay_Per_Meal"] as PlanType[]).map(plan => (
            <button
              key={plan}
              type="button"
              onClick={() => handlePlanChange(plan)}
              style={{
                padding: "10px 6px", borderRadius: 12, cursor: "pointer",
                border: `1px solid ${planType === plan ? "var(--accent)" : "var(--border)"}`,
                background: planType === plan ? "var(--accent-lo)" : "var(--input-bg)",
                color: planType === plan ? "var(--accent)" : "var(--text-sec)",
                fontSize: 11, fontWeight: planType === plan ? 700 : 500,
                transition: "all .15s", textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {plan === "Pay_Per_Meal" ? "Per Meal" : plan}
              </div>
              {plan !== "Pay_Per_Meal" && (
                <div style={{ fontSize: 10, opacity: .7, marginTop: 2 }}>
                  {plan === "Monthly" ? "1 month" : "6 months"}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fee */}
      <div style={{ marginBottom: 18 }}>
        <label style={{
          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.07em",
          display: "block", marginBottom: 6,
        }}>
          {planType === "Pay_Per_Meal" ? "Per Meal Rate (₹)" : "Monthly Fee (₹)"}
        </label>
        <input
          type="number"
          value={monthlyFee}
          onChange={e => setMonthlyFee(parseFloat(e.target.value) || 0)}
          min={planType === "Pay_Per_Meal" ? 0 : 1}
          step="0.01"
          required={planType !== "Pay_Per_Meal"}
          disabled={createSub.isPending}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--border)", background: "var(--input-bg)",
            color: "var(--text-pri)", fontSize: 14, fontWeight: 600, outline: "none",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border)")}
        />
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {planType === "Monthly"      && "Subscription valid for 1 month from today."}
          {planType === "Semester"     && "Subscription valid for 6 months from today."}
          {planType === "Pay_Per_Meal" && "Student is charged per meal consumed."}
        </div>
      </div>

      {createSub.error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(239,68,68,.12)", color: "var(--red)",
          fontSize: 12, marginBottom: 16,
        }}>
          <AlertTriangle size={13} />{(createSub.error as Error).message}
        </div>
      )}

      <button
        type="submit"
        disabled={createSub.isPending}
        style={{
          width: "100%", padding: "11px", borderRadius: 12, border: "none",
          background: createSub.isPending ? "var(--border)" : "var(--accent)",
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: createSub.isPending ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {createSub.isPending
          ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />Creating…</>
          : <><Plus size={14} />Create Subscription</>
        }
      </button>
    </form>
  )
}

// ─── Room assignment tab content ──────────────────────────────────────────────
function RoomTab({ student, token, onAssign, onUnassign, isLoading, error }: {
  student:    Application
  token:      string
  onAssign:   (roomId: string) => Promise<void>
  onUnassign: () => Promise<void>
  isLoading:  boolean
  error:      string | null
}) {
  const [blockId,  setBlockId]  = useState("")
  const [roomId,   setRoomId]   = useState("")
  const [localErr, setLocalErr] = useState<string | null>(null)

  const { data: blocks = [], isLoading: blocksLoading } = useBlocks(token)
  const { data: rooms  = [], isLoading: roomsLoading  } = useRoomsByBlock(blockId || null, token)

  const hasRoom = !!student.room_id

  const handleAssign = async () => {
    if (!roomId) { setLocalErr("Please select a room."); return }
    setLocalErr(null)
    await onAssign(roomId)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--text-pri)", fontSize: 13, outline: "none",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.07em",
    display: "block", marginBottom: 4,
  }

  return (
    <div>
      {/* Student info tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Email",         value: student.student_email },
          { label: "Academic Year", value: student.academic_year ?? "—" },
          { label: "CNIC",          value: student.cnic_no ?? "—" },
          { label: "Status",        value: null, badge: <StatusPill status={student.status} /> },
        ].map(f => (
          <div key={f.label} style={{
            padding: "10px 12px", background: "var(--card)",
            borderRadius: 12, border: "1px solid var(--border)",
          }}>
            <div style={labelStyle}>{f.label}</div>
            {f.badge ?? (
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-pri)" }}>{f.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Current room */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...labelStyle, marginBottom: 8 }}>
          <Home size={11} style={{ display: "inline", marginRight: 4 }} />
          Current Room
        </div>
        {hasRoom ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "rgba(16,185,129,.15)", color: "var(--green)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BedDouble size={15} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-pri)" }}>
                  Room {student.room_id!.room_no}
                </div>
                {(student.room_id!.floor || student.room_id!.block) && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {[
                      student.room_id!.floor && `Floor ${student.room_id!.floor}`,
                      student.room_id!.block && `Block ${student.room_id!.block}`,
                    ].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onUnassign}
              disabled={isLoading}
              style={{
                padding: "6px 14px", borderRadius: 10, cursor: "pointer",
                border: "1px solid rgba(239,68,68,.25)",
                background: "rgba(239,68,68,.08)", color: "var(--red)",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {isLoading
                ? <Loader2 size={12} style={{ animation: "spin .8s linear infinite" }} />
                : <RotateCcw size={12} />
              }
              Unassign
            </button>
          </div>
        ) : (
          <div style={{
            padding: "12px 16px", borderRadius: 12, fontStyle: "italic",
            background: "var(--card)", border: "1px dashed var(--border)",
            color: "var(--text-muted)", fontSize: 13,
          }}>
            No room assigned yet
          </div>
        )}
      </div>

      {/* Assign new room */}
      {!hasRoom && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Assign a Room</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={labelStyle}>Block</div>
              <select
                value={blockId}
                onChange={e => { setBlockId(e.target.value); setRoomId("") }}
                disabled={isLoading || blocksLoading}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              >
                <option value="">{blocksLoading ? "Loading…" : "Select block"}</option>
                {blocks.map((b: Block) => (
                  <option key={b._id} value={b._id}>Block {b.block_no}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Room</div>
              <select
                value={roomId}
                onChange={e => { setRoomId(e.target.value); setLocalErr(null) }}
                disabled={isLoading || !blockId || roomsLoading}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              >
                <option value="">
                  {!blockId ? "Select block first" : roomsLoading ? "Loading…" : "Select room"}
                </option>
                {rooms.map((r: Room) => (
                  <option key={r._id} value={r._id}>
                    {r.room_no} — {r.available_beds} bed{r.available_beds !== 1 ? "s" : ""} free
                  </option>
                ))}
              </select>
            </div>
          </div>

          {blockId && !roomsLoading && rooms.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 10 }}>
              No available rooms in this block.
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={!roomId || isLoading}
            style={{
              width: "100%", padding: "10px", borderRadius: 12, border: "none",
              background: (!roomId || isLoading) ? "var(--border)" : "var(--green)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: (!roomId || isLoading) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isLoading
              ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Assigning…</>
              : <><CheckCircle2 size={13} />Assign Room</>
            }
          </button>
        </div>
      )}

      {(error || localErr) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(239,68,68,.12)", color: "var(--red)", fontSize: 12,
        }}>
          <AlertTriangle size={13} />{error ?? localErr}
        </div>
      )}
    </div>
  )
}

// ─── Assign modal ─────────────────────────────────────────────────────────────
interface AssignModalProps {
  student:    Application
  token:      string
  onClose:    () => void
  onAssign:   (roomId: string) => Promise<void>
  onUnassign: () => Promise<void>
  isLoading:  boolean
  error:      string | null
}

function AssignModal({ student, token, onClose, onAssign, onUnassign, isLoading, error }: AssignModalProps) {
  const [activeTab, setActiveTab] = useState<"room" | "mess">("room")

  const TABS = [
    { key: "room" as const, label: "Room Assignment",   icon: <BedDouble size={14} /> },
    { key: "mess" as const, label: "Mess Subscription", icon: <Utensils  size={14} /> },
  ]

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1050,
        background: "var(--overlay)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget && !isLoading) onClose() }}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 24, width: "100%", maxWidth: 520,
        boxShadow: "var(--shadow)", animation: "fadeUp .2s ease",
        overflow: "hidden", maxHeight: "90vh",
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Header ── */}
        <div style={{ padding: "22px 24px 0", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {/* Student info row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={student.student_name} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif" }}>
                  {student.student_name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                  #{student.student_roll_no}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-sec)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex" }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: "10px 0", border: "none", background: "transparent",
                  borderBottom: `2px solid ${activeTab === tab.key ? "var(--accent)" : "transparent"}`,
                  color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)",
                  fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all .15s",
                }}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {activeTab === "room"
            ? <RoomTab
                student={student} token={token}
                onAssign={onAssign} onUnassign={onUnassign}
                isLoading={isLoading} error={error}
              />
            : <MessTab student={student} token={token} />
          }
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "flex-end", flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "9px 20px", borderRadius: 12, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text-sec)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const Students: React.FC = () => {
  const {
    students, total, totalPages, isLoading, error,
    stats, isStatsLoading,
    filters, setFilters,
    selectedId, setSelectedId,
    selectedStudent, isLoadingStudentDetail,
    assignRoom, isAssigning, assignError,
    token,
  } = useStudents()
  console.log(students);
  console.log(total);
  console.log(totalPages);
  console.log(stats);
  
  const [searchInput, setSearchInput] = useState("")

  const applySearch = useDebounce((val: string) => setFilters({ search: val }), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); applySearch(e.target.value)
  }

  const openModal  = useCallback((id: string) => setSelectedId(id), [setSelectedId])
  const closeModal = useCallback(() => setSelectedId(null), [setSelectedId])

  const handleAssign = useCallback(async (roomId: string) => {
    if (!selectedStudent) return
    await assignRoom(selectedStudent._id, roomId)
    closeModal()
  }, [selectedStudent, assignRoom, closeModal])

  const handleUnassign = useCallback(async () => {
    if (!selectedStudent) return
    await assignRoom(selectedStudent._id, null)
    closeModal()
  }, [selectedStudent, assignRoom, closeModal])

  const STATUS_FILTERS: (ApplicationStatus | "All")[] = ["All", "approved", "accepted"]
  const withRoom    = stats?.access?.withRoom    ?? 0
  const messEnabled = stats?.access?.messEnabled ?? 0

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-pri)", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Hostel Management
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", lineHeight: 1.1, fontFamily: "'DM Serif Display',serif" }}>
          Students
        </h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-sec)" }}>
          {isLoading ? "Loading…" : `${total} enrolled student${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
          borderRadius: 12, background: "rgba(239,68,68,.1)", color: "var(--red)",
          fontSize: 13, border: "1px solid rgba(239,68,68,.2)",
        }}>
          <AlertTriangle size={15} />{error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
        <StatCard icon={<Users      size={18} />} label="Total Students" value={stats?.access?.total      ?? 0} colorVar="var(--accent)" isLoading={isStatsLoading} />
        <StatCard icon={<BedDouble  size={18} />} label="Room Assigned"  value={withRoom}                       colorVar="var(--green)"  isLoading={isStatsLoading} />
        <StatCard icon={<Coffee     size={18} />} label="Mess Enabled"   value={messEnabled}                    colorVar="var(--amber)"  isLoading={isStatsLoading} />
        <StatCard icon={<ShieldCheck size={18} />} label="Approved"      value={stats?.byStatus?.approved ?? 0} colorVar="#06b6d4"       isLoading={isStatsLoading} />
      </div>

      {/* Table card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-pri)" }}>All Students</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={searchInput} onChange={handleSearch}
                placeholder="Name, reg no, email…"
                style={{
                  padding: "8px 12px 8px 34px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text-pri)", fontSize: 12, outline: "none", minWidth: 210,
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setFilters({ search: undefined }) }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 4, background: "var(--input-bg)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
              {STATUS_FILTERS.map(s => {
                const active = (filters.status ?? "All") === s
                return (
                  <button
                    key={s}
                    onClick={() => setFilters({ status: s === "All" ? undefined : s as ApplicationStatus })}
                    style={{
                      padding: "5px 12px", borderRadius: 8, border: "none",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "#fff" : "var(--text-muted)",
                      fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
                      transition: "all .15s", textTransform: "capitalize",
                    }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 64px",
          gap: 16, padding: "10px 24px",
          borderBottom: "1px solid var(--border)", background: "var(--surface)",
        }}>
          {["Student", "Reg No", "Room", "Status", ""].map((h, i) => (
            <div key={h + i} style={{
              fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              textAlign: i === 4 ? "right" : "left",
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : students.length === 0
            ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <Users size={36} style={{ marginBottom: 12, opacity: .3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No students found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter</div>
              </div>
            )
            : students.map((student, idx) => {
                const isMutating = isAssigning && selectedId === student._id
                return (
                  <div
                    key={student._id}
                    style={{
                      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 64px",
                      gap: 16, alignItems: "center", padding: "13px 24px",
                      borderBottom: idx < students.length - 1 ? "1px solid var(--border)" : "none",
                      opacity: isMutating ? 0.45 : 1,
                      transition: "opacity .2s, background .15s",
                      animation: `fadeUp .25s ease ${idx * .025}s both`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={student.student_name} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-pri)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {student.student_name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {student.student_email}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>
                      {student.student_reg_no ?? "—"}
                    </div>

                    <div><RoomPill room={student.room_id} /></div>

                    <div><StatusPill status={student.status} /></div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                      {isMutating ? (
                        <Loader2 size={16} color="var(--text-muted)" style={{ animation: "spin .8s linear infinite" }} />
                      ) : (
                        <>
                          <button
                            title="View / Assign"
                            onClick={() => openModal(student._id)}
                            style={actionBtn("var(--accent)", "var(--accent-lo)")}
                          >
                            <Eye size={13} />
                          </button>
                          {student.room_id && (
                            <button
                              title="Remove Room"
                              onClick={() => assignRoom(student._id, null)}
                              disabled={isAssigning}
                              style={actionBtn("var(--red)", "rgba(239,68,68,.1)")}
                            >
                              <RotateCcw size={13} />
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
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Page {filters.page ?? 1} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "← Prev", disabled: (filters.page ?? 1) <= 1,         action: () => setFilters({ page: (filters.page ?? 1) - 1 }) },
              { label: "Next →", disabled: (filters.page ?? 1) >= totalPages, action: () => setFilters({ page: (filters.page ?? 1) + 1 }) },
            ].map(b => (
              <button
                key={b.label}
                onClick={b.action}
                disabled={b.disabled || isLoading}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "1px solid var(--border)",
                  background: b.disabled ? "transparent" : "var(--input-bg)",
                  color: b.disabled ? "var(--text-muted)" : "var(--text-sec)",
                  fontSize: 12, fontWeight: 600,
                  cursor: b.disabled ? "not-allowed" : "pointer",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedId && (
        isLoadingStudentDetail ? (
          <div style={{
            position: "fixed", inset: 0, zIndex: 1050,
            background: "var(--overlay)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Loader2 size={32} color="var(--accent)" style={{ animation: "spin .8s linear infinite" }} />
          </div>
        ) : selectedStudent ? (
          <AssignModal
            student={selectedStudent}
            token={token}
            onClose={closeModal}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            isLoading={isAssigning}
            error={assignError}
          />
        ) : null
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

function actionBtn(color: string, bg: string): React.CSSProperties {
  return {
    width: 28, height: 28, borderRadius: 8, border: "none",
    background: bg, color,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "opacity .15s", flexShrink: 0,
  }
}

export default Students