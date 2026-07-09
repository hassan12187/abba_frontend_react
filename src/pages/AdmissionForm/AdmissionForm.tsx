"use client"

import React, {
  useState, useCallback, type ChangeEvent,
  type FormEvent, type ReactNode,
} from "react"
import {
  User, Phone, MapPin, FileUp,
  ChevronRight, ChevronLeft, CheckCircle2,
  Loader2, AlertTriangle, GraduationCap,
  Upload, Check,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  student_roll_no:    string
  academic_year:      string
  student_name:       string
  father_name:        string
  cnic_no:            string
  date_of_birth:      string
  gender:             string
  student_email:      string
  student_cellphone:  string
  active_whatsapp_no: string
  guardian_name:      string
  guardian_cellphone: string
  postal_address:     string
  permanent_address:  string
  city:               string
  province:           string
  reason_for_applying:string
  student_image:      File | null
  cnic_image:         File | null
}

type FieldErrors = Partial<Record<keyof FormData, string>>

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:8000/api"

async function submitApplication(data: FormData): Promise<{ message: string }> {
  const fd = new globalThis.FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") fd.append(k, v as any)
  })
  const res  = await fetch(`${BASE}/applications`, { method: "POST", body: fd })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Submission failed.")
  return json
}

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Student Info", icon: <User    size={15}/> },
  { label: "Contact",      icon: <Phone   size={15}/> },
  { label: "Address",      icon: <MapPin  size={15}/> },
  { label: "Documents",    icon: <FileUp  size={15}/> },
]

// ─────────────────────────────────────────────────────────────────────────────
// ALL sub-components are defined HERE — at module scope, outside AdmissionForm.
// If defined inside AdmissionForm, React treats them as new types on every
// render and unmounts+remounts them, which destroys input focus on every keystroke.
// ─────────────────────────────────────────────────────────────────────────────

const inputCss = (hasError?: string, focused?: boolean): React.CSSProperties => ({
  padding: "10px 13px", borderRadius: 11, width: "100%",
  border: `1.5px solid ${hasError ? "var(--red)" : focused ? "var(--accent)" : "var(--border)"}`,
  background: "var(--input-bg)", color: "var(--text-pri)",
  fontSize: 13, outline: "none", transition: "border-color .2s",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
})

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ id, label, required, error, children }: {
  id: string; label: string; required: boolean|undefined; error: string|undefined; children: ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label htmlFor={id} style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {label}
        {required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
          <AlertTriangle size={10}/>{error}
        </span>
      )}
    </div>
  )
}

// ─── Text input ───────────────────────────────────────────────────────────────
function Input({ id, type = "text", value = "", onChange, placeholder, error, disabled, required, label }: {
  id: string; type?: string; value?: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; error: string|undefined; disabled?: boolean
  required?: boolean; label: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <Field id={id} label={label} required={required} error={error}>
      <input
        id={id} name={id} type={type} value={value}
        onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={inputCss(error, focused)}
      />
    </Field>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
function Select({ id, label, value, onChange, options, error, required, disabled }: {
  id: string; label: string; value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  error: string|undefined; required?: boolean; disabled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <Field id={id} label={label} required={required} error={error}>
      <select
        id={id} name={id} value={value} onChange={onChange} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputCss(error, focused), cursor: "pointer" }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function Textarea({ id, label, value, onChange, placeholder, error, required, disabled, rows = 3 }: {
  id: string; label: string; value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string; error?: string|undefined; required?: boolean|undefined; disabled?: boolean; rows?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <Field id={id} label={label} required={required} error={error}>
      <textarea
        id={id} name={id} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputCss(error, focused), resize: "vertical", minHeight: rows * 28 }}
      />
    </Field>
  )
}

// ─── File tile ────────────────────────────────────────────────────────────────
function FileTile({ id, label, accept, file, onChange, error, required }: {
  id: "student_image" | "cnic_image"; label: string; accept: string
  file: File | null
  onChange: (e: ChangeEvent<HTMLInputElement> | { target: { id: string; files: FileList } }) => void
  error?: string; required?: boolean
}) {
  const [drag, setDrag] = useState(false)
  return (
    <Field id={id} label={label} required={required} error={error}>
      <label
        htmlFor={id}
        onDragOver={e  => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false)
          onChange({ target: { id, files: e.dataTransfer.files } } as any)
        }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 8, padding: "20px 16px",
          borderRadius: 12, cursor: "pointer",
          border: `2px dashed ${drag ? "var(--accent)" : error ? "var(--red)" : file ? "var(--green)" : "var(--border)"}`,
          background: drag ? "var(--accent-lo)" : file ? "rgba(16,185,129,.06)" : "var(--input-bg)",
          transition: "all .2s",
        }}
      >
        {file ? (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,.15)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={18}/>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green)" }}>{file.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {(file.size / 1024).toFixed(1)} KB · Click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-lo)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={16}/>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-sec)" }}>
              Drop file here or click to upload
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{accept.replace(/,/g, " · ")}</div>
          </>
        )}
      </label>
      <input id={id} name={id} type="file" accept={accept} onChange={onChange as any} style={{ display: "none" }} />
    </Field>
  )
}

// ─── Grid helpers ─────────────────────────────────────────────────────────────
// These are simple layout wrappers — safe to define outside since they
// take no dynamic props that would cause identity issues.
function G({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  )
}

// ─── Step progress bar ────────────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const done   = i < current
        const active = i === current
        const isLast = i === total - 1
        return (
          <React.Fragment key={step.label}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: isLast ? "0 0 auto" : 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: done ? "var(--green)" : active ? "var(--accent)" : "var(--input-bg)",
                border: `2px solid ${done ? "var(--green)" : active ? "var(--accent)" : "var(--border)"}`,
                color: done || active ? "#fff" : "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .3s", boxShadow: active ? "0 0 16px var(--accent-glow)" : "none",
              }}>
                {done ? <Check size={16}/> : step.icon}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? "var(--accent)" : done ? "var(--green)" : "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: "0 4px", marginBottom: 24,
                background: i < current ? "var(--green)" : "var(--border)",
                transition: "background .4s", borderRadius: 1,
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-lo)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif" }}>
        {title}
      </span>
    </div>
  )
}

// ─── Step nav buttons ─────────────────────────────────────────────────────────
function StepActions({ step, total, loading, onBack }: {
  step: number; total: number; loading: boolean; onBack: () => void
}) {
  const isLast = step === total - 1
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
      {step > 0 && (
        <button type="button" onClick={onBack} disabled={loading}
          style={{ padding: "10px 22px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-sec)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <ChevronLeft size={15}/> Back
        </button>
      )}
      <button type="submit" disabled={loading}
        style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: loading ? "var(--border)" : "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: loading ? "none" : "0 0 20px var(--accent-glow)" }}>
        {loading
          ? <><Loader2 size={15} style={{ animation: "spin .8s linear infinite" }}/>Submitting…</>
          : isLast
          ? <><CheckCircle2 size={15}/>Submit Application</>
          : <>Next <ChevronRight size={15}/></>
        }
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const AdmissionForm: React.FC = () => {
  const [step,     setStep]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors,   setErrors]   = useState<FieldErrors>({})

  const [form, setForm] = useState<FormData>({
    student_roll_no: "", academic_year: "", student_name: "",
    father_name: "", cnic_no: "", date_of_birth: "", gender: "",
    student_email: "", student_cellphone: "", active_whatsapp_no: "",
    guardian_name: "", guardian_cellphone: "", postal_address: "",
    permanent_address: "", city: "", province: "",
    reason_for_applying: "", student_image: null, cnic_image: null,
  })

  const handleText = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target
    setForm(p => ({ ...p, [id]: value }))
    setErrors(p => { const n = { ...p }; delete (n as any)[id]; return n })
  }, [])

  const handleFile = useCallback((
    e: ChangeEvent<HTMLInputElement> | { target: { id: string; files: FileList } }
  ) => {
    const { id, files } = e.target as any
    if (files?.[0]) {
      setForm(p => ({ ...p, [id]: files[0] }))
      setErrors(p => { const n = { ...p }; delete (n as any)[id]; return n })
    }
  }, [])

  function validateStep(s: number): FieldErrors {
    const e: FieldErrors = {}
    const req = (k: keyof FormData, msg = "This field is required.") => {
      if (!form[k]) (e as any)[k] = msg
    }
    if (s === 0) {
      req("student_roll_no"); req("academic_year"); req("student_name")
      req("father_name"); req("gender"); req("date_of_birth"); req("student_email")
      if (form.student_email && !/\S+@\S+\.\S+/.test(form.student_email))
        e.student_email = "Please enter a valid email address."
      if (form.cnic_no && !/^\d{5}-\d{7}-\d$/.test(form.cnic_no))
        e.cnic_no = "Format: xxxxx-xxxxxxx-x"
    }
    if (s === 1) {
      req("student_cellphone"); req("active_whatsapp_no")
      req("guardian_name"); req("guardian_cellphone")
      const ph = /^\d{11}$/
      if (form.student_cellphone  && !ph.test(form.student_cellphone))  e.student_cellphone  = "Must be 11 digits."
      if (form.guardian_cellphone && !ph.test(form.guardian_cellphone)) e.guardian_cellphone = "Must be 11 digits."
      if (form.active_whatsapp_no && !ph.test(form.active_whatsapp_no)) e.active_whatsapp_no = "Must be 11 digits."
    }
    if (s === 2) {
      req("postal_address"); req("permanent_address"); req("city"); req("province")
    }
    return e
  }

  const handleNext = (e: FormEvent) => {
    e.preventDefault()
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setStep(p => p + 1)
  }

  const handleBack = () => { setStep(p => p - 1); setErrors({}) }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null); setLoading(true)
    try {
      await submitApplication(form)
      setSuccess(true)
    } catch (err: any) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 420, animation: "fadeUp .5s ease" }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(16,185,129,.12)", border: "2px solid rgba(16,185,129,.3)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 30px rgba(16,185,129,.2)" }}>
            <CheckCircle2 size={36}/>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif", margin: "0 0 10px" }}>
            Application Submitted!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, margin: "0 0 24px" }}>
            Your hostel application has been received. The admin will review it and you'll be notified once a decision is made.
          </p>
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
            📧 Check your email at <strong style={{ color: "var(--text-pri)" }}>{form.student_email}</strong> for updates.
          </div>
        </div>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans',sans-serif", padding: "32px 20px" }}>
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 50, height: 50, borderRadius: 16, background: "var(--accent-lo)", border: "1.5px solid rgba(99,102,241,.3)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 20px rgba(99,102,241,.15)" }}>
            <GraduationCap size={22}/>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-pri)", fontFamily: "'DM Serif Display',serif", letterSpacing: "-0.02em" }}>
            Hostel Admission Form
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Complete all sections to submit your hostel application
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 24, padding: "36px 40px", boxShadow: "var(--shadow)" }}>
          <StepBar current={step} total={STEPS.length} />

          {step === 0 && (
            <form onSubmit={handleNext}>
              <SectionHeading icon={<User size={16}/>} title="Student Information" />
              <G>
                <Input id="student_name"    label="Full Name"     value={form.student_name}    onChange={handleText} placeholder="Muhammad Ali"     error={errors.student_name}    required />
                <Input id="father_name"     label="Father's Name" value={form.father_name}     onChange={handleText} placeholder="Muhammad Akbar"   error={errors.father_name}     required />
                <Input id="student_roll_no" label="Roll Number"   value={form.student_roll_no} onChange={handleText} placeholder="2024-CS-101"      error={errors.student_roll_no} required />
                <Input id="academic_year"   label="Academic Year" value={form.academic_year}   onChange={handleText} placeholder="2024-2025"         error={errors.academic_year}   required />
                <Input id="student_email"   label="Email Address" type="email" value={form.student_email} onChange={handleText} placeholder="ali@example.com" error={errors.student_email} required />
                <Input id="cnic_no"         label="CNIC No."      value={form.cnic_no}         onChange={handleText} placeholder="35202-1234567-1"  error={errors.cnic_no} />
                <Input id="date_of_birth"   label="Date of Birth" type="date" value={form.date_of_birth} onChange={handleText} error={errors.date_of_birth} required />
                <Select id="gender" label="Gender" value={form.gender} onChange={handleText as any} error={errors.gender} required
                  options={[{ value:"male", label:"Male" }, { value:"female", label:"Female" }]} />
              </G>
              <StepActions step={step} total={STEPS.length} loading={false} onBack={handleBack} />
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleNext}>
              <SectionHeading icon={<Phone size={16}/>} title="Contact Information" />
              <G>
                <Input id="student_cellphone"  label="Mobile Number"   value={form.student_cellphone}  onChange={handleText} placeholder="03001234567" error={errors.student_cellphone}  required />
                <Input id="active_whatsapp_no" label="WhatsApp Number" value={form.active_whatsapp_no} onChange={handleText} placeholder="03001234567" error={errors.active_whatsapp_no} required />
                <Input id="guardian_name"      label="Guardian Name"   value={form.guardian_name}      onChange={handleText} placeholder="Muhammad Akbar" error={errors.guardian_name}   required />
                <Input id="guardian_cellphone" label="Guardian Contact" value={form.guardian_cellphone} onChange={handleText} placeholder="03001234567" error={errors.guardian_cellphone} required />
              </G>
              <StepActions step={step} total={STEPS.length} loading={false} onBack={handleBack} />
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext}>
              <SectionHeading icon={<MapPin size={16}/>} title="Address Information" />
              <G cols={1}>
                <Textarea id="postal_address"  label="Postal Address"  value={form.postal_address}    onChange={handleText as any} placeholder="Street, Area, City"       error={errors.postal_address}    required />
                <Textarea id="permanent_address" label="Permanent Address" value={form.permanent_address} onChange={handleText as any} placeholder="Village / Town / City"    error={errors.permanent_address} required />
              </G>
              <div style={{ height: 16 }} />
              <G>
                <Input id="city"     label="City"     value={form.city}     onChange={handleText} placeholder="Lahore" error={errors.city}     required />
                <Input id="province" label="Province" value={form.province} onChange={handleText} placeholder="Punjab" error={errors.province} required />
              </G>
              <StepActions step={step} total={STEPS.length} loading={false} onBack={handleBack} />
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <SectionHeading icon={<FileUp size={16}/>} title="Documents & Additional Info" />
              <G>
                <FileTile id="student_image" label="Student Photo" accept="image/*"      file={form.student_image} onChange={handleFile} error={errors.student_image as string} required />
                <FileTile id="cnic_image"    label="CNIC Copy"     accept="image/*,.pdf" file={form.cnic_image}    onChange={handleFile} error={errors.cnic_image    as string} />
              </G>
              <div style={{ height: 16 }} />
              <G cols={1}>
                <Textarea id="reason_for_applying" label="Reason for Applying" value={form.reason_for_applying} onChange={handleText as any} placeholder="Briefly explain why you need hostel accommodation…" rows={4} error={""} />
              </G>

              {apiError && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, background: "rgba(239,68,68,.10)", color: "var(--red)", border: "1px solid rgba(239,68,68,.25)", fontSize: 13 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />{apiError}
                </div>
              )}
              <StepActions step={step} total={STEPS.length} loading={loading} onBack={handleBack} />
            </form>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
          Step {step + 1} of {STEPS.length}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        select option { background: var(--card); color: var(--text-pri); }
        textarea { resize: vertical; }
      `}</style>
    </div>
  )
}

export default AdmissionForm