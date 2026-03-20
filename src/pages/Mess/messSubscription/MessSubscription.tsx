"use client"

import { useState, useMemo } from "react"
import {
  Search, MoreHorizontal, Ban, RefreshCw, Mail,
  IndianRupee, AlertTriangle, CheckCircle2, Loader2,
} from "lucide-react"
import { useMessSubscriptions } from "./MessSubscription.queries"
import type { Subscription, SubscriptionStatus } from "./messSubscription.api"

const statusConfig: Record<SubscriptionStatus, { color: string; bgColor: string }> = {
  Active:    { color: "text-success", bgColor: "bg-success-subtle" },
  Cancelled: { color: "text-danger",  bgColor: "bg-danger-subtle"  },
  Suspended: { color: "text-warning", bgColor: "bg-warning-subtle" },
}

const actionLabels = {
  suspend: { title: "Suspend Subscription", description: "This will suspend meal access for this student.",                                                        button: "Suspend",             variant: "btn-warning", newStatus: "Suspended" as SubscriptionStatus },
  renew:   { title: "Renew Subscription",   description: "This will reactivate meal access for this student.",                                                     button: "Renew",               variant: "btn-primary", newStatus: "Active"    as SubscriptionStatus },
  cancel:  { title: "Cancel Subscription",  description: "This will permanently cancel this subscription. The student will lose all meal access.", button: "Cancel Subscription", variant: "btn-danger",  newStatus: "Cancelled" as SubscriptionStatus },
}

type ActionKey = keyof typeof actionLabels

export function SubscriptionsPanel() {
  const {
    subscriptions,
    stats,
    totalRecords,
    isLoading,
    isStatsLoading,
    error,
    mutationError,       // ← new: server rejection from React Query
    actionLoading,
    filters,
    setFilters,
    updateStatus,
  } = useMessSubscriptions()

  const [searchQuery,    setSearchQuery]    = useState("")
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [confirmDialog,  setConfirmDialog]  = useState<{
    open: boolean; action: ActionKey; subscription: Subscription | null
  }>({ open: false, action: "suspend", subscription: null })

  const filteredSubs = useMemo(() => {
    if (!searchQuery) return subscriptions
    const q = searchQuery.toLowerCase()
    return subscriptions.filter(
      (sub) =>
        sub.student.name.toLowerCase().includes(q)   ||
        sub.student.rollNo.toLowerCase().includes(q) ||
        sub.student.email.toLowerCase().includes(q)
    )
  }, [subscriptions, searchQuery])

  const activeCount    = stats?.byStatus?.Active    ?? 0
  const suspendedCount = stats?.byStatus?.Suspended ?? 0
  const revenue        = stats?.revenue?.totalMonthlyRevenue ?? 0

  const handleConfirmAction = async () => {
    if (!confirmDialog.subscription) return
    try {
      await updateStatus(confirmDialog.subscription._id, {
        status: actionLabels[confirmDialog.action].newStatus,
      })
      setConfirmDialog({ open: false, action: "suspend", subscription: null })
    } catch {
      // mutationError from the hook surfaces the message automatically
    }
  }

  const openDialog = (action: ActionKey, sub: Subscription) => {
    setOpenDropdownId(null)
    setConfirmDialog({ open: true, action, subscription: sub })
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column gap-4">

      <div>
        <h2 className="h4 fw-bold mb-1">Subscriptions</h2>
        <p className="text-muted small">Manage student mess subscriptions and billing</p>
      </div>

      {/* Fetch error */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {/* Stats */}
      <div className="row g-3">
        <StatCard icon={<CheckCircle2 size={20} />} iconClass="bg-success-subtle text-success" label="Active"          value={isStatsLoading ? "—" : activeCount} />
        <StatCard icon={<AlertTriangle size={20} />} iconClass="bg-warning-subtle text-warning" label="Suspended"       value={isStatsLoading ? "—" : suspendedCount} />
        <StatCard icon={<IndianRupee  size={20} />} iconClass="bg-primary-subtle text-primary" label="Monthly Revenue" value={isStatsLoading ? "—" : `₹${revenue.toLocaleString("en-IN")}`} />
      </div>

      {/* Table */}
      <div className="card border shadow-sm mt-2">
        <div className="card-header bg-white border-bottom-0 pt-4 px-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h5 className="mb-0 fw-bold">All Subscriptions</h5>
              <p className="text-muted small mb-0">
                {isLoading ? "Loading…" : `${filteredSubs.length} of ${totalRecords} records`}
              </p>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2">
              <div className="position-relative">
                <Search className="position-absolute text-muted" size={16} style={{ left:"12px", top:"50%", transform:"translateY(-50%)" }} />
                <input className="form-control ps-5" placeholder="Search students…" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} style={{ minWidth:"250px" }} />
              </div>
              <div className="btn-group shadow-sm">
                {(["All","Active","Suspended","Cancelled"] as const).map((s) => (
                  <button key={s}
                    className={`btn btn-sm ${filters.status === s ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setFilters({ status: s })}
                  >{s}</button>
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
                  <th className="small text-uppercase text-muted fw-bold">Valid Until</th>
                  <th className="pe-4 text-end"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className={j === 0 ? "ps-4" : ""}>
                          <div className="rounded" style={{ height:14, width: j===0?140:80, background:"var(--bs-border-color)", opacity:.5, animation:"pulse 1.4s ease-in-out infinite" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredSubs.length === 0 ? (
                  <tr><td colSpan={6} className="py-5 text-center text-muted">No subscriptions found</td></tr>
                ) : (
                  filteredSubs.map((sub) => {
                    const cfg        = statusConfig[sub.status]
                    const isMutating = actionLoading === sub._id
                    return (
                      <tr key={sub._id} style={{ opacity: isMutating ? 0.5 : 1, transition:"opacity .2s" }}>
                        <td className="ps-4">
                          <div className="fw-bold">{sub.student.name}</div>
                          <div className="text-muted small font-monospace">{sub.student.rollNo}</div>
                          <div className="text-muted small">{sub.student.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border fw-normal">
                            {sub.planType === "Pay_Per_Meal" ? "Pay Per Meal" : sub.planType}
                          </span>
                        </td>
                        <td>
                          <span className={`badge border-0 ${cfg.bgColor} ${cfg.color} fw-normal`}>{sub.status}</span>
                        </td>
                        <td>
                          {sub.monthlyFee > 0
                            ? `₹${sub.monthlyFee.toLocaleString("en-IN")}`
                            : <span className="text-muted small">Per meal</span>}
                        </td>
                        <td className="text-muted small">
                          {sub.validUntil
                            ? new Date(sub.validUntil).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
                            : "—"}
                        </td>
                        <td className="pe-4 text-end position-relative">
                          {isMutating ? (
                            <Loader2 size={18} className="text-muted" style={{ animation:"spin .8s linear infinite" }} />
                          ) : (
                            <button className="btn btn-link text-dark p-1"
                              onClick={() => setOpenDropdownId(openDropdownId === sub._id ? null : sub._id)}>
                              <MoreHorizontal size={18} />
                            </button>
                          )}
                          {openDropdownId === sub._id && (
                            <div className="dropdown-menu show shadow border-0"
                              style={{ position:"absolute", right:"1.5rem", top:"2.5rem", zIndex:1000 }}>
                              <button className="dropdown-item d-flex align-items-center gap-2 small py-2">
                                <Mail size={14} /> Send Email
                              </button>
                              <div className="dropdown-divider" />
                              {sub.status === "Active" && (
                                <button className="dropdown-item d-flex align-items-center gap-2 small py-2"
                                  onClick={() => openDialog("suspend", sub)}>
                                  <Ban size={14} /> Suspend
                                </button>
                              )}
                              {(sub.status === "Suspended" || sub.status === "Cancelled") && (
                                <button className="dropdown-item d-flex align-items-center gap-2 small py-2"
                                  onClick={() => openDialog("renew", sub)}>
                                  <RefreshCw size={14} /> Renew
                                </button>
                              )}
                              {sub.status !== "Cancelled" && (
                                <button className="dropdown-item d-flex align-items-center gap-2 small py-2 text-danger"
                                  onClick={() => openDialog("cancel", sub)}>
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

      {/* Confirm dialog */}
      {confirmDialog.open && (
        <div className="modal show d-block" tabIndex={-1}
          style={{ backgroundColor:"rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDialog((p) => ({ ...p, open:false })) }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">{actionLabels[confirmDialog.action].title}</h5>
                <button type="button" className="btn-close"
                  onClick={() => setConfirmDialog((p) => ({ ...p, open:false }))} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-2">{actionLabels[confirmDialog.action].description}</p>
                {confirmDialog.subscription && (
                  <div className="p-2 bg-light rounded small fw-bold">
                    {confirmDialog.subscription.student.name} ({confirmDialog.subscription.student.rollNo})
                  </div>
                )}
                {/* React Query surfaces the server error here */}
                {mutationError && (
                  <div className="alert alert-danger mt-3 py-2 small mb-0">
                    {mutationError}
                  </div>
                )}
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button className="btn btn-light btn-sm" disabled={!!actionLoading}
                  onClick={() => setConfirmDialog((p) => ({ ...p, open:false }))}>
                  Go Back
                </button>
                <button className={`btn btn-sm ${actionLabels[confirmDialog.action].variant}`}
                  onClick={handleConfirmAction} disabled={!!actionLoading}>
                  {actionLoading
                    ? <span className="d-flex align-items-center gap-1">
                        <Loader2 size={14} style={{ animation:"spin .8s linear infinite" }} />Processing…
                      </span>
                    : actionLabels[confirmDialog.action].button
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

function StatCard({ icon, iconClass, label, value }: {
  icon: React.ReactNode; iconClass: string; label: string; value: string | number
}) {
  return (
    <div className="col-12 col-md-4">
      <div className="card border shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`rounded-3 p-3 d-flex align-items-center justify-content-center ${iconClass}`}>{icon}</div>
          <div>
            <p className="small text-muted mb-0 fw-medium">{label}</p>
            <h3 className="h4 fw-bold mb-0">{value}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}