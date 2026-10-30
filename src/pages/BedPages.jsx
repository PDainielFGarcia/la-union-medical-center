import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { admissionsApi, bedsApi, patientsApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { ErrorState } from '../components/ui/ErrorState'
import { Input, Select, Textarea } from '../components/ui/FormFields'
import { LoadingState } from '../components/ui/LoadingState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Table } from '../components/ui/Table'
import { PatientInfoCard } from '../components/PatientInfoCard'
import { useAsync } from '../hooks/useAsync'
import { usePolling } from '../hooks/usePolling'
import { useAuth } from '../auth/AuthContext'
import { ADMISSION_PRIORITIES, ADMISSION_STATUSES, BED_MANUAL_STATUSES, BED_STATUSES, ROLES, ROOM_TYPES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime, titleCaseStatus } from '../utils/format'

const bedTone = {
  available: 'border-emerald-200 bg-emerald-50',
  occupied: 'border-red-200 bg-red-50',
  reserved: 'border-amber-200 bg-amber-50',
  cleaning: 'border-slate-200 bg-slate-50',
  maintenance: 'border-orange-200 bg-orange-50',
  unavailable: 'border-slate-300 bg-slate-100',
}

const UNDO_FALLBACK_MS = 24 * 60 * 60 * 1000

function useCanManageBeds() {
  const { user } = useAuth()
  return [ROLES.ADMINISTRATOR, ROLES.OPD_STAFF].includes(user.role)
}

/** Uses the API's can_undo flag; falls back to recent admitted/discharged rows if the flag is missing. */
function canUndoAdmission(row) {
  if (typeof row.can_undo === 'boolean') return row.can_undo
  if (row.undo_used) return false
  if (!['admitted', 'discharged'].includes(row.status)) return false
  const stamp = row.status === 'discharged' ? row.discharged_at : row.admitted_at
  return stamp ? Date.now() - new Date(stamp).getTime() < UNDO_FALLBACK_MS : false
}

function ReadOnlyNote() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-4 text-sm text-blue-900">
      View only. Bed assignments, transfers, and discharges are handled by Admission staff.
    </div>
  )
}

/** Loads a patient with patientsApi.get and shows their details in a modal. */
function PatientInfoModal({ patientId, onClose }) {
  const [patient, setPatient] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!patientId) return undefined
    let cancelled = false
    setPatient(null)
    setError('')
    patientsApi.get(patientId)
      .then((result) => { if (!cancelled) setPatient(result) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
    return () => { cancelled = true }
  }, [patientId])

  return (
    <Modal
      open={Boolean(patientId)}
      title="Patient Information"
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {patientId ? <Link to={`/patient-records/${patientId}`}><Button>Open Full Record</Button></Link> : null}
        </>
      )}
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!patient && !error ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {patient ? <PatientInfoCard patient={patient} compact /> : null}
    </Modal>
  )
}

function BedStatusModal({ bed, onClose, onSaved }) {
  const [mode, setMode] = useState('status')
  const [status, setStatus] = useState('available')
  const [reservedFor, setReservedFor] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)

  function review() {
    setError('')
    if (mode === 'reserve' && !reservedFor.trim()) {
      setError('Enter who the bed is reserved for.')
      return
    }
    setConfirm({
      title: mode === 'reserve' ? `Reserve bed ${bed.bed_number}?` : `Change status of bed ${bed.bed_number}?`,
      message: mode === 'reserve'
        ? `Reserve bed ${bed.bed_number} (${bed.ward} · ${bed.room}) for ${reservedFor.trim()}?`
        : `Change bed ${bed.bed_number} (${bed.ward} · ${bed.room}) from ${titleCaseStatus(bed.status)} to ${titleCaseStatus(status)}?`,
      confirmLabel: mode === 'reserve' ? 'Reserve' : 'Change status',
      run: async () => {
        if (mode === 'reserve') await bedsApi.reserve(bed.id, { reserved_for: reservedFor, notes: notes || null })
        else await bedsApi.setStatus(bed.id, { status, notes: notes || null })
        onSaved()
        onClose()
      },
    })
  }

  if (!bed) return null
  const occupied = bed.status === 'occupied'
  return (
    <>
      <Modal
        open
        title={`Bed ${bed.bed_number}`}
        onClose={onClose}
        footer={<><Button variant="secondary" onClick={onClose}>{occupied ? 'Close' : 'Cancel'}</Button>{occupied ? null : <Button onClick={review}>Save</Button>}</>}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{bed.ward} · {bed.room} · currently <strong>{titleCaseStatus(bed.status)}</strong></p>
          {occupied ? (
            <p className="text-sm text-amber-700">Occupied by {bed.patient_name}. Discharge or transfer the patient from Admissions to free this bed.</p>
          ) : (
            <>
              <Select label="Action" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="status">Change status</option>
                {bed.status === 'available' ? <option value="reserve">Reserve</option> : null}
              </Select>
              {mode === 'status' ? (
                <Select label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {BED_MANUAL_STATUSES.map((item) => <option key={item} value={item}>{titleCaseStatus(item)}</option>)}
                </Select>
              ) : (
                <Input label="Reserved for *" value={reservedFor} onChange={(e) => setReservedFor(e.target.value)} placeholder="Patient name or note" />
              )}
              <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </Modal>
      <ConfirmModal action={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}

export function BedOverviewPage() {
  const canManage = useCanManageBeds()
  const [wardId, setWardId] = useState('')
  const [status, setStatus] = useState('all')
  const [roomType, setRoomType] = useState('all')
  const [editing, setEditing] = useState(null)
  const [infoPatientId, setInfoPatientId] = useState(null)
  const wards = useAsync(() => bedsApi.wards(), [])
  const { data, loading, error, reload } = useAsync(
    () => bedsApi.list({ status, room_type: roomType, ...(wardId ? { ward_id: wardId } : {}) }),
    [wardId, status, roomType],
  )
  usePolling(reload)
  usePolling(wards.reload)
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  const all = (wards.data || []).flatMap((w) => w.beds)
  const counts = BED_STATUSES.reduce((acc, key) => ({ ...acc, [key]: all.filter((b) => b.status === key).length }), {})

  return (
    <div>
      <PageHeader title="Bed Overview" subtitle={`${all.length} beds across ${(wards.data || []).length} wards`} />
      {!canManage ? <ReadOnlyNote /> : null}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        {BED_STATUSES.map((key) => <StatCard key={key} label={titleCaseStatus(key)} value={counts[key] || 0} />)}
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={wardId} onChange={(e) => setWardId(e.target.value)} aria-label="Ward">
          <option value="">All Wards</option>
          {(wards.data || []).map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
        </Select>
        <Select value={roomType} onChange={(e) => setRoomType(e.target.value)} aria-label="Room type">
          <option value="all">All Room Types</option>
          {ROOM_TYPES.map((item) => <option key={item} value={item}>{titleCaseStatus(item)}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All Statuses</option>
          {BED_STATUSES.map((item) => <option key={item} value={item}>{titleCaseStatus(item)}</option>)}
        </Select>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {(data || []).map((bed) => {
          const content = (
            <>
              <p className="font-semibold">{bed.bed_number}</p>
              <p className="text-xs text-slate-500">{bed.ward} · {bed.room}</p>
              <Badge className="mt-2" status={bed.status} />
              <p className="text-sm mt-2 truncate">{bed.patient_name || bed.reserved_for || '—'}</p>
            </>
          )
          return (
            <div
              key={bed.id}
              className={`rounded-xl border-2 p-3 transition-all duration-150 cursor-pointer hover:shadow-xl hover:scale-[1.04] hover:z-10 hover:ring-4 hover:ring-blue-400/70 hover:border-blue-600 hover:bg-blue-50 ${bedTone[bed.status] || 'border-slate-200 bg-white'}`}
            >
              {canManage ? (
                <button type="button" onClick={() => setEditing(bed)} className="block w-full text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">{content}</button>
              ) : content}
              {bed.current_patient_id ? (
                <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => setInfoPatientId(bed.current_patient_id)}>Patient Info</Button>
              ) : null}
            </div>
          )
        })}
      </div>
      <BedStatusModal key={editing?.id ?? 'none'} bed={editing} onClose={() => setEditing(null)} onSaved={() => { reload({ silent: true }); wards.reload({ silent: true }) }} />
      <PatientInfoModal patientId={infoPatientId} onClose={() => setInfoPatientId(null)} />
    </div>
  )
}

export function WardsPage() {
  const canManage = useCanManageBeds()
  const [infoPatientId, setInfoPatientId] = useState(null)
  const { data, loading, error, reload } = useAsync(() => bedsApi.wards(), [])
  usePolling(reload)
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Wards & Patients" subtitle="Which patient is in which ward, room, and bed" />
      {!canManage ? <ReadOnlyNote /> : null}
      <div className="grid lg:grid-cols-2 gap-4">
        {data.map((ward) => (
          <Card key={ward.id}>
            <div className="flex justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">{ward.name}</h2>
                <p className="text-sm text-slate-500">
                  {ward.by_room_type.map((t) => `${t.total} ${t.room_type}`).join(' · ')} — {ward.total} beds
                </p>
              </div>
              <p className="text-sm">Occupancy <strong>{ward.occupancy}%</strong></p>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4 text-center text-sm">
              <div><p className="text-xl font-bold text-emerald-600">{ward.available}</p><p className="text-slate-500">Available</p></div>
              <div><p className="text-xl font-bold text-red-600">{ward.occupied}</p><p className="text-slate-500">Occupied</p></div>
              <div><p className="text-xl font-bold text-amber-600">{ward.reserved}</p><p className="text-slate-500">Reserved</p></div>
              <div><p className="text-xl font-bold text-slate-500">{ward.unavailable}</p><p className="text-slate-500">Unavailable</p></div>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {ward.beds.filter((bed) => bed.status === 'occupied' || bed.status === 'reserved').map((bed) => (
                  <tr key={bed.id} className="border-t">
                    <td className="py-1.5 font-medium">{bed.bed_number}</td>
                    <td className="py-1.5 text-slate-500">{bed.room}</td>
                    <td className="py-1.5">{bed.patient_name || bed.reserved_for}</td>
                    <td className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bed.current_patient_id ? <Button size="sm" variant="ghost" onClick={() => setInfoPatientId(bed.current_patient_id)}>Info</Button> : null}
                        <Badge status={bed.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!ward.occupied && !ward.reserved ? <p className="text-sm text-slate-400">No patients in this ward.</p> : null}
          </Card>
        ))}
      </div>
      <PatientInfoModal patientId={infoPatientId} onClose={() => setInfoPatientId(null)} />
    </div>
  )
}

function BedPicker({ onPick, onCancel, title }) {
  const wards = useAsync(() => bedsApi.wards(), [])
  const [wardId, setWardId] = useState('')
  const ward = (wards.data || []).find((w) => String(w.id) === wardId) || (wards.data || [])[0]
  const free = (ward?.beds || []).filter((b) => ['available', 'reserved'].includes(b.status))
  return (
    <Modal open title={title} onClose={onCancel}>
      <div className="space-y-3">
        <Select label="Ward" value={ward ? String(ward.id) : ''} onChange={(e) => setWardId(e.target.value)}>
          {(wards.data || []).map((w) => <option key={w.id} value={w.id}>{w.name} ({w.available} available)</option>)}
        </Select>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {free.map((bed) => (
            <Button key={bed.id} variant="secondary" className="justify-between" onClick={() => onPick({ ...bed, ward: bed.ward || ward?.name })}>
              <span>{bed.bed_number}</span>
              <span className="text-xs text-slate-400">{bed.status === 'reserved' ? 'Rsv' : bed.type}</span>
            </Button>
          ))}
        </div>
        {!free.length ? <p className="text-sm text-slate-500">No free beds in this ward.</p> : null}
      </div>
    </Modal>
  )
}

function bedLabel(bed) {
  return `${bed.ward ? `${bed.ward} · ` : ''}${bed.bed_number}`
}

export function BedAssignmentPage() {
  const canManage = useCanManageBeds()
  const admissions = useAsync(() => admissionsApi.list({ status: 'waiting_for_bed' }), [])
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [infoPatientId, setInfoPatientId] = useState(null)
  usePolling(admissions.reload)

  function pick(bed) {
    const admission = selected
    setConfirm({
      title: 'Assign bed?',
      message: `Assign ${admission.patient_name} to ${bedLabel(bed)}?`,
      confirmLabel: 'Assign',
      run: async () => {
        await admissionsApi.assign(admission.id, bed.id)
        setSelected(null)
        await admissions.reload({ silent: true })
      },
    })
  }

  if (admissions.loading && !admissions.data) return <LoadingState />
  if (admissions.error && !admissions.data) return <ErrorState message={admissions.error} onRetry={admissions.reload} />
  const waiting = admissions.data || []

  return (
    <div>
      <PageHeader title="Patients Waiting for a Bed" subtitle="Admissions created without a bed yet" />
      {!canManage ? <ReadOnlyNote /> : null}
      <Card>
        <Table
          rows={waiting}
          empty="No patients waiting for a bed."
          columns={[
            { key: 'admission_number', label: 'ADMISSION' },
            { key: 'patient_name', label: 'PATIENT', render: (row) => <div><p>{row.patient_name}</p><p className="text-xs text-slate-400">{row.patient_number}</p></div> },
            { key: 'priority', label: 'PRIORITY', render: (row) => <Badge tone={row.priority === 'Normal' ? 'neutral' : 'danger'}>{row.priority}</Badge> },
            { key: 'reason', label: 'REASON' },
            { key: 'waiting_since', label: 'SINCE' },
            { key: 'actions', label: '', render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="!bg-slate-700 !text-white hover:!bg-slate-800 border-slate-700" onClick={() => setInfoPatientId(row.patient_id)}>Patient info</Button>
                {canManage ? <Button size="sm" onClick={() => setSelected(row)}>Assign Bed</Button> : null}
              </div>
            ) },
          ]}
        />
      </Card>
      {selected ? <BedPicker title={`Assign bed — ${selected.patient_name}`} onCancel={() => setSelected(null)} onPick={pick} /> : null}
      <ConfirmModal action={confirm} onClose={() => setConfirm(null)} />
      <PatientInfoModal patientId={infoPatientId} onClose={() => setInfoPatientId(null)} />
    </div>
  )
}

const emptyAdmission = { patient_id: '', priority: 'Normal', reason: '', bed: null }

export function AdmissionsPage() {
  const canManage = useCanManageBeds()
  const [status, setStatus] = useState('admitted')
  const { data, loading, error, reload } = useAsync(() => admissionsApi.list({ status }), [status])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyAdmission)
  const [patientQuery, setPatientQuery] = useState('')
  const [picking, setPicking] = useState(null)
  const [discharging, setDischarging] = useState(null)
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [infoPatientId, setInfoPatientId] = useState(null)
  const patients = useAsync(() => (patientQuery.length >= 2 ? patientsApi.list({ q: patientQuery }) : Promise.resolve([])), [patientQuery])
  usePolling(reload)

  async function create() {
    setFormError('')
    if (!form.patient_id) {
      setFormError('Select a registered patient. Register them first in Patient Registration if needed.')
      return
    }
    try {
      await admissionsApi.create({ patient_id: form.patient_id, priority: form.priority, reason: form.reason || null, bed_id: form.bed?.id })
      setOpen(false)
      setForm(emptyAdmission)
      setPatientQuery('')
      reload({ silent: true })
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  function requestTransfer(row, bed) {
    const isTransfer = Boolean(row.bed_id)
    setConfirm({
      title: isTransfer ? 'Transfer patient?' : 'Assign bed?',
      message: isTransfer
        ? `Transfer ${row.patient_name} from ${row.ward} · ${row.bed_number} to ${bedLabel(bed)}? The old bed will be marked for cleaning.`
        : `Assign ${row.patient_name} to ${bedLabel(bed)}?`,
      confirmLabel: isTransfer ? 'Transfer' : 'Assign',
      run: async () => {
        await admissionsApi.assign(row.id, bed.id)
        setPicking(null)
        await reload({ silent: true })
      },
    })
  }

  function requestDischarge() {
    const row = discharging
    const notes = dischargeNotes
    setConfirm({
      title: 'Confirm discharge',
      message: `Discharge ${row.patient_name} (${row.admission_number})? The bed will be marked for cleaning.`,
      confirmLabel: 'Discharge',
      variant: 'danger',
      run: async () => {
        await admissionsApi.discharge(row.id, { discharge_notes: notes || null })
        setDischarging(null)
        setDischargeNotes('')
        await reload({ silent: true })
      },
    })
  }

  function requestUndo(row) {
    setConfirm({
      title: 'Undo last action?',
      message: `Undo the last ${row.status === 'discharged' ? 'discharge' : row.bed_number ? 'bed assignment / transfer' : 'action'} for ${row.patient_name} (${row.admission_number})? Undo can only be used once per admission.`,
      confirmLabel: 'Undo',
      run: async () => {
        await admissionsApi.undo(row.id)
        await reload({ silent: true })
      },
    })
  }

  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  const selectedPatient = (patients.data || []).find((p) => p.id === form.patient_id)

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle="Admit, transfer, and discharge patients"
        actions={canManage ? <Button onClick={() => setOpen(true)}>Admit Patient</Button> : null}
      />
      {!canManage ? <ReadOnlyNote /> : null}
      <Card>
        <div className="mb-4 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            {ADMISSION_STATUSES.map((item) => <option key={item} value={item}>{titleCaseStatus(item)}</option>)}
            <option value="all">All</option>
          </Select>
        </div>
        <Table
          rows={data || []}
          columns={[
            { key: 'admission_number', label: 'ADMISSION' },
            { key: 'patient_name', label: 'PATIENT', render: (row) => <div><p>{row.patient_name}</p><p className="text-xs text-slate-400">{row.patient_number}</p></div> },
            { key: 'ward', label: 'WARD / BED', render: (row) => row.bed_number ? `${row.ward} · ${row.bed_number}` : '—' },
            { key: 'priority', label: 'PRIORITY' },
            { key: 'admitted_at', label: 'ADMITTED', render: (row) => formatDateTime(row.admitted_at) },
            { key: 'discharged_at', label: 'DISCHARGED', render: (row) => row.discharged_at ? formatDateTime(row.discharged_at) : '—' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
            { key: 'actions', label: '', render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="!bg-slate-700 !text-white hover:!bg-slate-800 border-slate-700"
                  onClick={() => setInfoPatientId(row.patient_id)}
                >
                  Patient info
                </Button>
                {canManage && row.status !== 'discharged' ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setPicking(row)}>{row.bed_id ? 'Transfer' : 'Assign Bed'}</Button>
                    <Button size="sm" variant="danger" onClick={() => setDischarging(row)}>Discharge</Button>
                  </>
                ) : null}
                {canManage && canUndoAdmission(row) ? <Button size="sm" variant="ghost" onClick={() => requestUndo(row)}>Undo</Button> : null}
              </div>
            ) },
          ]}
        />
      </Card>

      <Modal open={open} title="Admit Patient" onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Admit</Button></>}>
        <div className="space-y-3">
          <Input label="Find patient (name, ID, PhilHealth)" value={patientQuery} onChange={(e) => { setPatientQuery(e.target.value); setForm({ ...form, patient_id: '' }) }} />
          {!form.patient_id && (patients.data || []).length ? (
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {patients.data.map((p) => (
                <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50" onClick={() => setForm({ ...form, patient_id: p.id })}>
                  {p.full_name} <span className="text-xs text-slate-400">{p.patient_id} · {p.age} y/o</span>
                </button>
              ))}
            </div>
          ) : null}
          {selectedPatient ? <p className="text-sm text-emerald-700">Selected: {selectedPatient.full_name} ({selectedPatient.patient_id})</p> : null}
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {ADMISSION_PRIORITIES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Input label="Reason / referring clinic" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPicking('new')}>{form.bed ? 'Change bed' : 'Choose bed now'}</Button>
            <span className="text-sm text-slate-600">{form.bed ? `${form.bed.ward} · ${form.bed.bed_number}` : 'No bed yet — patient will wait for a bed'}</span>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </div>
      </Modal>

      {picking ? (
        <BedPicker
          title={picking === 'new' ? 'Choose bed' : `${picking.bed_id ? 'Transfer' : 'Assign bed'} — ${picking.patient_name}`}
          onCancel={() => setPicking(null)}
          onPick={(bed) => {
            if (picking === 'new') {
              setForm({ ...form, bed })
              setPicking(null)
            } else {
              requestTransfer(picking, bed)
            }
          }}
        />
      ) : null}

      <Modal open={Boolean(discharging)} title={discharging ? `Discharge ${discharging.patient_name}` : ''} onClose={() => setDischarging(null)} footer={<><Button variant="secondary" onClick={() => setDischarging(null)}>Cancel</Button><Button variant="danger" onClick={requestDischarge}>Discharge</Button></>}>
        <p className="text-sm text-slate-600 mb-3">The bed will be marked for cleaning.</p>
        <Textarea label="Discharge notes (administrative)" rows={3} value={dischargeNotes} onChange={(e) => setDischargeNotes(e.target.value)} />
      </Modal>

      <ConfirmModal action={confirm} onClose={() => setConfirm(null)} />
      <PatientInfoModal patientId={infoPatientId} onClose={() => setInfoPatientId(null)} />
    </div>
  )
}

export function BedHistoryPage() {
  const [date, setDate] = useState('')
  const { data, loading, error, reload } = useAsync(() => bedsApi.events(date ? { date } : {}), [date])
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Bed History" subtitle="Assignments, transfers, releases, and status changes" />
      <Card>
        <div className="mb-4 max-w-xs">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        </div>
        <Table
          rows={data || []}
          columns={[
            { key: 'created_at', label: 'TIMESTAMP', render: (row) => formatDateTime(row.created_at) },
            { key: 'bed_number', label: 'BED', render: (row) => `${row.bed_number} · ${row.ward}` },
            { key: 'event_type', label: 'EVENT', render: (row) => titleCaseStatus(row.event_type) },
            { key: 'patient_name', label: 'PATIENT', render: (row) => row.patient_name || '—' },
            { key: 'performed_by', label: 'BY' },
            { key: 'notes', label: 'NOTES', render: (row) => row.notes || '—' },
          ]}
        />
      </Card>
    </div>
  )
}
