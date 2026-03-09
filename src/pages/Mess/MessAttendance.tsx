"use client"

import { useState, useMemo } from "react"
import { Coffee, UtensilsCrossed, Moon, Plus, Search, UserCheck, Clock, X } from "lucide-react"
import { todayAttendance, stats, type MealType, type AttendanceRecord } from "./mock-data"
import SelectField from "../../components/reusable/SelectField"
import useCustomQuery from "../../components/hooks/useCustomQuery"
import { useCustom } from "../../Store/Store"

const mealConfig: Record<MealType, { icon: typeof Coffee; color: string; bgColor: string; count: number }> = {
  Breakfast: { icon: Coffee, color: "text-success", bgColor: "bg-success-subtle", count: stats.todayBreakfast },
  Lunch: { icon: UtensilsCrossed, color: "text-primary", bgColor: "bg-primary-subtle", count: stats.todayLunch },
  Dinner: { icon: Moon, color: "text-warning", bgColor: "bg-warning-subtle", count: stats.todayDinner },
}

export function AttendancePanel() {
  const [selectedDate, setSelectedDate] = useState("2026-03-02")
  const [selectedMeal, setSelectedMeal] = useState<MealType | "All">("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [records, setRecords] = useState<AttendanceRecord[]>(todayAttendance)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({ studentName: "", studentId: "", meal: "Lunch" as MealType, room: "" })
  const {token}=useCustom();
  const {data}=useCustomQuery("/api/admin/mess/attendance",token,"mess-attendace");

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesMeal = selectedMeal === "All" || record.meal === selectedMeal
      const matchesSearch =
        searchQuery === "" ||
        record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesMeal && matchesSearch
    })
  }, [records, selectedMeal, searchQuery])

  const handleManualEntry = () => {
    if (!newEntry.studentName || !newEntry.studentId) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const newRecord: AttendanceRecord = {
      id: `ATT${String(records.length + 1).padStart(3, "0")}`,
      studentName: newEntry.studentName,
      studentId: newEntry.studentId,
      meal: newEntry.meal,
      date: selectedDate,
      checkInTime: timeStr,
      room: newEntry.room || "N/A",
    }
    setRecords((prev) => [...prev, newRecord])
    setNewEntry({ studentName: "", studentId: "", meal: "Lunch", room: "" })
    setManualDialogOpen(false)
  }

  const mealCounts = useMemo(() => {
    const counts = { Breakfast: 0, Lunch: 0, Dinner: 0 }
    records.forEach((r) => {
      if (r.date === selectedDate) counts[r.meal]++
    })
    return counts
  }, [records, selectedDate])

  return (
    <div className="d-flex flex-column gap-4 container-fluid p-0">
      
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          <h2 className="h4 fw-bold mb-1">Attendance Tracker</h2>
          <p className="text-muted small mb-0">Track daily meal attendance and manage check-ins</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <input
            type="date"
            className="form-control form-control-sm w-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setManualDialogOpen(true)}>
            <Plus size={16} />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Meal Summary Cards */}
      <div className="row g-3">
        {(["Breakfast", "Lunch", "Dinner"] as MealType[]).map((meal) => {
          const config = mealConfig[meal]
          const Icon = config.icon
          const count = mealCounts[meal]
          const isActive = selectedMeal === meal

          return (
            <div className="col-12 col-sm-4" key={meal}>
              <div 
                className={`card border shadow-sm h-100 cursor-pointer transition-all ${isActive ? 'border-primary border-2' : ''}`}
                onClick={() => setSelectedMeal(isActive ? "All" : meal)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex align-items-center gap-3">
                  <div className={`rounded-3 d-flex align-items-center justify-content-center ${config.bgColor}`} style={{ width: '48px', height: '48px' }}>
                    <Icon size={20} className={config.color} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-uppercase text-muted fw-bold mb-0" style={{ fontSize: '10px' }}>{meal}</p>
                    <h3 className="h4 fw-bold mb-0">{count}</h3>
                  </div>
                  <UserCheck size={16} className="text-muted opacity-50" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Attendance Table Card */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white border-bottom-0 pt-4 px-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div>
              <h5 className="mb-0 fw-bold">
                Check-in Records
                {selectedMeal !== "All" && (
                  <span className="badge bg-secondary-subtle text-secondary ms-2 fw-normal" style={{ fontSize: '11px' }}>
                    {selectedMeal}
                  </span>
                )}
              </h5>
              <p className="text-muted small mb-0">{filteredRecords.length} records found</p>
            </div>
            <div className="position-relative" style={{ minWidth: '260px' }}>
              <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="card-body p-0 mt-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4 small text-uppercase text-muted fw-bold">Student</th>
                  <th className="small text-uppercase text-muted fw-bold">ID</th>
                  <th className="small text-uppercase text-muted fw-bold">Meal</th>
                  <th className="small text-uppercase text-muted fw-bold">Room</th>
                  <th className="pe-4 small text-uppercase text-muted fw-bold">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-5 text-center text-muted small">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const config = mealConfig[record.meal]
                    return (
                      <tr key={record.id}>
                        <td className="ps-4 fw-medium">{record.studentName}</td>
                        <td className="text-muted font-monospace small">{record.studentId}</td>
                        <td>
                          <span className={`badge border-0 ${config.bgColor} ${config.color} fw-normal`}>
                            {record.meal}
                          </span>
                        </td>
                        <td className="text-muted">{record.room}</td>
                        <td className="pe-4">
                          <div className="d-flex align-items-center gap-1 text-muted small">
                            <Clock size={12} />
                            {record.checkInTime}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {manualDialogOpen && (
        <>
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">Manual Attendance Entry</h5>
                  <button type="button" className="btn-close" onClick={() => setManualDialogOpen(false)}></button>
                </div>
                <div className="modal-body py-4">
                  <p className="text-muted small mb-4">Add a manual check-in record for a student.</p>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase">Student Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter student name"
                      value={newEntry.studentName}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, studentName: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase">Student ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. STU2024013"
                      value={newEntry.studentId}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, studentId: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase">Meal</label>
                    <select 
                      className="form-select"
                      value={newEntry.meal}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, meal: e.target.value as MealType }))}
                    >
                      {/* <SelectField value="Breakfast">Breakfast</SelectField>
                      <SelectField value="Lunch">Lunch</SelectField>
                      <SelectField value="Dinner">Dinner</SelectField> */}
                    </select>
                  </div>

                  <div className="mb-0">
                    <label className="form-label small fw-bold text-uppercase">Room Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. A-101"
                      value={newEntry.room}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, room: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button className="btn btn-outline-secondary" onClick={() => setManualDialogOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleManualEntry}>Add Entry</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}