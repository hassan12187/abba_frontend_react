"use client"

import { useState, useMemo } from "react"
import { 
  Search, MoreHorizontal, Ban, RefreshCw, Mail, 
  IndianRupee, AlertTriangle, CheckCircle2, X 
} from "lucide-react"
import { subscriptions as initialSubscriptions, type Subscription, type SubscriptionStatus } from "./mock-data"

// Mapping to Bootstrap Subtitle/Contextual Colors
const statusConfig: Record<SubscriptionStatus, { color: string; bgColor: string }> = {
  Active: { color: "text-success", bgColor: "bg-success-subtle" },
  Cancelled: { color: "text-danger", bgColor: "bg-danger-subtle" },
  Suspended: { color: "text-warning", bgColor: "bg-warning-subtle" },
}

export function SubscriptionsPanel() {
  const [subs, setSubs] = useState<Subscription[]>(initialSubscriptions)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "All">("All")
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: "suspend" | "renew" | "cancel"
    subscription: Subscription | null
  }>({ open: false, action: "suspend", subscription: null })

  const filteredSubs = useMemo(() => {
    return subs.filter((sub) => {
      const matchesStatus = statusFilter === "All" || sub.status === statusFilter
      const matchesSearch =
        searchQuery === "" ||
        sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.email.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [subs, statusFilter, searchQuery])

  const summaryStats = useMemo(() => {
    const active = subs.filter((s) => s.status === "Active").length
    const suspended = subs.filter((s) => s.status === "Suspended").length
    const revenue = subs.filter((s) => s.status === "Active").reduce((sum, s) => sum + s.monthlyFee, 0)
    return { active, suspended, revenue }
  }, [subs])

  const handleAction = () => {
    if (!confirmDialog.subscription) return
    const id = confirmDialog.subscription.id
    setSubs((prev) =>
      prev.map((sub) => {
        if (sub.id !== id) return sub
        switch (confirmDialog.action) {
          case "suspend": return { ...sub, status: "Suspended" as SubscriptionStatus }
          case "renew": return { ...sub, status: "Active" as SubscriptionStatus }
          case "cancel": return { ...sub, status: "Cancelled" as SubscriptionStatus }
          default: return sub
        }
      })
    )
    setConfirmDialog({ open: false, action: "suspend", subscription: null })
  }

  const actionLabels = {
    suspend: { title: "Suspend Subscription", description: "This will suspend meal access for this student.", button: "Suspend", variant: "btn-warning" },
    renew: { title: "Renew Subscription", description: "This will reactivate meal access for this student.", button: "Renew", variant: "btn-primary" },
    cancel: { title: "Cancel Subscription", description: "This will permanently cancel this subscription. The student will lose all meal access.", button: "Cancel Subscription", variant: "btn-danger" },
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column gap-4">
      {/* Header */}
      <div>
        <h2 className="h4 fw-bold mb-1">Subscriptions</h2>
        <p className="text-muted small">Manage student mess subscriptions and billing</p>
      </div>

      {/* Summary Stats */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card border shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-success-subtle p-3 text-success d-flex align-items-center justify-content-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="small text-muted mb-0 fw-medium">Active</p>
                <h3 className="h4 fw-bold mb-0">{summaryStats.active}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-warning-subtle p-3 text-warning d-flex align-items-center justify-content-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="small text-muted mb-0 fw-medium">Suspended</p>
                <h3 className="h4 fw-bold mb-0">{summaryStats.suspended}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-primary-subtle p-3 text-primary d-flex align-items-center justify-content-center">
                <IndianRupee size={20} />
              </div>
              <div>
                <p className="small text-muted mb-0 fw-medium">Monthly Revenue</p>
                <h3 className="h4 fw-bold mb-0">₹{summaryStats.revenue.toLocaleString("en-IN")}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card border shadow-sm mt-2">
        <div className="card-header bg-white border-bottom-0 pt-4 px-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h5 className="mb-0 fw-bold">All Subscriptions</h5>
              <p className="text-muted small mb-0">{filteredSubs.length} of {subs.length} records</p>
            </div>
            
            <div className="d-flex flex-column flex-sm-row gap-2">
              <div className="position-relative">
                <Search className="position-absolute text-muted" size={16} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="form-control ps-5"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ minWidth: '250px' }}
                />
              </div>
              <div className="btn-group shadow-sm">
                {(["All", "Active", "Suspended", "Cancelled"] as const).map((status) => (
                  <button
                    key={status}
                    className={`btn btn-sm ${statusFilter === status ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0 mt-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4 small text-uppercase text-muted fw-bold">Student</th>
                  <th className="small text-uppercase text-muted fw-bold">Plan</th>
                  <th className="small text-uppercase text-muted fw-bold">Status</th>
                  <th className="small text-uppercase text-muted fw-bold">Fee</th>
                  <th className="small text-uppercase text-muted fw-bold">Room</th>
                  <th className="small text-uppercase text-muted fw-bold">Valid Until</th>
                  <th className="pe-4 text-end"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 text-center text-muted">No subscriptions found</td>
                  </tr>
                ) : (
                  filteredSubs.map((sub) => {
                    const config = statusConfig[sub.status]
                    return (
                      <tr key={sub.id}>
                        <td className="ps-4">
                          <div className="fw-bold">{sub.studentName}</div>
                          <div className="text-muted small font-monospace">{sub.studentId}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border fw-normal">{sub.plan}</span>
                        </td>
                        <td>
                          <span className={`badge border-0 ${config.bgColor} ${config.color} fw-normal`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          {sub.monthlyFee > 0 ? `₹${sub.monthlyFee.toLocaleString("en-IN")}` : <span className="text-muted small">Per meal</span>}
                        </td>
                        <td className="text-muted small">{sub.room}</td>
                        <td className="text-muted small">
                          {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="pe-4 text-end position-relative">
                          <button 
                            className="btn btn-link text-dark p-1"
                            onClick={() => setOpenDropdownId(openDropdownId === sub.id ? null : sub.id)}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {/* Simple Custom Dropdown */}
                          {openDropdownId === sub.id && (
                            <div className="dropdown-menu show shadow border-0 end-0" style={{ right: '1.5rem', top: '2.5rem', zIndex: 1000 }}>
                              <button className="dropdown-item d-flex align-items-center gap-2 small py-2">
                                <Mail size={14} /> Send Email
                              </button>
                              <div className="dropdown-divider"></div>
                              {sub.status === "Active" && (
                                <button className="dropdown-item d-flex align-items-center gap-2 small py-2" onClick={() => setConfirmDialog({ open: true, action: "suspend", subscription: sub })}>
                                  <Ban size={14} /> Suspend
                                </button>
                              )}
                              {(sub.status === "Suspended" || sub.status === "Cancelled") && (
                                <button className="dropdown-item d-flex align-items-center gap-2 small py-2" onClick={() => setConfirmDialog({ open: true, action: "renew", subscription: sub })}>
                                  <RefreshCw size={14} /> Renew
                                </button>
                              )}
                              {sub.status !== "Cancelled" && (
                                <button className="dropdown-item d-flex align-items-center gap-2 small py-2 text-danger" onClick={() => setConfirmDialog({ open: true, action: "cancel", subscription: sub })}>
                                  <Ban size={14} /> Cancel Subscription
                                </button>
                              )}
                            </div>
                          )}
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

      {/* Confirmation Modal */}
      {confirmDialog.open && (
        <>
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title fw-bold">{actionLabels[confirmDialog.action].title}</h5>
                  <button type="button" className="btn-close" onClick={() => setConfirmDialog(p => ({ ...p, open: false }))}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-2">{actionLabels[confirmDialog.action].description}</p>
                  {confirmDialog.subscription && (
                    <div className="p-2 bg-light rounded small fw-bold">
                      {confirmDialog.subscription.studentName} ({confirmDialog.subscription.studentId})
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button className="btn btn-light btn-sm" onClick={() => setConfirmDialog(p => ({ ...p, open: false }))}>Go Back</button>
                  <button className={`btn btn-sm ${actionLabels[confirmDialog.action].variant}`} onClick={handleAction}>
                    {actionLabels[confirmDialog.action].button}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}