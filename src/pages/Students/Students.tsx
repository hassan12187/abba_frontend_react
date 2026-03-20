"use client"

import React, { useState, useCallback, type ChangeEvent } from "react"
import {
  Eye, Home, X, Search, Loader2,
  AlertTriangle, ChevronLeft, ChevronRight,
  CheckCircle2, RotateCcw, DoorOpen,
} from "lucide-react"
import "./Students.css"
import { useStudents, useBlocks, useRoomsByBlock } from "./student.queries"
import { useDebounce }   from "../../components/hooks/useDebounce"
import FilterSection     from "../../components/reusable/FilterSection"
import InputField        from "../../components/reusable/InputField"
import SelectField       from "../../components/reusable/SelectField"
import type { Application, ApplicationStatus } from "../StudentApplications/studentapplication.api"
import type { Room, Block } from "./room.api"

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Partial<Record<ApplicationStatus, { label: string; cls: string }>> = {
  approved: { label: "Approved", cls: "badge-active"   },
  accepted: { label: "Accepted", cls: "badge-pending"  },
  rejected: { label: "Rejected", cls: "badge-rejected" },
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: "badge-default" }
  return <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
}

// ─── Room badge ───────────────────────────────────────────────────────────────
function RoomBadge({ room }: { room?: Application["room_id"] }) {
  if (!room) return <span className="room-badge not-assigned">Not Assigned</span>
  return <span className="room-badge assigned">{room.room_no}</span>
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ opacity: 0.5 }}>
      {[70, 140, 80, 70, 70].map((w, i) => (
        <td key={i}>
          <div className="rounded" style={{ height: 12, width: w, background: "var(--bs-border-color)", animation: "pulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Room Assignment Modal ────────────────────────────────────────────────────
interface AssignModalProps {
  student:     Application
  token:       string
  onClose:     () => void
  onAssign:    (roomId: string) => Promise<void>
  onUnassign:  () => Promise<void>
  isLoading:   boolean
  error:       string | null
}

function AssignModal({ student, token, onClose, onAssign, onUnassign, isLoading, error }: AssignModalProps) {
  const [blockId, setBlockId] = useState("")
  const [roomId,  setRoomId]  = useState("")

  const { data: blocks = [],    isLoading: blocksLoading } = useBlocks(token)
  const { data: rooms  = [],    isLoading: roomsLoading  } = useRoomsByBlock(blockId || null, token)

  const hasRoom = !!student.room_id

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose() }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header bg-light border-bottom">
            <div>
              <h5 className="modal-title fw-bold mb-0">{student.student_name}</h5>
              <div className="text-muted small font-monospace">#{student.student_roll_no}</div>
            </div>
            <button className="btn-close" onClick={onClose} disabled={isLoading} />
          </div>

          <div className="modal-body p-4">
            {/* Student info strip */}
            <div className="row g-2 mb-4 p-3 bg-light rounded">
              <div className="col-6">
                <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase" }}>CNIC</div>
                <div className="small fw-medium">{student.cnic_no ?? "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase" }}>Academic Year</div>
                <div className="small fw-medium">{student.academic_year ?? "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase" }}>Email</div>
                <div className="small fw-medium">{student.student_email}</div>
              </div>
              <div className="col-6">
                <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase" }}>Status</div>
                <StatusBadge status={student.status} />
              </div>
            </div>

            {/* Current room */}
            <div className="mb-4">
              <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                <Home size={13} /> Current Room
              </label>
              {hasRoom ? (
                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                  <div className="d-flex align-items-center gap-2">
                    <DoorOpen size={16} className="text-success" />
                    <span className="fw-bold">Room {student.room_id!.room_no}</span>
                    {student.room_id!.floor && (
                      <span className="text-muted small">· Floor {student.room_id!.floor}</span>
                    )}
                    {student.room_id!.block && (
                      <span className="text-muted small">· Block {student.room_id!.block}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={onUnassign}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                      : <RotateCcw size={13} />
                    }
                    Unassign
                  </button>
                </div>
              ) : (
                <div className="p-3 border rounded text-muted small fst-italic">
                  No room assigned yet.
                </div>
              )}
            </div>

            {/* Assign new room */}
            {!hasRoom && (
              <div>
                <label className="form-label small fw-semibold">Assign a Room</label>
                <div className="row g-2">
                  <div className="col-6">
                    <select
                      className="form-select form-select-sm"
                      value={blockId}
                      onChange={(e) => { setBlockId(e.target.value); setRoomId("") }}
                      disabled={isLoading || blocksLoading}
                    >
                      <option value="">
                        {blocksLoading ? "Loading blocks…" : "Select Block"}
                      </option>
                      {blocks.map((b: Block) => (
                        <option key={b._id} value={b._id}>Block {b.block_no}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <select
                      className="form-select form-select-sm"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      disabled={isLoading || !blockId || roomsLoading}
                    >
                      <option value="">
                        {roomsLoading ? "Loading rooms…" : "Select Room"}
                      </option>
                      {rooms.map((r: Room) => (
                        <option key={r._id} value={r._id}>
                          {r.room_no} ({r.available_beds} bed{r.available_beds !== 1 ? "s" : ""} free)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {blockId && !roomsLoading && rooms.length === 0 && (
                  <div className="text-muted small mt-2 fst-italic">
                    No available rooms in this block.
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mt-3 mb-0">
                <AlertTriangle size={13} /> {error}
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-0 gap-2">
            <button className="btn btn-light btn-sm" onClick={onClose} disabled={isLoading}>
              Close
            </button>
            {!hasRoom && (
              <button
                className="btn btn-success btn-sm d-flex align-items-center gap-1"
                onClick={() => onAssign(roomId)}
                disabled={!roomId || isLoading}
              >
                {isLoading
                  ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Assigning…</>
                  : <><CheckCircle2 size={13} />Assign Room</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const Students: React.FC = () => {
  const {
    students, total, totalPages, isLoading, error,
    filters, setFilters,
    selectedId, setSelectedId,
    selectedStudent, isLoadingStudentDetail,
    assignRoom, isAssigning, assignError,
    token,
  } = useStudents()

  const [searchInput, setSearchInput] = useState("")

  const applySearch = useDebounce((val: string) => setFilters({ search: val }), 500)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    applySearch(e.target.value)
  }

  const openModal   = useCallback((id: string) => setSelectedId(id), [setSelectedId])
  const closeModal  = useCallback(() => setSelectedId(null), [setSelectedId])

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

  return (
    <div className="students-page">
      <div className="page-header">
        <h2><i className="fas fa-users" /> Students Management</h2>
        <p className="text-muted small mb-0">
          {isLoading ? "Loading…" : `${total} student${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filters */}
      <FilterSection heading="Filter Students">
        <div className="position-relative">
          <Search
            size={14}
            className="position-absolute text-muted"
            style={{ left: 10, top: "50%", transform: "translateY(-50%)" }}
          />
          <InputField
            name="search"
            value={searchInput}
            onChange={handleSearch}
            placeholder="Search by name, reg no…"
            style={{ paddingLeft: 32 }}
          />
        </div>

        <SelectField
          name="status"
          value={filters.status ?? "approved"}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setFilters({ status: e.target.value as ApplicationStatus })
          }
        >
          <option value="approved">Approved</option>
          <option value="accepted">Accepted</option>
        </SelectField>
      </FilterSection>

      {/* Error */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mx-3 mb-3">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="students-table-section">
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Full Name</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : students.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="no-data">No students found</td>
                  </tr>
                )
                : students.map((student) => (
                    <tr key={student._id}>
                      <td className="font-monospace small">{student.student_reg_no ?? "—"}</td>
                      <td>
                        <div className="fw-medium">{student.student_name}</div>
                        <div className="text-muted small">{student.student_email}</div>
                      </td>
                      <td><RoomBadge room={student.room_id} /></td>
                      <td><StatusBadge status={student.status} /></td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          {/* View / assign room */}
                          <button
                            className="action btn btn-sm btn-view"
                            title="View / Assign Room"
                            onClick={() => openModal(student._id)}
                          >
                            <Eye size={14} />
                          </button>
                          {/* Quick unassign from table row */}
                          {student.room_id && (
                            <button
                              className="action btn btn-sm btn-delete"
                              title="Remove Room Assignment"
                              onClick={() => assignRoom(student._id, null)}
                              disabled={isAssigning}
                            >
                              {isAssigning
                                ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                                : <RotateCcw size={13} />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between px-3 py-3 border-top">
              <span className="small text-muted">
                Page {filters.page ?? 1} of {totalPages}
              </span>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={(filters.page ?? 1) <= 1 || isLoading}
                  onClick={() => setFilters({ page: (filters.page ?? 1) - 1 })}
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={(filters.page ?? 1) >= totalPages || isLoading}
                  onClick={() => setFilters({ page: (filters.page ?? 1) + 1 })}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign / detail modal */}
      {selectedId && (
        isLoadingStudentDetail
          ? (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow d-flex align-items-center justify-content-center p-5">
                  <Loader2 size={28} className="text-muted" style={{ animation: "spin .8s linear infinite" }} />
                </div>
              </div>
            </div>
          )
          : selectedStudent
          ? (
            <AssignModal
              student={selectedStudent}
              token={token}
              onClose={closeModal}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
              isLoading={isAssigning}
              error={assignError}
            />
          )
          : null
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

export default Students