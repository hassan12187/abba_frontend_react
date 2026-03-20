"use client"

import React, { useState, useCallback } from "react"
import {
  Eye, Plus, Calendar, CreditCard,
  CheckCircle, AlertCircle, Clock,
  Loader2, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react"
import { useNavigate }    from "react-router-dom"
import { useFeeInvoice }  from "./feeInvoice.queries"
import { useInvoiceDetail } from "./feeInvoice.queries"
import { useCustom }      from "../../Store/Store"
import type { Invoice, InvoiceStatus, PaymentMethod, AddPaymentPayload } from "./feeInvoice.api"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  InvoiceStatus,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  Paid:             { bg: "bg-success-subtle", text: "text-success",    icon: <CheckCircle  size={13} /> },
  "Partially Paid": { bg: "bg-warning-subtle", text: "text-warning",    icon: <Clock        size={13} /> },
  Pending:          { bg: "bg-primary-subtle", text: "text-primary",    icon: <Clock        size={13} /> },
  Overdue:          { bg: "bg-danger-subtle",  text: "text-danger",     icon: <AlertCircle  size={13} /> },
  Cancelled:        { bg: "bg-secondary-subtle",text:"text-secondary",  icon: null                       },
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG["Pending"]
  return (
    <span className={`badge d-inline-flex align-items-center gap-1 fw-normal ${c.bg} ${c.text}`}>
      {c.icon}{status}
    </span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ opacity: 0.55 }}>
      {[120, 100, 60, 70, 70, 60, 70, 80, 70, 60].map((w, i) => (
        <td key={i} className={i === 0 ? "ps-4" : ""}>
          <div className="rounded" style={{ height: 13, width: w, background: "var(--bs-border-color)", animation: "pulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats, isLoading }: { stats: ReturnType<typeof useFeeInvoice>["stats"]; isLoading: boolean }) {
  const cards = [
    { label: "Total Revenue",    value: stats ? `₹${stats.totalRevenue.toLocaleString("en-IN")}`    : "—", color: "bg-success-subtle text-success" },
    { label: "Outstanding",      value: stats ? `₹${stats.totalOutstanding.toLocaleString("en-IN")}` : "—", color: "bg-danger-subtle text-danger"   },
    { label: "Overdue Invoices", value: stats ? stats.overdueCount                                   : "—", color: "bg-warning-subtle text-warning" },
    { label: "Collection Rate",  value: stats ? `${stats.collectionRate}%`                           : "—", color: "bg-primary-subtle text-primary" },
  ]
  return (
    <div className="row g-3 mb-4 px-3">
      {cards.map(({ label, value, color }) => (
        <div key={label} className="col-6 col-md-3">
          <div className={`card border-0 shadow-sm h-100 ${color}`}>
            <div className="card-body py-3">
              <p className="small mb-1 fw-medium opacity-75">{label}</p>
              <p className="h5 fw-bold mb-0">
                {isLoading ? <span className="placeholder col-6 rounded" /> : value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Payment modal ────────────────────────────────────────────────────────────
interface PaymentModalProps {
  invoice:   Invoice
  onClose:   () => void
  onConfirm: (p: AddPaymentPayload) => Promise<void>
  isLoading: boolean
  serverError: string | null
}

function PaymentModal({ invoice, onClose, onConfirm, isLoading, serverError }: PaymentModalProps) {
  const [amount,  setAmount]  = useState((Math.round(invoice.balanceDue * 100) / 100).toString())
  const [method,  setMethod]  = useState<PaymentMethod>("Cash")
  const [note,    setNote]    = useState("")
  const [localErr,setLocalErr]= useState<string | null>(null)

  const handleSubmit = async () => {
    const val = parseFloat(amount)
    if (!amount || isNaN(val) || val <= 0) { setLocalErr("Enter a valid amount."); return }
    if (val > invoice.balanceDue)          { setLocalErr(`Cannot exceed balance due of ₹${invoice.balanceDue.toLocaleString("en-IN")}.`); return }
    setLocalErr(null)
    const rounded = Math.round(val * 100) / 100
    await onConfirm({ amount: rounded, paymentMethod: method, note: note.trim() || undefined })
  }

  const error = localErr ?? serverError

  return (
    <div className="modal show d-block" tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose() }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Add Payment</h5>
            <button className="btn-close" onClick={onClose} disabled={isLoading} />
          </div>
          <div className="modal-body px-4">
            {/* Invoice ref */}
            <div className="p-2 bg-light rounded small mb-3">
              <span className="fw-bold">{invoice.invoiceNumber}</span>
              <span className="text-muted ms-2">— {invoice.student_name}</span>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Amount (₹) *</label>
              <input type="number" className="form-control" value={amount} min={0.01}
                max={invoice.balanceDue} step={0.01} autoFocus
                onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
              <div className="form-text">Balance due: <strong>₹{invoice.balanceDue.toLocaleString("en-IN")}</strong></div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Payment Method</label>
              <select className="form-select" value={method} disabled={isLoading}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Note (optional)</label>
              <input type="text" className="form-control" placeholder="e.g. Receipt #1234"
                value={note} onChange={(e) => setNote(e.target.value)} disabled={isLoading} />
            </div>
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-0">
                <AlertTriangle size={13} />{error}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 px-4 pb-4 pt-0 gap-2">
            <button className="btn btn-outline-secondary flex-grow-1" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              onClick={handleSubmit} disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} />Processing…</>
                : <><CreditCard size={16} />Confirm Payment</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────
function InvoiceDetailView({
  invoiceId, token, onBack, onAddPayment, paymentLoading,
}: {
  invoiceId:      string
  token:          string
  onBack:         () => void
  onAddPayment:   (inv: Invoice) => void
  paymentLoading: string | null
}) {
  const { data: invoice, isLoading, error } = useInvoiceDetail(invoiceId, token)
  const isMutating = paymentLoading === invoiceId

  if (isLoading) return (
    <div className="d-flex justify-content-center py-5">
      <Loader2 size={28} className="text-muted" style={{ animation: "spin .8s linear infinite" }} />
    </div>
  )
  if (error || !invoice) return (
    <div className="alert alert-danger mx-3">{(error as Error)?.message ?? "Failed to load invoice."}</div>
  )

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 py-md-5">
      <div className="container" style={{ maxWidth: 850 }}>
        <button type="button" onClick={onBack}
          className="btn btn-outline-secondary mb-4 d-flex align-items-center gap-2">
          ← Back to Invoices
        </button>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-4 px-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
              <div>
                <h2 className="h4 fw-bold mb-2">{invoice.invoiceNumber}</h2>
                <div className="text-muted small">
                  <p className="mb-1"><span className="fw-bold">Student:</span> {invoice.student_name}</p>
                  <p className="mb-1"><span className="fw-bold">Room:</span> {invoice.room_no ?? "No Room"}</p>
                  <p className="mb-1"><span className="fw-bold">Billing Month:</span> {invoice.billingMonth}</p>
                  <p className="mb-0"><span className="fw-bold">Due Date:</span>{" "}
                    {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="card-body p-4">
            {/* Line items */}
            <h3 className="h6 fw-bold text-uppercase text-muted mb-3">Charges</h3>
            <div className="list-group border rounded mb-5">
              {invoice.lineItems.map((item, idx) => (
                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <span className="text-secondary">{item.description}</span>
                  <span className="fw-bold">₹{item.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="list-group-item d-flex justify-content-between align-items-center bg-primary bg-opacity-10 py-3 fw-bold">
                <span>Total Amount</span>
                <span className="text-primary">₹{invoice.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Summary cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="bg-light rounded p-3 h-100">
                  <p className="small text-muted mb-1">Total Amount</p>
                  <p className="h5 fw-bold mb-0">₹{invoice.totalAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-success bg-opacity-10 rounded p-3 h-100">
                  <p className="small text-success mb-1">Total Paid</p>
                  <p className="h5 fw-bold mb-0 text-success">₹{invoice.totalPaid.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className={`col-md-4`}>
                <div className={`rounded p-3 h-100 ${invoice.balanceDue > 0 ? "bg-danger bg-opacity-10" : "bg-success bg-opacity-10"}`}>
                  <p className="small text-muted mb-1">Balance Due</p>
                  <p className={`h5 fw-bold mb-0 ${invoice.balanceDue > 0 ? "text-danger" : "text-success"}`}>
                    ₹{invoice.balanceDue.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {invoice.status !== "Cancelled" && (
              <div className="d-flex flex-wrap gap-3 pt-3 border-top">
                <button className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => onAddPayment(invoice)}
                  disabled={invoice.status === "Paid" || isMutating}>
                  {isMutating ? <Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} /> : <Plus size={16} />}
                  Add Payment
                </button>
                <button className="btn btn-outline-success d-flex align-items-center gap-2"
                  onClick={() => onAddPayment({ ...invoice, balanceDue: invoice.balanceDue })}
                  disabled={invoice.balanceDue === 0 || isMutating}>
                  <CheckCircle size={16} /> Mark as Fully Paid
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const FeeInvoiceUI: React.FC = () => {
  const navigate = useNavigate()
  const { token } = useCustom()

  const {
    invoices, total, totalPages, isLoading, error,
    stats, isStatsLoading,
    filters, setFilters,
    addPayment, paymentLoading, paymentError,
  } = useFeeInvoice()

  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null)
  const [view,          setView]          = useState<"list" | "detail">("list")

  const openDetail = useCallback((inv: Invoice) => {
    setSelectedId(inv._id)
    setView("detail")
  }, [])

  const openPayment = useCallback((inv: Invoice) => {
    setPaymentTarget(inv)
  }, [])

  const handleConfirmPayment = useCallback(async (payload: AddPaymentPayload) => {
    if (!paymentTarget) return
    await addPayment(paymentTarget._id, payload)
    setPaymentTarget(null)
  }, [paymentTarget, addPayment])

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (view === "detail" && selectedId) {
    return (
      <>
        <InvoiceDetailView
          invoiceId={selectedId}
          token={token}
          onBack={() => { setView("list"); setSelectedId(null) }}
          onAddPayment={openPayment}
          paymentLoading={paymentLoading}
        />
        {paymentTarget && (
          <PaymentModal
            invoice={paymentTarget}
            onClose={() => setPaymentTarget(null)}
            onConfirm={handleConfirmPayment}
            isLoading={paymentLoading === paymentTarget._id}
            serverError={paymentError}
          />
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </>
    )
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <h2><i className="fas fa-file-invoice-dollar me-2" />Fee Invoices</h2>
        <p>Manage student invoices and fees</p>
      </div>

      <StatsBar stats={stats} isLoading={isStatsLoading} />

      {/* Top bar */}
      <div className="room-form-section">
        <div className="section-card d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div className="d-flex flex-wrap gap-2">
            {/* Status filter */}
            <select className="form-select form-select-sm" style={{ minWidth: 160 }}
              value={filters.status ?? "All"}
              onChange={(e) => setFilters({ status: e.target.value as Invoice["status"] | "All" })}>
              {["All", "Pending", "Partially Paid", "Paid", "Overdue", "Cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Billing month */}
            <input type="month" className="form-control form-control-sm" style={{ minWidth: 160 }}
              value={filters.billingMonth ?? ""}
              onChange={(e) => setFilters({ billingMonth: e.target.value || undefined })} />

            {/* Sort */}
            <select className="form-select form-select-sm" style={{ minWidth: 160 }}
              value={`${filters.sortBy ?? "createdAt"}-${filters.sortOrder ?? "desc"}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-") as [typeof filters.sortBy, typeof filters.sortOrder]
                setFilters({ sortBy, sortOrder })
              }}>
              <option value="createdAt-desc">Newest first</option>
              <option value="createdAt-asc">Oldest first</option>
              <option value="dueDate-asc">Due date ↑</option>
              <option value="dueDate-desc">Due date ↓</option>
              <option value="totalAmount-desc">Amount ↓</option>
              <option value="totalAmount-asc">Amount ↑</option>
            </select>
          </div>

          <button className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            onClick={() => navigate("/create/fee-invoice")}>
            <Calendar size={16} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mx-3">
          <AlertTriangle size={15} />{error}
        </div>
      )}

      {/* Table */}
      <div className="p-3">
        <div className="card border shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted fw-medium">
              {isLoading ? "Loading…" : `${total} invoice${total !== 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4 small text-uppercase text-muted fw-bold">Invoice No.</th>
                  <th className="small text-uppercase text-muted fw-bold">Student</th>
                  <th className="small text-uppercase text-muted fw-bold">Room</th>
                  <th className="small text-uppercase text-muted fw-bold">Month</th>
                  <th className="small text-uppercase text-muted fw-bold">Total</th>
                  <th className="small text-uppercase text-muted fw-bold">Paid</th>
                  <th className="small text-uppercase text-muted fw-bold">Balance</th>
                  <th className="small text-uppercase text-muted fw-bold">Status</th>
                  <th className="small text-uppercase text-muted fw-bold">Due</th>
                  <th className="pe-4 text-end small text-uppercase text-muted fw-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : invoices.length === 0
                  ? <tr><td colSpan={10} className="text-center py-5 text-muted">No invoices found</td></tr>
                  : invoices.map((inv) => {
                    const isMutating = paymentLoading === inv._id
                    return (
                      <tr key={inv._id} style={{ opacity: isMutating ? 0.5 : 1, transition: "opacity .2s" }}>
                        <td className="ps-4 font-monospace small fw-bold">{inv.invoiceNumber}</td>
                        <td className="fw-medium">{inv.student_name}</td>
                        <td className="text-muted small">{inv.room_no ?? "—"}</td>
                        <td className="text-muted small">{inv.billingMonth}</td>
                        <td className="fw-medium">₹{inv.totalAmount.toLocaleString("en-IN")}</td>
                        <td className="text-success fw-medium">₹{inv.totalPaid.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={inv.balanceDue > 0 ? "text-danger fw-medium" : "text-muted"}>
                            ₹{inv.balanceDue.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td><StatusBadge status={inv.status} /></td>
                        <td className="text-muted small">
                          {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="pe-4 text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <button className="btn btn-sm btn-outline-secondary" title="View Details"
                              onClick={() => openDetail(inv)}>
                              <Eye size={14} />
                            </button>
                            {inv.status !== "Paid" && inv.status !== "Cancelled" && (
                              <button className="btn btn-sm btn-outline-primary" title="Add Payment"
                                onClick={() => openPayment(inv)} disabled={isMutating}>
                                {isMutating
                                  ? <Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />
                                  : <Plus size={14} />}
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
            <div className="card-footer bg-white d-flex align-items-center justify-content-between py-3">
              <span className="small text-muted">Page {filters.page} of {totalPages}</span>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={(filters.page ?? 1) <= 1 || isLoading}
                  onClick={() => setFilters({ page: (filters.page ?? 1) - 1 })}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  disabled={(filters.page ?? 1) >= totalPages || isLoading}
                  onClick={() => setFilters({ page: (filters.page ?? 1) + 1 })}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {paymentTarget && (
        <PaymentModal
          invoice={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onConfirm={handleConfirmPayment}
          isLoading={paymentLoading === paymentTarget._id}
          serverError={paymentError}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

export default FeeInvoiceUI