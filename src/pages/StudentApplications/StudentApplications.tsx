"use client"

import React, { useState, useCallback, type ChangeEvent } from "react"
import {
  Eye, Check, X, Search, FileSpreadsheet,
  User, GraduationCap, Home, MessageSquare,
  Loader2, AlertTriangle, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, FileText,
} from "lucide-react"
import "./StudentApplications.css"
import { useStudentApplications }       from "./studentapplication.queries"
import { useDebounce }                  from "../../components/hooks/useDebounce"
import type { Application, ApplicationStatus } from "./studentapplication.api"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  pending:  { label: "Pending",  bg: "bg-warning-subtle", text: "text-warning", icon: <Clock        size={12} /> },
  accepted: { label: "Accepted", bg: "bg-info-subtle",    text: "text-info",    icon: <CheckCircle2 size={12} /> },
  approved: { label: "Approved", bg: "bg-success-subtle", text: "text-success", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Rejected", bg: "bg-danger-subtle",  text: "text-danger",  icon: <XCircle      size={12} /> },
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["pending"]
  return (
    <span className={`badge d-inline-flex align-items-center gap-1 fw-normal ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

// ─── Confirm dialog (replaces window.confirm) ─────────────────────────────────
interface ConfirmDialogProps {
  action:      "accept" | "approve" | "reject"
  application: Application
  onConfirm:   (reason?: string) => void
  onCancel:    () => void
  isLoading:   boolean
  error:       string | null
}

const ACTION_CFG = {
  accept:  { title: "Accept Application",  desc: "This will move the application to Accepted status.", btn: "Accept",  variant: "btn-info"    },
  approve: { title: "Approve Application", desc: "This will fully approve the application.",           btn: "Approve", variant: "btn-success" },
  reject:  { title: "Reject Application",  desc: "This will reject the application permanently.",      btn: "Reject",  variant: "btn-danger"  },
}

function ConfirmDialog({ action, application, onConfirm, onCancel, isLoading, error }: ConfirmDialogProps) {
  const [reason, setReason] = useState("")
  const cfg = ACTION_CFG[action]

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel() }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{cfg.title}</h5>
            <button className="btn-close" onClick={onCancel} disabled={isLoading} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-3">{cfg.desc}</p>
            <div className="p-2 bg-light rounded small fw-bold mb-3">
              {application.student_name}
              <span className="text-muted fw-normal ms-2">
                ({application.student_roll_no})
              </span>
            </div>
            {/* Reason is required for rejection */}
            {action === "reject" && (
              <div className="mb-1">
                <label className="form-label small fw-semibold">
                  Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Provide a reason for rejection…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mt-2 mb-0">
                <AlertTriangle size={13} /> {error}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0 gap-2">
            <button className="btn btn-light btn-sm" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
            <button
              className={`btn btn-sm ${cfg.variant} d-flex align-items-center gap-1`}
              onClick={() => onConfirm(reason || undefined)}
              disabled={isLoading || (action === "reject" && !reason.trim())}
            >
              {isLoading
                ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Processing…</>
                : cfg.btn
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
interface DetailModalProps {
  application: Application
  onClose:     () => void
  onAction:    (action: "accept" | "approve" | "reject") => void
  mutatingId:  string | null
}

function DetailModal({ application: app, onClose, onAction, mutatingId }: DetailModalProps) {
  const isMutating = mutatingId === app._id

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <h5 className="d-flex align-items-center gap-2 fw-semibold mb-3 pb-2 border-bottom" style={{ fontSize: 14 }}>
        {icon}{title}
      </h5>
      {children}
    </div>
  )

  const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="mb-2">
      <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div className="fw-medium small">{value || "—"}</div>
    </div>
  )

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header bg-light border-bottom">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white rounded-3 p-2 shadow-sm">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">{app.student_name}</h5>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="text-muted small font-monospace">#{app.student_roll_no}</span>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: "65vh", overflowY: "auto" }}>
            <div className="row g-4">
              {/* Left col */}
              <div className="col-md-6">
                <Section icon={<User size={15} className="text-primary" />} title="Personal Information">
                  <div className="row g-2">
                    <div className="col-6"><Field label="Full Name"    value={app.student_name} /></div>
                    <div className="col-6"><Field label="Father's Name" value={app.father_name} /></div>
                    <div className="col-6"><Field label="Email"        value={app.student_email} /></div>
                    <div className="col-6"><Field label="Mobile"       value={app.student_cellphone} /></div>
                    <div className="col-6"><Field label="CNIC"         value={app.cnic_no} /></div>
                    <div className="col-6"><Field label="WhatsApp"     value={app.active_whatsapp_no} /></div>
                    <div className="col-12"><Field label="Address"     value={app.permanent_address} /></div>
                    <div className="col-6"><Field label="City"         value={app.city} /></div>
                    <div className="col-6"><Field label="Province"     value={app.province} /></div>
                  </div>
                </Section>

                <Section icon={<GraduationCap size={15} className="text-primary" />} title="Academic Information">
                  <div className="row g-2">
                    <div className="col-6"><Field label="Academic Year"   value={app.academic_year} /></div>
                    <div className="col-6"><Field label="Reg. No"         value={app.student_reg_no} /></div>
                    <div className="col-6"><Field label="Date of Birth"   value={app.date_of_birth} /></div>
                    <div className="col-6"><Field label="Gender"          value={app.gender} /></div>
                    <div className="col-6">
                      <Field
                        label="Applied On"
                        value={new Date(app.application_submit_date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      />
                    </div>
                  </div>
                </Section>
              </div>

              {/* Right col */}
              <div className="col-md-6">
                <Section icon={<User size={15} className="text-primary" />} title="Guardian Information">
                  <div className="row g-2">
                    <div className="col-6"><Field label="Guardian Name"  value={app.guardian_name} /></div>
                    <div className="col-6"><Field label="Guardian Phone" value={app.guardian_cellphone} /></div>
                    <div className="col-6"><Field label="Father Phone"   value={app.father_cellphone} /></div>
                  </div>
                </Section>

                <Section icon={<Home size={15} className="text-primary" />} title="Hostel Information">
                  <div className="row g-2">
                    <div className="col-6"><Field label="Room No"       value={app.room_id?.room_no} /></div>
                    <div className="col-6"><Field label="Floor"         value={app.room_id?.floor} /></div>
                    <div className="col-6"><Field label="Block"         value={app.room_id?.block} /></div>
                    <div className="col-6"><Field label="Mess Enabled"  value={app.messEnabled ? "Yes" : "No"} /></div>
                    <div className="col-6"><Field label="Join Date"     value={app.hostelJoinDate} /></div>
                    <div className="col-6"><Field label="Leave Date"    value={app.hostelLeaveDate} /></div>
                  </div>
                </Section>

                {/* Status timeline */}
                <Section icon={<MessageSquare size={15} className="text-primary" />} title="Status">
                  <div className="d-flex flex-column gap-2">
                    {(["pending", "accepted", "approved"] as ApplicationStatus[]).map((s, i) => {
                      const reached = ["pending","accepted","approved","rejected"].indexOf(app.status) >= i || app.status === s
                      const cfg     = STATUS_CFG[s]
                      return (
                        <div key={s} className={`d-flex align-items-center gap-2 small ${reached ? "" : "opacity-25"}`}>
                          <span className={`badge ${cfg.bg} ${cfg.text} d-flex align-items-center gap-1`}>
                            {cfg.icon}{cfg.label}
                          </span>
                          {i < 2 && <div style={{ width: 1, height: 12, background: "var(--bs-border-color)", marginLeft: 6 }} />}
                        </div>
                      )
                    })}
                  </div>
                </Section>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top">
            <button className="btn btn-light btn-sm" onClick={onClose}>Close</button>
            {app.status === "pending" && (
              <>
                <button
                  className="btn btn-info btn-sm d-flex align-items-center gap-1"
                  onClick={() => onAction("accept")}
                  disabled={isMutating}
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  onClick={() => onAction("reject")}
                  disabled={isMutating}
                >
                  <X size={14} /> Reject
                </button>
              </>
            )}
            {app.status === "accepted" && (
              <button
                className="btn btn-success btn-sm d-flex align-items-center gap-1"
                onClick={() => onAction("approve")}
                disabled={isMutating}
              >
                {isMutating
                  ? <Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />
                  : <Check size={14} />
                }
                Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ opacity: 0.5 }}>
      {[60, 140, 100, 100, 90, 60, 70, 60].map((w, i) => (
        <td key={i}>
          <div className="rounded" style={{ height: 12, width: w, background: "var(--bs-border-color)", animation: "pulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Stats cards ──────────────────────────────────────────────────────────────
function StatsSection({ stats, isLoading }: { stats: ReturnType<typeof useStudentApplications>["stats"]; isLoading: boolean }) {
  const cards = [
    { label: "Total",    value: stats?.access?.total  ?? 0, icon: <FileText  size={20} />, cls: "primary"  },
    { label: "Pending",  value: stats?.byStatus?.pending  ?? 0, icon: <Clock     size={20} />, cls: "warning"  },
    { label: "Approved", value: stats?.byStatus?.approved ?? 0, icon: <CheckCircle2 size={20} />, cls: "success" },
    { label: "Rejected", value: stats?.byStatus?.rejected ?? 0, icon: <XCircle  size={20} />, cls: "danger"   },
  ]

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {cards.map(({ label, value, icon, cls }) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
              <h3>{label === "Total" ? "Total Applications" : label}</h3>
              <div className="stat-value">
                {isLoading ? <span className="placeholder col-4 rounded" style={{ minWidth: 40 }} /> : value}
              </div>
              <p className="stat-description">
                {{ Total: "All applications", Pending: "Awaiting decision", Approved: "Fully approved", Rejected: "Applications rejected" }[label]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type PendingAction = { app: Application; action: "accept" | "approve" | "reject" } | null

const StudentApplications: React.FC = () => {
  const {
    applications, total, totalPages, isLoading, error,
    stats, isStatsLoading,
    filters, setFilters,
    updateStatus, mutatingId, mutationError,
  } = useStudentApplications()

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [detailApp,     setDetailApp]     = useState<Application | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [searchInput,   setSearchInput]   = useState("")

  // ── Debounced search ────────────────────────────────────────────────────────
  const applySearch = useDebounce((val: string) => setFilters({ search: val }), 500)

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    applySearch(e.target.value)
  }

  const clearFilters = () => {
    setSearchInput("")
    setFilters({ status: undefined, search: undefined, page: 1 })
  }

  // ── Status transition ───────────────────────────────────────────────────────
  const STATUS_MAP: Record<"accept" | "approve" | "reject", ApplicationStatus> = {
    accept:  "accepted",
    approve: "approved",
    reject:  "rejected",
  }

  const handleConfirmAction = useCallback(
    async (reason?: string) => {
      if (!pendingAction) return
      await updateStatus(pendingAction.app._id, {
        status: STATUS_MAP[pendingAction.action],
        reason,
      })
      setPendingAction(null)
      setDetailApp(null)  // close detail modal after action
    },
    [pendingAction, updateStatus]
  )

  const openAction = useCallback(
    (app: Application, action: "accept" | "approve" | "reject") => {
      setPendingAction({ app, action })
    },
    []
  )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <h2><i className="fas fa-file-alt" /> Student Applications</h2>
        <p>Manage and review student hostel applications</p>
      </div>

      {/* Stats */}
      <StatsSection stats={stats} isLoading={isStatsLoading} />

      {/* Filters */}
      <div className="filters-section">
        <div className="section-card">
          <div className="filters-header">
            <h4 className="section-title">
              <i className="fas fa-filter" /> Filter Applications
            </h4>
          </div>
          <div className="filters-row">
            {/* Search */}
            <div className="filter-group">
              <label className="form-label">Search</label>
              <div className="position-relative">
                <Search
                  size={15}
                  className="position-absolute text-muted"
                  style={{ left: 10, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  className="form-control ps-4"
                  placeholder="Name, roll no, email…"
                  value={searchInput}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Status */}
            <div className="filter-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status ?? "All"}
                onChange={(e) =>
                  setFilters({ status: e.target.value === "All" ? undefined : e.target.value as ApplicationStatus })
                }
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Clear */}
            <div className="filter-group">
              <label className="form-label invisible">Clear</label>
              <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                <X size={15} className="me-1" /> Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mx-3">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="applications-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-list" /> Applications List
            </h3>
            <span className="applications-summary">
              {isLoading ? "Loading…" : `${total} application${total !== 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Roll No</th>
                    <th>Full Name</th>
                    <th className="father-column">Father's Name</th>
                    <th className="guardian-column">Guardian</th>
                    <th className="mobile-column">Mobile</th>
                    <th className="year-column">Year</th>
                    <th className="status-column">Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    : applications.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="no-data">
                          <FileText size={28} className="opacity-50 mb-2" />
                          <div>No applications found</div>
                        </td>
                      </tr>
                    )
                    : applications.map((app) => {
                        const isMutating = mutatingId === app._id
                        return (
                          <tr
                            key={app._id}
                            className="application-row"
                            style={{ opacity: isMutating ? 0.5 : 1, transition: "opacity .2s" }}
                          >
                            <td className="roll-no-cell">
                              <div className="roll-no">{app.student_roll_no}</div>
                            </td>
                            <td className="name-cell">
                              <div className="student-info">
                                <div className="full-name">{app.student_name}</div>
                                <div className="student-email">{app.student_email}</div>
                              </div>
                            </td>
                            <td className="father-cell">{app.father_name}</td>
                            <td className="guardian-cell">{app.guardian_name ?? "—"}</td>
                            <td className="mobile-cell">{app.student_cellphone ?? "—"}</td>
                            <td className="year-cell">{app.academic_year ?? "—"}</td>
                            <td className="status-cell"><StatusBadge status={app.status} /></td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                {/* View */}
                                <button
                                  className="action btn btn-sm btn-view"
                                  title="View Details"
                                  onClick={() => setDetailApp(app)}
                                >
                                  <Eye size={14} />
                                </button>

                                {/* Accept (pending → accepted) */}
                                {app.status === "pending" && (
                                  <button
                                    className="action btn btn-sm btn-assign"
                                    title="Accept"
                                    onClick={() => openAction(app, "accept")}
                                    disabled={isMutating}
                                  >
                                    {isMutating
                                      ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                                      : <Check size={13} />
                                    }
                                  </button>
                                )}

                                {/* Approve (accepted → approved) */}
                                {app.status === "accepted" && (
                                  <button
                                    className="action btn btn-sm btn-assign"
                                    title="Approve"
                                    onClick={() => openAction(app, "approve")}
                                    disabled={isMutating}
                                  >
                                    <CheckCircle2 size={13} />
                                  </button>
                                )}

                                {/* Reject (pending or accepted → rejected) */}
                                {(app.status === "pending" || app.status === "accepted") && (
                                  <button
                                    className="action btn btn-sm btn-delete"
                                    title="Reject"
                                    onClick={() => openAction(app, "reject")}
                                    disabled={isMutating}
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-3 py-3 border-top">
                <span className="small text-muted">Page {filters.page ?? 1} of {totalPages}</span>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={(filters.page ?? 1) <= 1 || isLoading}
                    onClick={() => setFilters({ page: (filters.page ?? 1) - 1 })}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={(filters.page ?? 1) >= totalPages || isLoading}
                    onClick={() => setFilters({ page: (filters.page ?? 1) + 1 })}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailApp && (
        <DetailModal
          application={detailApp}
          onClose={() => setDetailApp(null)}
          onAction={(action) => openAction(detailApp, action)}
          mutatingId={mutatingId}
        />
      )}

      {/* Confirm dialog — stacks on top of detail modal */}
      {pendingAction && (
        <ConfirmDialog
          action={pendingAction.action}
          application={pendingAction.app}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
          isLoading={mutatingId === pendingAction.app._id}
          error={mutationError}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

export default StudentApplications