"use client"

import React, { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import {
  ArrowLeft, Plus, Trash2, Save, User,
  FileText, Search, X, CheckCircle, AlertCircle, Loader2,
} from "lucide-react"
import { useNavigate }                         from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCustom }                           from "../../Store/Store"
import InputField                              from "../../components/reusable/InputField"
import { FeeInvoiceAPI, type StudentLookup }   from "./feeInvoice.api"
import { invoiceKeys }                         from "./feeInvoice.queries"

// ─── Local types ──────────────────────────────────────────────────────────────
interface LineItem {
  description: string
  amount:      number
}

interface FeeTemplate {
  _id:         string
  name:        string
  totalAmount: number
  category:    string
  frequency:   string
}

interface FormState {
  student_id:   string
  student_name: string
  room_no:      string
  room_id:      string | null
  billingMonth: string
  dueDate:      string
  lineItems:    LineItem[]
}

const EMPTY_FORM: FormState = {
  student_id:   "",
  student_name: "",
  room_no:      "",
  room_id:      null,
  billingMonth: new Date().toISOString().slice(0, 7),
  dueDate:      "",
  lineItems:    [{ description: "Room Rent", amount: 0 }],
}

// ─── Student search result card ───────────────────────────────────────────────
function StudentCard({
  student,
  onConfirm,
}: {
  student:   StudentLookup
  onConfirm: () => void
}) {
  return (
    <div className="card mt-3 border-primary shadow-sm bg-light">
      <div className="card-body d-flex justify-content-between align-items-center p-3">
        <div>
          <h6 className="mb-0 fw-bold text-dark">{student.student_name}</h6>
          <div className="small text-muted">
            Room: <span className="fw-medium text-dark">{student.room_no}</span>
            {" • "}
            Roll No: <span className="fw-medium text-dark">{student.student_roll_no}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-success btn-sm d-flex align-items-center gap-1"
          onClick={onConfirm}
        >
          <CheckCircle size={15} /> Confirm
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const CreateFeeInvoice: React.FC = () => {
  const navigate     = useNavigate()
  const { token }    = useCustom()
  const queryClient  = useQueryClient()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [searchTerm, setSearchTerm] = useState("")
  const [candidate,  setCandidate]  = useState<StudentLookup | null>(null)
  const [formError,  setFormError]  = useState<string | null>(null)

  const totalAmount = form.lineItems.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  // ── Fetch fee templates (cached via React Query) ────────────────────────────
  const { data: templatesData } = useQuery({
    queryKey: ["fee-templates"],
    queryFn:  () => FeeInvoiceAPI.getTemplates(token).then((r) => r.data as FeeTemplate[]),
    staleTime: 60 * 60_000,   // 1 hr — matches server-side Redis TTL
    enabled:   !!token,
  })
  const templates = templatesData ?? []

  // ── Student search ──────────────────────────────────────────────────────────
  const searchMutation = useMutation({
    mutationFn: () => FeeInvoiceAPI.searchStudent(searchTerm.trim(), token).then((r) => r.data),
    onSuccess:  (student) => setCandidate(student),
    onError:    (err: Error) => setCandidate(null),
  })

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return
    setCandidate(null)
    searchMutation.mutate()
  }, [searchTerm, searchMutation])

  const confirmStudent = useCallback(() => {
    if (!candidate) return
    setForm((p) => ({
      ...p,
      student_id:   candidate.student_id,
      student_name: candidate.student_name,
      room_no:      candidate.room_no,
      room_id:      candidate.room_id,
    }))
    setCandidate(null)
    setSearchTerm("")
  }, [candidate])

  const clearStudent = useCallback(() => {
    setForm((p) => ({ ...p, student_id: "", student_name: "", room_no: "", room_id: null }))
    setSearchTerm("")
    setCandidate(null)
  }, [])

  // ── Apply template ──────────────────────────────────────────────────────────
  const applyTemplate = (e: ChangeEvent<HTMLSelectElement>) => {
    const id       = e.target.value
    const template = templates.find((t) => t._id === id)
    if (!template) return
    // Templates store a totalAmount — create a single line item from it
    setForm((p) => ({
      ...p,
      lineItems: [{ description: template.name, amount: template.totalAmount }],
    }))
    // Reset the select back to placeholder
    e.target.value = ""
  }

  // ── Line items ──────────────────────────────────────────────────────────────
  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    setForm((p) => {
      const items = [...p.lineItems]
      items[index] = {
        ...items[index],
        [field]: field === "amount" ? parseFloat(value) || 0 : value,
      }
      return { ...p, lineItems: items }
    })
  }

  const addLineItem = () =>
    setForm((p) => ({ ...p, lineItems: [...p.lineItems, { description: "", amount: 0 }] }))

  const removeLineItem = (index: number) =>
    setForm((p) => ({ ...p, lineItems: p.lineItems.filter((_, i) => i !== index) }))

  // ── Create invoice mutation ─────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      FeeInvoiceAPI.createInvoice(
        {
          student_id:   form.student_id,
          room_id:      form.room_id ?? undefined,
          billingMonth: form.billingMonth,
          dueDate:      new Date(form.dueDate).toISOString(),
          lineItems:    form.lineItems,
        },
        token
      ),
    onSuccess: () => {
      // Invalidate list + stats so they refetch with the new invoice
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all() })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
      navigate(-1)
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    if (!form.student_id) { setFormError("Please search and select a student first."); return }
    if (!form.billingMonth) { setFormError("Billing month is required."); return }
    if (!form.dueDate)      { setFormError("Due date is required."); return }
    if (totalAmount <= 0)   { setFormError("Total amount must be greater than zero."); return }
    if (form.lineItems.some((i) => !i.description.trim())) {
      setFormError("All line items must have a description."); return
    }

    createMutation.mutate()
  }

  const isSubmitting = createMutation.isPending

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0 text-dark">Create New Invoice</h2>
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={18} /> Back to List
        </button>
      </div>

      {/* Global form error */}
      {formError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3">
          <AlertCircle size={15} /> {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">

          {/* ── Left column ── */}
          <div className="col-lg-8">

            {/* Student search */}
            <div className="room-form-section mb-4">
              <div className="section-card shadow-sm bg-white p-4 rounded">
                <h4 className="section-title d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                  <User color="#3498db" size={20} /> Student Details
                </h4>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold text-secondary small mb-1">
                      Search Student by Roll No
                    </label>
                    <div className="d-flex w-100 gap-2">
                      <input
                        type="text"
                        className={`form-control ${form.student_id ? "bg-light" : ""}`}
                        style={{ flex: 1 }}
                        placeholder={form.student_id ? form.student_name : "Enter roll number"}
                        value={form.student_id ? form.student_name : searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!!form.student_id || isSubmitting}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch() } }}
                      />

                      {form.student_id ? (
                        <button
                          className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                          type="button"
                          onClick={clearStudent}
                          title="Remove student"
                          style={{ minWidth: 44 }}
                          disabled={isSubmitting}
                        >
                          <X size={17} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary d-flex align-items-center gap-2 px-3"
                          type="button"
                          onClick={handleSearch}
                          disabled={!searchTerm.trim() || searchMutation.isPending}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {searchMutation.isPending
                            ? <Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} />
                            : <Search size={16} />
                          }
                          Search
                        </button>
                      )}
                    </div>

                    {/* Search error */}
                    {searchMutation.isError && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mt-2 py-2 small">
                        <AlertCircle size={14} />
                        {(searchMutation.error as Error).message}
                      </div>
                    )}

                    {/* Search result */}
                    {candidate && !form.student_id && (
                      <StudentCard student={candidate} onConfirm={confirmStudent} />
                    )}
                  </div>

                  {/* Room — auto-filled */}
                  <div className="col-md-6 mt-3">
                    <InputField
                      type="text"
                      label="Room Number"
                      name="room_no"
                      value={form.room_no}
                      readonly
                      placeholder="Auto-filled on selection"
                    />
                  </div>

                  {/* Billing month */}
                  <div className="col-md-6">
                    <InputField
                      type="month"
                      label="Billing Month"
                      name="billingMonth"
                      value={form.billingMonth}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setForm((p) => ({ ...p, billingMonth: e.target.value }))
                      }
                    />
                  </div>

                  {/* Due date */}
                  <div className="col-md-6">
                    <InputField
                      type="date"
                      label="Due Date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setForm((p) => ({ ...p, dueDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="room-form-section">
              <div className="section-card shadow-sm bg-white p-4 rounded">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h4 className="section-title mb-0 d-flex align-items-center gap-2">
                    <FileText color="#3498db" size={20} /> Fee Breakdown
                  </h4>

                  {/* Template picker — populated from API */}
                  <div style={{ minWidth: 200 }}>
                    <select
                      className="form-select form-select-sm"
                      onChange={applyTemplate}
                      disabled={isSubmitting || templates.length === 0}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {templates.length === 0 ? "Loading templates…" : "Load from template…"}
                      </option>
                      {templates.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} — ₹{t.totalAmount.toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-borderless align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60%" }}>Description</th>
                        <th style={{ width: "30%" }}>Amount (₹)</th>
                        <th style={{ width: "10%" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {form.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Room Rent"
                              value={item.description}
                              onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                              disabled={isSubmitting}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control text-end"
                              placeholder="0"
                              min="0"
                              step="0.01"
                              value={item.amount === 0 ? "" : item.amount}
                              onChange={(e) => updateLineItem(idx, "amount", e.target.value)}
                              disabled={isSubmitting}
                              required
                            />
                          </td>
                          <td className="text-center">
                            {form.lineItems.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeLineItem(idx)}
                                disabled={isSubmitting}
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-1 d-flex align-items-center gap-1"
                  onClick={addLineItem}
                  disabled={isSubmitting}
                >
                  <Plus size={15} /> Add Fee Item
                </button>
              </div>
            </div>
          </div>

          {/* ── Right column — summary ── */}
          <div className="col-lg-4 mt-4 mt-lg-0">
            <div
              className="section-card shadow-sm bg-white p-4 rounded sticky-top"
              style={{ top: 20 }}
            >
              <h4 className="section-title mb-3 border-bottom pb-2">Payment Summary</h4>

              {/* Line item breakdown */}
              {form.lineItems.map((item, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-1 text-secondary small">
                  <span className="text-truncate me-2">{item.description || `Item ${idx + 1}`}</span>
                  <span className="text-nowrap fw-medium">
                    ₹{(Number(item.amount) || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}

              <hr className="my-3" />

              <div className="d-flex justify-content-between mb-1 text-secondary small">
                <span>Total Items:</span>
                <span>{form.lineItems.length}</span>
              </div>

              <div className="d-flex justify-content-between mb-4">
                <h5 className="fw-bold mb-0">Total Amount:</h5>
                <h4 className="fw-bold text-primary mb-0">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </h4>
              </div>

              {/* Student confirmation chip */}
              {form.student_id && (
                <div className="alert alert-success py-2 small d-flex align-items-center gap-2 mb-3">
                  <CheckCircle size={14} />
                  <span><strong>{form.student_name}</strong> selected</span>
                </div>
              )}

              {/* Server error */}
              {createMutation.isError && (
                <div className="alert alert-danger py-2 small mb-3">
                  {(createMutation.error as Error).message}
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="btn btn-primary py-2 d-flex justify-content-center align-items-center gap-2"
                  disabled={!form.student_id || totalAmount <= 0 || isSubmitting}
                >
                  {isSubmitting
                    ? <><Loader2 size={17} style={{ animation: "spin .8s linear infinite" }} />Generating…</>
                    : <><Save size={17} />Generate Invoice</>
                  }
                </button>
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default CreateFeeInvoice