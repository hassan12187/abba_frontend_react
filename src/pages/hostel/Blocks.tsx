"use client"

import React, { useState, useCallback, type ChangeEvent, type FormEvent } from "react"
import {
  Building2, Plus, Eye, Pencil, Trash2,
  Loader2, AlertTriangle, ChevronLeft, ChevronRight,
  BedDouble, CheckCircle2, Wrench, HardHat, X,
} from "lucide-react"
import { useDebounce }                from "../../components/hooks/useDebounce"
import { useCustom }                  from "../../Store/Store"
import FilterSection                  from "../../components/reusable/FilterSection"
import InputField                     from "../../components/reusable/InputField"
import SelectField                    from "../../components/reusable/SelectField"
import {
  useBlocks, useBlockDetail, useUpdateBlock,
} from "./hostel.queries"
import type {
  Block, BlockStatus,
  CreateBlockPayload, UpdateBlockPayload,
} from "./hostel.api"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<BlockStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  "ready":              { label: "Ready",              bg: "bg-success-subtle", text: "text-success", icon: <CheckCircle2 size={12} /> },
  "maintenance":        { label: "Maintenance",        bg: "bg-warning-subtle", text: "text-warning", icon: <Wrench       size={12} /> },
  "under construction": { label: "Under Construction", bg: "bg-danger-subtle",  text: "text-danger",  icon: <HardHat      size={12} /> },
}

function StatusBadge({ status }: { status: BlockStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["maintenance"]
  return (
    <span className={`badge d-inline-flex align-items-center gap-1 fw-normal ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ opacity: 0.5 }}>
      {[80, 70, 80, 60].map((w, i) => (
        <td key={i} style={{ textAlign: "center" }}>
          <div className="rounded mx-auto" style={{ height: 12, width: w, background: "var(--bs-border-color)", animation: "pulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Block form (create + edit) ───────────────────────────────────────────────
interface BlockFormProps {
  initialValues?: Partial<CreateBlockPayload>
  onSubmit:       (data: CreateBlockPayload) => Promise<void>
  isLoading:      boolean
  error:          string | null
  submitLabel:    string
  onCancel?:      () => void
}

function BlockForm({ initialValues, onSubmit, isLoading, error, submitLabel, onCancel }: BlockFormProps) {
  const [form, setForm] = useState<CreateBlockPayload>({
    block_no:    initialValues?.block_no    ?? "",
    total_rooms: initialValues?.total_rooms ?? 1,
    description: initialValues?.description ?? "",
    status:      initialValues?.status      ?? "under construction",
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: name === "total_rooms" ? Number(value) : value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Block Number <span className="required">*</span></label>
          <input
            type="text" name="block_no" className="form-control"
            value={form.block_no} onChange={handleChange}
            placeholder="e.g. A, B, 1, 2" required disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Total Rooms <span className="required">*</span></label>
          <input
            type="number" name="total_rooms" className="form-control"
            value={form.total_rooms} min={1} onChange={handleChange}
            required disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            type="text" name="description" className="form-control"
            value={form.description} onChange={handleChange}
            placeholder="Optional description" disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status <span className="required">*</span></label>
          <select name="status" className="form-control" value={form.status} onChange={handleChange} required disabled={isLoading}>
            <option value="under construction">Under Construction</option>
            <option value="ready">Ready</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mt-2">
          <AlertTriangle size={13} />{error}
        </div>
      )}

      <div className="form-actions d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading
            ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} /> Saving…</>
            : <><Plus size={14} /> {submitLabel}</>
          }
        </button>
        {onCancel && (
          <button type="button" className="btn btn-light border" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// ─── View / Edit modal ────────────────────────────────────────────────────────
function BlockModal({
  blockId,
  token,
  onClose,
}: {
  blockId: string
  token:   string
  onClose: () => void
}) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const { data: block, isLoading, error } = useBlockDetail(blockId, token)
  const updateBlock = useUpdateBlock(token)

  const handleUpdate = async (payload: UpdateBlockPayload) => {
    await updateBlock.mutateAsync({ id: blockId, payload })
    setMode("view")
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-content" style={{ maxWidth: 560, width: "95%" }}>
        <div className="modal-header">
          <h3 className="modal-title d-flex align-items-center gap-2">
            <Building2 size={18} className="text-primary" />
            {isLoading ? "Loading…" : `Block ${block?.block_no}`}
          </h3>
          <div className="d-flex align-items-center gap-2">
            {!isLoading && block && mode === "view" && (
              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setMode("edit")}>
                <Pencil size={13} /> Edit
              </button>
            )}
            <button onClick={onClose}><i className="fas fa-times" /></button>
          </div>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="d-flex justify-content-center py-4">
              <Loader2 size={24} className="text-muted" style={{ animation: "spin .8s linear infinite" }} />
            </div>
          ) : error || !block ? (
            <div className="alert alert-danger small">{(error as Error)?.message ?? "Failed to load block."}</div>
          ) : mode === "view" ? (
            <div className="details-grid">
              <p><strong>Block Number:</strong> {block.block_no}</p>
              <p><strong>Total Rooms:</strong>  {block.total_rooms}</p>
              <p><strong>Description:</strong>  {block.description ?? "—"}</p>
              <p><strong>Status:</strong>        <StatusBadge status={block.status} /></p>
              <p><strong>Created:</strong>       {new Date(block.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
          ) : (
            <BlockForm
              initialValues={block}
              onSubmit={handleUpdate}
              isLoading={updateBlock.isPending}
              error={updateBlock.error?.message ?? null}
              submitLabel="Save Changes"
              onCancel={() => setMode("view")}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({
  block,
  onConfirm,
  onCancel,
  isLoading,
  error,
}: {
  block:     Block
  onConfirm: () => void
  onCancel:  () => void
  isLoading: boolean
  error:     string | null
}) {
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
            <h5 className="modal-title fw-bold">Delete Block</h5>
            <button className="btn-close" onClick={onCancel} disabled={isLoading} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-2">
              This will permanently delete this block. All rooms must be removed first.
            </p>
            <div className="p-2 bg-light rounded small fw-bold">Block {block.block_no}</div>
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mt-2 mb-0">
                <AlertTriangle size={13} />{error}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0 gap-2">
            <button className="btn btn-light btn-sm" onClick={onCancel} disabled={isLoading}>Cancel</button>
            <button
              className="btn btn-danger btn-sm d-flex align-items-center gap-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />Deleting…</>
                : <><Trash2 size={13} />Delete</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const Blocks: React.FC = () => {
  const { token } = useCustom() as { token: string }

  const {
    data, isLoading, error,
    stats: statsQuery,
    createBlock, updateBlock, deleteBlock,
    filters, setFilters,
  } = useBlocks()

  const stats = statsQuery.data

  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<Block | null>(null)
  const [searchInput,   setSearchInput]   = useState("")
  const [showCreateForm,setShowCreateForm]= useState(false)

  const applySearch = useDebounce((val: string) => setFilters({ search: val }), 500)

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    applySearch(e.target.value)
  }

  const handleCreate = useCallback(async (payload: CreateBlockPayload) => {
    await createBlock.mutateAsync(payload)
    setShowCreateForm(false)
  }, [createBlock])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    await deleteBlock.mutateAsync(deleteTarget._id)
    setDeleteTarget(null)
  }, [deleteTarget, deleteBlock])

  const blocks = data?.data ?? []
  const total  = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="rooms-page">
      <div className="page-header">
        <h2><i className="fas fa-building" /> Blocks Management</h2>
        <p>Manage hostel blocks and their rooms</p>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon"><Building2 size={20} /></div>
            <div className="stat-content">
              <h3>Total Blocks</h3>
              <div className="stat-value">{statsQuery.isLoading ? "—" : stats?.total ?? 0}</div>
              <p className="stat-description">All blocks</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
            <div className="stat-content">
              <h3>Ready</h3>
              <div className="stat-value">{statsQuery.isLoading ? "—" : stats?.byStatus?.ready ?? 0}</div>
              <p className="stat-description">Available for use</p>
            </div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon"><BedDouble size={20} /></div>
            <div className="stat-content">
              <h3>Total Rooms</h3>
              <div className="stat-value">{statsQuery.isLoading ? "—" : stats?.totalRooms ?? 0}</div>
              <p className="stat-description">Across all blocks</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><Wrench size={20} /></div>
            <div className="stat-content">
              <h3>Maintenance</h3>
              <div className="stat-value">{statsQuery.isLoading ? "—" : stats?.byStatus?.maintenance ?? 0}</div>
              <p className="stat-description">Under maintenance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      <div className="room-form-section">
        <div className="section-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="section-title mb-0">
              <i className="fas fa-plus-circle" /> Add New Block
            </h4>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => setShowCreateForm((p) => !p)}
            >
              {showCreateForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> New Block</>}
            </button>
          </div>
          {showCreateForm && (
            <BlockForm
              onSubmit={handleCreate}
              isLoading={createBlock.isPending}
              error={createBlock.error?.message ?? null}
              submitLabel="Add Block"
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterSection heading="Filter Blocks">
        <InputField
          type="text" name="search"
          value={searchInput} onChange={handleSearch}
          placeholder="Search by block number…"
        />
        <SelectField
          name="status"
          value={filters.status ?? ""}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setFilters({ status: e.target.value as BlockStatus || undefined })
          }
        >
          <option value="">All Status</option>
          <option value="ready">Ready</option>
          <option value="under construction">Under Construction</option>
          <option value="maintenance">Maintenance</option>
        </SelectField>
      </FilterSection>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mx-3">
          <AlertTriangle size={14} />{error}
        </div>
      )}

      {/* Table */}
      <div className="rooms-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title"><i className="fas fa-list" /> Blocks List</h3>
            <span className="text-muted small">
              {isLoading ? "Loading…" : `${total} block${total !== 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="rooms-table text-center">
                <thead>
                  <tr>
                    <th>Block No</th>
                    <th>Total Rooms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    : blocks.length === 0
                    ? (
                      <tr><td colSpan={4} className="no-data">No blocks found</td></tr>
                    )
                    : blocks.map((block) => (
                      <tr key={block._id} className="room-row">
                        <td className="room-no-cell">
                          <div className="room-info">
                            <div className="room-number">{block.block_no}</div>
                            {block.description && (
                              <div className="room-floor" style={{ fontSize: 11 }}>{block.description}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: "bold" }}>{block.total_rooms}</td>
                        <td><StatusBadge status={block.status} /></td>
                        <td className="actions-cell">
                          <div className="action-buttons justify-content-center">
                            <button
                              className="action btn btn-sm btn-view"
                              title="View"
                              onClick={() => setSelectedId(block._id)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="action btn btn-sm btn-delete"
                              title="Delete"
                              onClick={() => setDeleteTarget(block)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-3 py-3 border-top">
                <span className="small text-muted">Page {filters.page ?? 1} of {totalPages}</span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={(filters.page ?? 1) <= 1 || isLoading}
                    onClick={() => setFilters({ page: (filters.page ?? 1) - 1 })}>
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={(filters.page ?? 1) >= totalPages || isLoading}
                    onClick={() => setFilters({ page: (filters.page ?? 1) + 1 })}>
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View/Edit modal */}
      {selectedId && (
        <BlockModal blockId={selectedId} token={token} onClose={() => setSelectedId(null)} />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          block={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteBlock.isPending}
          error={deleteBlock.error?.message ?? null}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

export default Blocks