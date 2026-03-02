"use client"

import { useState } from "react"
import { Coffee, UtensilsCrossed, Moon, Pencil, Clock } from "lucide-react"
import { weeklyMenu, type DayMenu, type MealType } from "./mock-data"

const mealIcons: Record<MealType, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: UtensilsCrossed,
  Dinner: Moon,
}

// Mapping to Bootstrap Subtitle Colors
const mealColors: Record<MealType, string> = {
  Breakfast: "bg-success-subtle text-success",
  Lunch: "bg-primary-subtle text-primary",
  Dinner: "bg-warning-subtle text-warning",
}

function MealCard({ meal, items, time, day, onEdit }: {
  meal: MealType
  items: string[]
  time: string
  day: string
  onEdit: () => void
}) {
  const Icon = mealIcons[meal]
  const colorClass = mealColors[meal]

  return (
    <div className="card h-100 border shadow-sm position-relative overflow-hidden">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className={`rounded-3 d-flex align-items-center justify-content-center ${colorClass}`} style={{ width: '40px', height: '40px' }}>
              <Icon size={20} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">{meal}</h6>
              <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '12px' }}>
                <Clock size={12} />
                {time}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-link text-muted p-1" 
            onClick={onEdit}
            title={`Edit ${meal}`}
          >
            <Pencil size={16} />
          </button>
        </div>
        
        <div className="mt-3 d-flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="badge rounded-pill bg-light text-dark border fw-normal">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MenuPanel() {
  const [menu, setMenu] = useState<DayMenu[]>(weeklyMenu)
  const [activeTab, setActiveTab] = useState("Monday")
  const [editState, setEditState] = useState<{
    open: boolean
    dayIndex: number
    meal: MealType
  }>({ open: false, dayIndex: 0, meal: "Breakfast" })

  const currentDay = menu[editState.dayIndex]
  const mealKey = editState.meal.toLowerCase() as "breakfast" | "lunch" | "dinner"
  const currentMealData = currentDay?.[mealKey]

  const handleSave = (items: string[], time: string) => {
    setMenu(prev => {
      const updated = [...prev]
      const day = { ...updated[editState.dayIndex] }
      day[mealKey] = { items, time }
      updated[editState.dayIndex] = day
      return updated
    })
    setEditState(prev => ({ ...prev, open: false }))
  }

  return (
    <div className="container-fluid p-0">
      <div className="mb-4">
        <h2 className="h4 fw-bold">Weekly Menu</h2>
        <p className="text-muted small">View and manage the weekly mess menu schedule</p>
      </div>

      {/* Bootstrap Nav Tabs */}
      <ul className="nav nav-tabs mb-4 overflow-auto flex-nowrap border-bottom-0">
        {menu.map((dayMenu, idx) => (
          <li className="nav-item" key={dayMenu.day}>
            <button
              className={`nav-link ${activeTab === dayMenu.day ? "active fw-bold" : "text-muted"}`}
              onClick={() => setActiveTab(dayMenu.day)}
            >
              {dayMenu.day}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {menu.map((dayMenu, dayIndex) => (
          <div key={dayMenu.day} className={`tab-pane fade ${activeTab === dayMenu.day ? "show active" : ""}`}>
            <div className="row g-3">
              {(["Breakfast", "Lunch", "Dinner"] as MealType[]).map((meal) => {
                const key = meal.toLowerCase() as "breakfast" | "lunch" | "dinner"
                return (
                  <div className="col-12 col-md-4" key={meal}>
                    <MealCard
                      meal={meal}
                      items={dayMenu[key].items}
                      time={dayMenu[key].time}
                      day={dayMenu.day}
                      onEdit={() => setEditState({ open: true, dayIndex, meal })}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full Week Table Overview */}
      <div className="card mt-5 shadow-sm">
        <div className="card-header bg-white py-3">
          <h6 className="mb-0 fw-bold">Full Week Overview</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4 small text-uppercase text-muted fw-bold">Day</th>
                  <th className="small text-uppercase text-muted fw-bold">Breakfast</th>
                  <th className="small text-uppercase text-muted fw-bold">Lunch</th>
                  <th className="small text-uppercase text-muted fw-bold">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {menu.map((dayMenu) => (
                  <tr key={dayMenu.day}>
                    <td className="ps-4 fw-bold">{dayMenu.day}</td>
                    <td className="text-muted small">{dayMenu.breakfast.items.slice(0, 2).join(", ")}</td>
                    <td className="text-muted small">{dayMenu.lunch.items.slice(0, 2).join(", ")}</td>
                    <td className="text-muted small">{dayMenu.dinner.items.slice(0, 2).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bootstrap Style Modal (Simplified for React) */}
      {editState.open && currentMealData && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit {editState.meal} - {currentDay.day}</h5>
                <button type="button" className="btn-close" onClick={() => setEditState(p => ({ ...p, open: false }))}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Menu Items</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    defaultValue={currentMealData.items.join(", ")}
                    id="edit-items-input"
                  />
                  <div className="form-text text-muted" style={{ fontSize: '11px' }}>Separate dishes with commas</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Timing</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    defaultValue={currentMealData.time}
                    id="edit-time-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setEditState(p => ({ ...p, open: false }))}>Cancel</button>
                <button className="btn btn-primary" onClick={() => {
                   const itemsVal = (document.getElementById('edit-items-input') as HTMLTextAreaElement).value
                   const timeVal = (document.getElementById('edit-time-input') as HTMLInputElement).value
                   handleSave(itemsVal.split(",").map(s => s.trim()).filter(Boolean), timeVal)
                }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}