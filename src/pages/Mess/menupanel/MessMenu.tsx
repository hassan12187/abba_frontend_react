"use client"

import { useState, useCallback } from "react"
import {
  Coffee, UtensilsCrossed, Moon,
  Pencil, Clock, Loader2, AlertTriangle, Plus, X,
} from "lucide-react"
import { useCustom } from "../../../Store/Store"
import {
  useWeeklyMenu,
  useUpdateMealItems,
  useUpdateMealTiming,
} from "./messMenu.query"
import { MessMenu, Meal, MealType } from "./messmenu.api"

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
] as const

const MEAL_META: Record<MealType, { label: string; icon: typeof Coffee; iconBg: string; iconColor: string }> = {
  breakfast: { label: "Breakfast", icon: Coffee,          iconBg: "rgba(16,185,129,.12)",  iconColor: "var(--green)"  },
  lunch:     { label: "Lunch",     icon: UtensilsCrossed, iconBg: "var(--accent-lo)",       iconColor: "var(--accent)" },
  dinner:    { label: "Dinner",    icon: Moon,            iconBg: "rgba(245,158,11,.12)",   iconColor: "var(--amber)"  },
}

interface EditState {
  open:     boolean
  menu:     MessMenu | null
  mealType: MealType
}
const CLOSED: EditState = { open: false, menu: null, mealType: "breakfast" }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="theme-card h-100">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="rounded-3"
          style={{ width:40, height:40, background:"var(--border)", opacity:.6, animation:"shimmer 1.4s ease-in-out infinite" }} />
        <div>
          <div className="rounded mb-1" style={{ width:80, height:14, background:"var(--border)", opacity:.5 }} />
          <div className="rounded"      style={{ width:120, height:11, background:"var(--border)", opacity:.4 }} />
        </div>
      </div>
      <div className="d-flex gap-2">
        {[60,90,55,75].map((w,i) => (
          <div key={i} className="rounded-pill" style={{ width:w, height:24, background:"var(--border)", opacity:.4 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Meal card ────────────────────────────────────────────────────────────────
function MealCard({
  mealType, meal, isSaving, onEdit,
}: {
  mealType: MealType
  meal:     Meal
  isSaving: boolean
  onEdit:   () => void
}) {
  const { label, icon: Icon, iconBg, iconColor } = MEAL_META[mealType]

  return (
    <div
      className="theme-card h-100"
      style={{ opacity: isSaving ? 0.55 : 1, transition: "opacity .2s" }}
    >
      <div className="d-flex align-items-start justify-content-between">
        <div className="d-flex align-items-center gap-3">
          {/* Icon box — uses CSS variable colors so it adapts to theme */}
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width:40, height:40, flexShrink:0, background:iconBg, color:iconColor }}
          >
            {isSaving
              ? <Loader2 size={17} style={{ animation:"spin .8s linear infinite" }} />
              : <Icon size={17} />
            }
          </div>
          <div>
            <h6 className="mb-0 fw-bold" style={{ color:"var(--text-pri)" }}>{label}</h6>
            <div className="d-flex align-items-center gap-1" style={{ fontSize:12, color:"var(--text-muted)" }}>
              <Clock size={11} />{meal.startTime} – {meal.endTime}
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          disabled={isSaving}
          style={{
            padding:4, background:"transparent", border:"none",
            color:"var(--text-muted)", cursor:"pointer", borderRadius:6,
            transition:"color .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Pencil size={15} />
        </button>
      </div>

      <div className="mt-3 d-flex flex-wrap gap-2">
        {meal.items.length === 0
          ? <span style={{ fontSize:12, color:"var(--text-muted)", fontStyle:"italic" }}>No items set</span>
          : meal.items.map((item) => (
              <span
                key={item}
                style={{
                  padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                  background:"var(--input-bg)", color:"var(--text-sec)",
                  border:"1px solid var(--border)",
                }}
              >
                {item}
              </span>
            ))
        }
      </div>
    </div>
  )
}

// ─── Edit modal ───────────────────────────────────────────────────────────────
function EditMealModal({
  editState, onClose, onSave, isSaving,
}: {
  editState: EditState
  onClose:   () => void
  onSave:    (items: string[], startTime: string, endTime: string) => Promise<void>
  isSaving:  boolean
}) {
  const { menu, mealType } = editState
  if (!menu) return null

  const meal              = menu[mealType]
  const [items,     setItems]     = useState<string[]>(meal.items)
  const [newItem,   setNewItem]   = useState("")
  const [startTime, setStartTime] = useState(meal.startTime)
  const [endTime,   setEndTime]   = useState(meal.endTime)
  const [error,     setError]     = useState<string | null>(null)

  const addItem = () => {
    const t = newItem.trim()
    if (!t) return
    if (items.map((i) => i.toLowerCase()).includes(t.toLowerCase())) {
      setError(`"${t}" is already in the list.`); return
    }
    setItems((p) => [...p, t])
    setNewItem("")
    setError(null)
  }

  const handleSave = async () => {
    if (!startTime || !endTime) { setError("Both times are required."); return }
    setError(null)
    await onSave(items, startTime, endTime)
  }

  const { iconColor } = MEAL_META[mealType]

  return (
    <div
      className="modal show d-block" tabIndex={-1}
      // Use CSS variable for overlay — adapts to theme
      style={{ backgroundColor:"var(--overlay)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose() }}
    >
      <div className="modal-dialog modal-dialog-centered">
        {/* modal-content class is overridden in theme.css */}
        <div className="modal-content border-0 shadow">

          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color:"var(--text-pri)" }}>
              <span style={{ color:iconColor }}>●</span>{" "}
              Edit {MEAL_META[mealType].label} — {menu.dayOfWeek}
            </h5>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                width:30, height:30, borderRadius:8, border:"1px solid var(--border)",
                background:"transparent", color:"var(--text-sec)", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="modal-body">
            {/* ── Items label */}
            <label className="form-label fw-semibold small">Menu Items</label>

            {/* ── Pill container — bg-light is overridden in theme.css to var(--surface) */}
            <div
              className="d-flex flex-wrap gap-2 p-2 rounded mb-2"
              style={{ minHeight:42, background:"var(--input-bg)", border:"1px solid var(--border)" }}
            >
              {items.length === 0
                ? <span style={{ fontSize:12, color:"var(--text-muted)", fontStyle:"italic", alignSelf:"center" }}>No items yet</span>
                : items.map((item) => (
                    <span
                      key={item}
                      style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                        background:"var(--card)", color:"var(--text-sec)",
                        border:"1px solid var(--border)",
                      }}
                    >
                      {item}
                      <button
                        onClick={() => setItems((p) => p.filter((i) => i !== item))}
                        disabled={isSaving}
                        style={{ background:"none", border:"none", padding:0, cursor:"pointer", color:"var(--text-muted)", lineHeight:1, display:"flex" }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))
              }
            </div>

            {/* ── Add item input */}
            <div className="input-group input-group-sm mb-3">
              {/* form-control is overridden in theme.css */}
              <input
                className="form-control"
                placeholder="Type an item and press Enter"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem() } }}
                disabled={isSaving}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={addItem}
                disabled={!newItem.trim() || isSaving}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* ── Timing */}
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label fw-semibold small">Start Time</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="07:30 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">End Time</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="09:00 AM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="form-text mb-2" style={{ fontSize:11, color:"var(--text-muted)" }}>
              Format: HH:MM AM/PM, e.g. 07:30 AM
            </div>

            {/* alert-danger is overridden in theme.css */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-0">
                <AlertTriangle size={13} />{error}
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-0 gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding:"7px 16px", borderRadius:8, border:"1px solid var(--border)",
                background:"transparent", color:"var(--text-sec)", fontSize:12,
                fontWeight:600, cursor:"pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary btn-sm"
            >
              {isSaving
                ? <span className="d-flex align-items-center gap-1">
                    <Loader2 size={13} style={{ animation:"spin .8s linear infinite" }} />Saving…
                  </span>
                : "Save Changes"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function MenuPanel() {
  const { token } = useCustom()

  const {
    data:      menus = [],
    isLoading,
    isError,
    error,
  } = useWeeklyMenu(token)

  const updateItems  = useUpdateMealItems(token)
  const updateTiming = useUpdateMealTiming(token)

  const [activeDay, setActiveDay] = useState("Monday")
  const [editState, setEditState] = useState<EditState>(CLOSED)

  const activeMenu = menus.find((m) => m.dayOfWeek === activeDay)

  const openEdit = useCallback((menu: MessMenu, mealType: MealType) => {
    setEditState({ open: true, menu, mealType })
  }, [])

  const isSavingMenu = (menuId: string) =>
    (updateItems.isPending  && (updateItems.variables  as any)?.menuId === menuId) ||
    (updateTiming.isPending && (updateTiming.variables as any)?.menuId === menuId)

  const mutationError = updateItems.error?.message ?? updateTiming.error?.message ?? null

  const handleSave = useCallback(
    async (newItems: string[], startTime: string, endTime: string) => {
      if (!editState.menu) return
      const { menu, mealType } = editState
      const original = menu[mealType]
      const origSet  = new Set(original.items)
      const add      = newItems.filter((i) => !origSet.has(i))
      const remove   = original.items.filter((i) => !new Set(newItems).has(i))
      const mutations: Promise<MessMenu>[] = []
      if (add.length > 0 || remove.length > 0)
        mutations.push(updateItems.mutateAsync({ menuId: menu._id, mealType, payload: { add, remove } }))
      if (startTime !== original.startTime || endTime !== original.endTime)
        mutations.push(updateTiming.mutateAsync({ menuId: menu._id, mealType, payload: { startTime, endTime } }))
      if (mutations.length > 0) await Promise.all(mutations)
      setEditState(CLOSED)
    },
    [editState, updateItems, updateTiming]
  )

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="mb-4">
        <h2 className="h4 fw-bold mb-1" style={{ color:"var(--text-pri)" }}>Weekly Menu</h2>
        <p style={{ color:"var(--text-sec)", fontSize:13, margin:0 }}>View and manage the weekly mess menu schedule</p>
      </div>

      {/* Errors */}
      {isError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
          <AlertTriangle size={15} />{(error as Error)?.message ?? "Failed to load menu."}
        </div>
      )}
      {mutationError && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small">
          <AlertTriangle size={15} />Save failed: {mutationError}. Your change was rolled back.
        </div>
      )}

      {/* Day tabs — nav-tabs classes are overridden in theme.css */}
      <ul className="nav nav-tabs mb-4 overflow-auto flex-nowrap" style={{ borderBottom:"1px solid var(--border)" }}>
        {DAYS.map((day) => {
          const hasMenu = menus.some((m) => m.dayOfWeek === day)
          const active  = activeDay === day
          return (
            <li className="nav-item" key={day}>
              <button
                onClick={() => setActiveDay(day)}
                style={{
                  padding:"10px 16px",
                  background:"transparent",
                  border:"none",
                  borderBottom: active ? `2px solid var(--accent)` : "2px solid transparent",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: active ? 700 : 400,
                  fontSize:13,
                  cursor:"pointer",
                  position:"relative",
                  transition:"color .15s, border-color .15s",
                  whiteSpace:"nowrap",
                }}
              >
                {day}
                {!isLoading && !hasMenu && (
                  <span
                    title="No menu set"
                    style={{
                      position:"absolute", top:8, right:6,
                      width:6, height:6, borderRadius:"50%",
                      background:"var(--amber)",
                    }}
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Meal cards */}
      <div className="row g-3">
        {isLoading
          ? [0,1,2].map((i) => <div className="col-12 col-md-4" key={i}><SkeletonCard /></div>)
          : !activeMenu
          ? (
            <div className="col-12">
              <div className="theme-card text-center py-5" style={{ color:"var(--text-muted)" }}>
                <UtensilsCrossed size={32} className="mb-2 opacity-50" />
                <p className="mb-0">No menu configured for <strong style={{ color:"var(--text-sec)" }}>{activeDay}</strong>.</p>
              </div>
            </div>
          )
          : (["breakfast","lunch","dinner"] as MealType[]).map((mealType) => (
            <div className="col-12 col-md-4" key={mealType}>
              <MealCard
                mealType={mealType}
                meal={activeMenu[mealType]}
                isSaving={isSavingMenu(activeMenu._id)}
                onEdit={() => openEdit(activeMenu, mealType)}
              />
            </div>
          ))
        }
      </div>

      {/* Week overview table */}
      <div className="theme-card mt-5 p-0">
        {/* card header — no bg-white hardcode */}
        <div
          className="py-3 px-4"
          style={{ borderBottom:"1px solid var(--border)" }}
        >
          <h6 className="mb-0 fw-bold" style={{ color:"var(--text-pri)" }}>Full Week Overview</h6>
        </div>
        <div className="table-responsive">
          {/* table classes handled by theme.css */}
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                {["Day","Breakfast","Lunch","Dinner"].map((h, i) => (
                  <th
                    key={h}
                    className={`small text-uppercase fw-bold ${i === 0 ? "ps-4" : ""}`}
                    style={{ color:"var(--text-muted)", letterSpacing:"0.07em", fontSize:10 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const menu   = menus.find((m) => m.dayOfWeek === day)
                const active = activeDay === day
                return (
                  <tr
                    key={day}
                    onClick={() => setActiveDay(day)}
                    style={{
                      cursor:"pointer",
                      background: active ? "var(--accent-lo)" : "transparent",
                      transition:"background .15s",
                    }}
                  >
                    <td className="ps-4 fw-bold" style={{ color: active ? "var(--accent)" : "var(--text-pri)" }}>
                      {day}
                      {active && (
                        <span style={{ marginLeft:6, fontSize:9, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                          ← viewing
                        </span>
                      )}
                    </td>
                    {menu
                      ? (["breakfast","lunch","dinner"] as MealType[]).map((mt) => (
                          <td key={mt} style={{ fontSize:12, color:"var(--text-muted)" }}>
                            {menu[mt].items.length > 0
                              ? menu[mt].items.slice(0,2).join(", ") +
                                (menu[mt].items.length > 2 ? ` +${menu[mt].items.length - 2}` : "")
                              : <span style={{ opacity:.4, fontStyle:"italic" }}>—</span>
                            }
                          </td>
                        ))
                      : [0,1,2].map((i) => (
                          <td key={i} style={{ fontSize:12, color:"var(--text-muted)", fontStyle:"italic", opacity:.5 }}>Not set</td>
                        ))
                    }
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editState.open && (
        <EditMealModal
          key={`${editState.menu?._id}-${editState.mealType}`}
          editState={editState}
          onClose={() => setEditState(CLOSED)}
          onSave={handleSave}
          isSaving={!!editState.menu && isSavingMenu(editState.menu._id)}
        />
      )}
    </div>
  )
}