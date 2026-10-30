import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { catalogApi, doctorsApi, parkingApi, patientsApi, settingsApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { Input, Select, Textarea } from '../components/ui/FormFields'
import { LoadingState } from '../components/ui/LoadingState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Table } from '../components/ui/Table'
import { OtherSelect, resolveOther } from '../components/ui/OtherSelect'
import { CurrentAdmissionBadge, PatientInfoCard } from '../components/PatientInfoCard'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../auth/AuthContext'
import { GUARDIAN_RELATIONSHIPS, QUEUE_STATUSES, ROLES, TRIAGE_SYMPTOMS, VEHICLE_TYPES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime, titleCaseStatus } from '../utils/format'

const emptyPatient = {
  last_name: '', first_name: '', middle_name: '', birthday: '', sex: 'Male', civil_status: 'Single',
  complete_address: '', contact_number: '', nationality: 'Filipino', religion: '', philhealth_number: '',
  spouse_name: '', father_name: '', mother_name: '',
  guardian_name: '', guardian_relationship: GUARDIAN_RELATIONSHIPS[0], guardian_relationship_other: '', guardian_contact: '',
}

const DEFAULT_MINOR_AGE = 18
const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 11)

function ageFromBirthday(birthday) {
  if (!birthday) return null
  const born = new Date(birthday)
  if (Number.isNaN(born.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const beforeBirthday = today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age
}

function isMinorBirthday(birthday, threshold) {
  const age = ageFromBirthday(birthday)
  return age != null && age >= 0 && age < threshold
}

function PatientForm({ form, setForm, errors = {}, minorAge = DEFAULT_MINOR_AGE }) {
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const isMinor = isMinorBirthday(form.birthday, minorAge)
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Input label="Last name *" value={form.last_name} onChange={update('last_name')} error={errors.last_name} />
      <Input label="First name *" value={form.first_name} onChange={update('first_name')} error={errors.first_name} />
      <Input label="Middle name" value={form.middle_name} onChange={update('middle_name')} />
      <Input label="Birthday *" type="date" value={form.birthday} onChange={update('birthday')} error={errors.birthday} />
      <Select label="Sex *" value={form.sex} onChange={update('sex')}>
        <option>Male</option>
        <option>Female</option>
      </Select>
      <Select label="Civil status" value={form.civil_status} onChange={update('civil_status')}>
        {['Single', 'Married', 'Widowed', 'Separated'].map((item) => <option key={item}>{item}</option>)}
      </Select>
      <div className="md:col-span-3">
        <Input label="Complete address *" value={form.complete_address} onChange={update('complete_address')} error={errors.complete_address} />
      </div>
      <Input
        label="Contact number"
        inputMode="numeric"
        maxLength={11}
        placeholder="09171234567"
        hint="Optional — if provided, exactly 11 digits"
        value={form.contact_number}
        onChange={(e) => setForm({ ...form, contact_number: digitsOnly(e.target.value) })}
        error={errors.contact_number}
      />
      <Input label="PhilHealth number" value={form.philhealth_number} onChange={update('philhealth_number')} />
      <Input label="Nationality" value={form.nationality} onChange={update('nationality')} />
      <Input label="Religion" value={form.religion} onChange={update('religion')} />
      <Input label="Spouse name" value={form.spouse_name} onChange={update('spouse_name')} />
      <Input label="Father's name" value={form.father_name} onChange={update('father_name')} />
      <Input label="Mother's name" value={form.mother_name} onChange={update('mother_name')} />
      {isMinor ? (
        <div className="md:col-span-3 grid md:grid-cols-3 gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="md:col-span-3 text-sm font-medium text-amber-800">Patient is under {minorAge} — guardian required</p>
          <Input label="Guardian name *" value={form.guardian_name} onChange={update('guardian_name')} error={errors.guardian_name} />
          <OtherSelect
            label="Relationship *"
            name="guardian_relationship"
            options={GUARDIAN_RELATIONSHIPS}
            value={form.guardian_relationship}
            otherValue={form.guardian_relationship_other}
            onChange={(value) => setForm({ ...form, guardian_relationship: value })}
            onOtherChange={(value) => setForm({ ...form, guardian_relationship_other: value })}
            otherPlaceholder="Specify relationship"
            error={errors.guardian_relationship}
          />
          <Input
            label="Guardian contact *"
            inputMode="numeric"
            maxLength={11}
            placeholder="09171234567"
            hint="Exactly 11 digits"
            value={form.guardian_contact}
            onChange={(e) => setForm({ ...form, guardian_contact: digitsOnly(e.target.value) })}
            error={errors.guardian_contact}
          />
        </div>
      ) : null}
    </div>
  )
}

function validatePatient(form, minorAge = DEFAULT_MINOR_AGE) {
  const errors = {}
  if (!form.last_name.trim()) errors.last_name = 'Required'
  if (!form.first_name.trim()) errors.first_name = 'Required'
  if (!form.birthday) errors.birthday = 'Required'
  if (!form.complete_address.trim()) errors.complete_address = 'Required'
  if (form.contact_number.trim() && !/^\d{11}$/.test(form.contact_number)) errors.contact_number = 'Must be exactly 11 digits'
  if (isMinorBirthday(form.birthday, minorAge)) {
    if (!form.guardian_name.trim()) errors.guardian_name = 'Guardian is required for minors'
    if (!resolveOther(form.guardian_relationship, form.guardian_relationship_other)) errors.guardian_relationship = 'Specify the relationship'
    if (!/^\d{11}$/.test(form.guardian_contact)) errors.guardian_contact = 'Must be exactly 11 digits'
  }
  return errors
}

function buildPatientBody(form, minorAge) {
  const {
    guardian_name: guardianName, guardian_relationship: relationship, guardian_relationship_other: relationshipOther, guardian_contact: guardianContact,
    ...body
  } = form
  body.middle_name = (body.middle_name || '').trim() || null
  body.contact_number = (body.contact_number || '').trim() || null
  if (isMinorBirthday(form.birthday, minorAge)) {
    body.guardian = {
      full_name: guardianName.trim(),
      relationship: resolveOther(relationship, relationshipOther),
      contact_number: guardianContact,
    }
  }
  return body
}

function PatientLookup({ onSelect }) {
  const [q, setQ] = useState('')
  const results = useAsync(() => (q.length >= 2 ? patientsApi.list({ q }) : Promise.resolve([])), [q])
  return (
    <div>
      <Input label="Search existing patient" placeholder="Name, LUMC ID, contact, or PhilHealth number" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 space-y-2">
        {(results.data || []).map((patient) => (
          <button key={patient.id} type="button" className="w-full text-left p-3 rounded-lg border hover:border-blue-400" onClick={() => onSelect(patient)}>
            <p className="font-medium">{patient.full_name} <span className="text-xs text-slate-400">{patient.patient_id}</span></p>
            <p className="text-xs text-slate-500">{patient.age} y/o · {patient.sex} · {patient.complete_address}</p>
          </button>
        ))}
        {q.length >= 2 && !results.loading && !(results.data || []).length ? <p className="text-sm text-slate-500">No match. Register as a new patient.</p> : null}
      </div>
    </div>
  )
}

function emptyScreening() {
  return {
    ...Object.fromEntries(TRIAGE_SYMPTOMS.map(([key]) => [key, false])),
    symptom_duration: '',
    covid_exposure: false,
    notes: '',
  }
}

function emptyVisit() {
  return {
    clinic_id: '',
    reason: '',
    has_vehicle: false,
    plate_number: '',
    vehicle_type: VEHICLE_TYPES[0],
    parking_area_id: '',
    slot_number: '',
    ...emptyScreening(),
  }
}

export function PatientRegistrationPage() {
  const [step, setStep] = useState('choose')
  const [patient, setPatient] = useState(null)
  const [form, setForm] = useState(emptyPatient)
  const [errors, setErrors] = useState({})
  const [visit, setVisit] = useState(emptyVisit)
  const [ticket, setTicket] = useState(null)
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const parkingAreas = useAsync(() => parkingApi.list({ active_only: 1 }), [])
  const settings = useAsync(() => settingsApi.get(), [])
  const minorAge = Number(settings.data?.minor_age_threshold?.years) || DEFAULT_MINOR_AGE

  async function saveNewPatient() {
    const next = validatePatient(form, minorAge)
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const created = await patientsApi.create(buildPatientBody(form, minorAge))
      setPatient(created)
      setStep('visit')
    } catch (err) {
      setErrors({ form: getErrorMessage(err) })
    }
  }

  async function queue() {
    setErrors({})
    if (!visit.clinic_id) {
      setErrors({ clinic_id: 'Select a clinic.' })
      return
    }
    try {
      const body = {
        patient_id: patient.id,
        clinic_id: Number(visit.clinic_id),
        reason: visit.reason || null,
        symptom_duration: visit.symptom_duration || null,
        covid_exposure: Boolean(visit.covid_exposure),
        notes: visit.notes || null,
        ...Object.fromEntries(TRIAGE_SYMPTOMS.map(([key]) => [key, Boolean(visit[key])])),
      }
      if (visit.has_vehicle && visit.plate_number) {
        body.vehicle = { plate_number: visit.plate_number, type: visit.vehicle_type, parking_area_id: visit.parking_area_id ? Number(visit.parking_area_id) : null, slot_number: visit.slot_number || null }
      }
      setTicket(await patientsApi.registerOpd(body))
      setStep('done')
    } catch (err) {
      setErrors({ form: getErrorMessage(err) })
    }
  }

  function reset() {
    setStep('choose')
    setPatient(null)
    setForm(emptyPatient)
    setTicket(null)
    setErrors({})
    setVisit(emptyVisit())
  }

  return (
    <div>
      <PageHeader title="Patient Registration & Hospital Visit" subtitle="Find or register the patient, complete initial screening, then queue them at a clinic" />
      {step === 'choose' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardTitle>Existing Patient</CardTitle>
            <PatientLookup onSelect={(p) => { setPatient(p); setStep('visit') }} />
          </Card>
          <Card>
            <CardTitle>New Patient</CardTitle>
            <p className="text-sm text-slate-500 mb-4">Search first to avoid duplicate records. A LUMC patient ID is assigned automatically.</p>
            <Button onClick={() => setStep('new')}>Register new patient</Button>
          </Card>
        </div>
      ) : null}
      {step === 'new' ? (
        <Card>
          <CardTitle>Patient Information</CardTitle>
          <PatientForm form={form} setForm={setForm} errors={errors} minorAge={minorAge} />
          {errors.form ? <p className="text-sm text-red-600 mt-3">{errors.form}</p> : null}
          <div className="flex gap-2 mt-4">
            <Button onClick={saveNewPatient}>Save & continue</Button>
            <Button variant="secondary" onClick={reset}>Back</Button>
          </div>
        </Card>
      ) : null}
      {step === 'visit' && patient ? (
        <Card>
          <CardTitle>Hospital Visit — {patient.full_name} ({patient.patient_id})</CardTitle>
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="Clinic *" value={visit.clinic_id} onChange={(e) => setVisit({ ...visit, clinic_id: e.target.value })} error={errors.clinic_id}>
              <option value="">Select clinic</option>
              {(clinics.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Reason for visit (administrative)" placeholder="e.g. Check-up, follow-up, referral" value={visit.reason} onChange={(e) => setVisit({ ...visit, reason: e.target.value })} />
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Initial Screening</p>
              <p className="text-xs text-slate-500">Recorded with this hospital visit so doctors and nurses can review it on the patient record.</p>
              <div className="grid grid-cols-2 gap-2">
                {TRIAGE_SYMPTOMS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={Boolean(visit[key])} onChange={(e) => setVisit({ ...visit, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(visit.covid_exposure)} onChange={(e) => setVisit({ ...visit, covid_exposure: e.target.checked })} />
                Recent exposure to a COVID-19 case
              </label>
              <Input label="How long?" placeholder="e.g. 3 days" value={visit.symptom_duration || ''} onChange={(e) => setVisit({ ...visit, symptom_duration: e.target.value })} />
              <Textarea label="Notes for the doctor" rows={2} value={visit.notes || ''} onChange={(e) => setVisit({ ...visit, notes: e.target.value })} />
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={visit.has_vehicle} onChange={(e) => setVisit({ ...visit, has_vehicle: e.target.checked })} />
              Patient came with a vehicle
            </label>
            {visit.has_vehicle ? (
              <div className="md:col-span-2 grid md:grid-cols-4 gap-4 rounded-xl border bg-slate-50 p-4">
                <Input label="Plate number" value={visit.plate_number} onChange={(e) => setVisit({ ...visit, plate_number: e.target.value.toUpperCase() })} />
                <Select label="Type" value={visit.vehicle_type} onChange={(e) => setVisit({ ...visit, vehicle_type: e.target.value })}>
                  {VEHICLE_TYPES.map((item) => <option key={item}>{item}</option>)}
                </Select>
                <Select label="Parking area" value={visit.parking_area_id} onChange={(e) => setVisit({ ...visit, parking_area_id: e.target.value })}>
                  <option value="">Select area</option>
                  {(parkingAreas.data || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
                <Input label="Slot no." value={visit.slot_number} onChange={(e) => setVisit({ ...visit, slot_number: e.target.value })} />
              </div>
            ) : null}
          </div>
          {errors.form ? <p className="text-sm text-red-600 mt-3">{errors.form}</p> : null}
          <div className="flex gap-2 mt-4">
            <Button onClick={queue}>Add to clinic queue</Button>
            <Button variant="secondary" onClick={reset}>Cancel</Button>
          </div>
        </Card>
      ) : null}
      {step === 'done' && ticket ? (
        <Card>
          <p className="text-sm text-slate-500">Queue number</p>
          <p className="text-5xl font-bold text-blue-700 my-2">{ticket.queue_number}</p>
          <p className="text-sm">{ticket.patient_name} · {ticket.clinic}</p>
          {ticket.screened ? <p className="text-xs text-emerald-700 mt-2">Initial screening saved with this hospital visit.</p> : null}
          <div className="flex gap-2 mt-4">
            <Button onClick={reset}>Register another</Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export function PatientSearchPage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => (q.length >= 2 ? patientsApi.list({ q }) : Promise.resolve([])), [q])

  return (
    <div>
      <PageHeader title="Patient Search" subtitle="Search registered patients" />
      <Card>
        <Input label="Search patient" placeholder="Name, LUMC ID, contact, or PhilHealth number…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md mb-4" />
        {loading && data == null ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : q.length < 2 ? (
          <p className="text-sm text-slate-500 py-8 text-center">Type at least 2 characters to search</p>
        ) : (
          <Table
            rows={data || []}
            columns={[
              { key: 'patient_id', label: 'PATIENT ID' },
              { key: 'full_name', label: 'NAME' },
              { key: 'age', label: 'AGE' },
              { key: 'sex', label: 'SEX' },
              { key: 'philhealth_number', label: 'PHILHEALTH' },
              { key: 'actions', label: '', render: (row) => <Button size="sm" variant="secondary" onClick={() => navigate(`/patient-records/${row.id}`)}>View</Button> },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

export function OpdRegistrationPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [clinicId, setClinicId] = useState('')
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const { data, loading, error, reload } = useAsync(() => patientsApi.opdList({ q, status, ...(clinicId ? { clinic_id: clinicId } : {}) }), [q, status, clinicId])
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Today's Hospital Visits" subtitle="Patients who came in today, by clinic, with screening status and whether they have been seen" />
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search name or queue number…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="all">All Statuses</option>
            {QUEUE_STATUSES.map((item) => <option key={item} value={item}>{titleCaseStatus(item)}</option>)}
          </Select>
          <Select value={clinicId} onChange={(e) => setClinicId(e.target.value)} aria-label="Clinic">
            <option value="">All Clinics</option>
            {(clinics.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <p className="text-sm text-slate-500 mb-3">{(data || []).length} patients</p>
        <Table
          rows={data || []}
          columns={[
            { key: 'queue_number', label: 'QUEUE #' },
            { key: 'patient_number', label: 'PATIENT ID' },
            { key: 'patient_name', label: 'NAME' },
            { key: 'age', label: 'AGE' },
            { key: 'clinic', label: 'CLINIC' },
            { key: 'doctor_name', label: 'DOCTOR', render: (row) => row.doctor_name || '—' },
            { key: 'triaged', label: 'SCREENED', render: (row) => row.triaged ? <Badge tone="success">Yes</Badge> : <Badge tone="neutral">No</Badge> },
            { key: 'time', label: 'ARRIVED' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  )
}

export function NurseScreeningPage() {
  const [clinicId, setClinicId] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const doctors = useAsync(() => doctorsApi.list({ on_duty: 1 }), [])
  const { data, loading, reload } = useAsync(() => patientsApi.opdList({ status: 'waiting', ...(clinicId ? { clinic_id: clinicId } : {}) }), [clinicId])

  function open(row) {
    setSelected(row)
    setError('')
    setForm({ ...Object.fromEntries(TRIAGE_SYMPTOMS.map(([key]) => [key, false])), symptom_duration: '', covid_exposure: false, notes: '', doctor_id: row.doctor_id || '' })
  }

  async function save() {
    try {
      await patientsApi.triage(selected.opd_encounter_id, { ...form, doctor_id: form.doctor_id ? Number(form.doctor_id) : null })
      setSelected(null)
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Initial Screening" subtitle="Symptom checklist and notes for the doctor. This is not a medical record." />
      <Card>
        <div className="mb-4 max-w-xs">
          <Select value={clinicId} onChange={(e) => setClinicId(e.target.value)} aria-label="Clinic">
            <option value="">All Clinics</option>
            {(clinics.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        {loading && !data ? <LoadingState /> : (
          <Table
            rows={data || []}
            empty="No waiting patients."
            columns={[
              { key: 'queue_number', label: 'QUEUE #' },
              { key: 'patient_name', label: 'PATIENT' },
              { key: 'age', label: 'AGE' },
              { key: 'clinic', label: 'CLINIC' },
              { key: 'triaged', label: 'SCREENED', render: (row) => row.triaged ? <Badge tone="success">Done</Badge> : <Badge tone="warning">Pending</Badge> },
              { key: 'actions', label: '', render: (row) => <Button size="sm" variant={row.triaged ? 'secondary' : 'primary'} onClick={() => open(row)}>{row.triaged ? 'Update' : 'Screen'}</Button> },
            ]}
          />
        )}
      </Card>
      <Modal open={Boolean(selected)} title={selected ? `Screening — ${selected.patient_name} (${selected.queue_number})` : ''} onClose={() => setSelected(null)} footer={<><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {TRIAGE_SYMPTOMS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.covid_exposure)} onChange={(e) => setForm({ ...form, covid_exposure: e.target.checked })} />
            Recent exposure to a COVID-19 case
          </label>
          <Input label="How long?" placeholder="e.g. 3 days" value={form.symptom_duration || ''} onChange={(e) => setForm({ ...form, symptom_duration: e.target.value })} />
          <Textarea label="Notes for the doctor" rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Select label="Route to doctor" value={form.doctor_id || ''} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
            <option value="">Keep current</option>
            {(doctors.data || []).map((d) => <option key={d.id} value={d.id}>{d.name} — {d.clinic}</option>)}
          </Select>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </Modal>
    </div>
  )
}

export function PatientRecordsPage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(() => patientsApi.list({ q }), [q])
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader
        title="Patient Records"
        subtitle="Registered patients (administrative information only)"
        actions={[ROLES.ADMINISTRATOR, ROLES.OPD_STAFF].includes(user.role) ? <Link to="/patient-registration"><Button>Register Patient</Button></Link> : null}
      />
      <Card>
        <Input placeholder="Search patient records…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md mb-4" />
        <Table
          rows={data || []}
          columns={[
            { key: 'patient_id', label: 'PATIENT ID' },
            { key: 'full_name', label: 'NAME' },
            { key: 'age', label: 'AGE' },
            { key: 'sex', label: 'SEX' },
            { key: 'contact_number', label: 'CONTACT' },
            { key: 'created_at', label: 'REGISTERED', render: (row) => formatDateTime(row.created_at) },
            { key: 'actions', label: '', render: (row) => <Button size="sm" variant="secondary" onClick={() => navigate(`/patient-records/${row.id}`)}>View</Button> },
          ]}
        />
      </Card>
    </div>
  )
}

export function PatientRecordDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const canEdit = [ROLES.ADMINISTRATOR, ROLES.OPD_STAFF].includes(user?.role)
  const { data, loading, error, reload } = useAsync(() => patientsApi.get(id), [id])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(emptyPatient)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function openEdit() {
    if (!data) return
    setErrors({})
    setForm({
      ...emptyPatient,
      last_name: data.last_name || '',
      first_name: data.first_name || '',
      middle_name: data.middle_name || '',
      birthday: data.birthday || '',
      sex: data.sex || 'Male',
      civil_status: data.civil_status || 'Single',
      complete_address: data.complete_address || '',
      contact_number: data.contact_number || '',
      nationality: data.nationality || 'Filipino',
      religion: data.religion || '',
      philhealth_number: data.philhealth_number || '',
      spouse_name: data.spouse_name || '',
      father_name: data.father_name || '',
      mother_name: data.mother_name || '',
    })
    setEditing(true)
  }

  async function saveEdit() {
    const next = {}
    if (!form.last_name.trim()) next.last_name = 'Required'
    if (!form.first_name.trim()) next.first_name = 'Required'
    if (!form.birthday) next.birthday = 'Required'
    if (!form.complete_address.trim()) next.complete_address = 'Required'
    if (form.contact_number.trim() && !/^\d{11}$/.test(form.contact_number)) next.contact_number = 'Must be exactly 11 digits'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      const body = {
        last_name: form.last_name.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        birthday: form.birthday,
        sex: form.sex,
        civil_status: form.civil_status || null,
        complete_address: form.complete_address.trim(),
        contact_number: form.contact_number.trim() || null,
        nationality: form.nationality || null,
        religion: form.religion || null,
        philhealth_number: form.philhealth_number || null,
        spouse_name: form.spouse_name || null,
        father_name: form.father_name || null,
        mother_name: form.mother_name || null,
      }
      await patientsApi.update(id, body)
      setEditing(false)
      reload()
    } catch (err) {
      setErrors({ form: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader
        title={data.full_name}
        subtitle={<span className="inline-flex flex-wrap items-center gap-2">{data.patient_id} <CurrentAdmissionBadge admission={data.current_admission} /></span>}
        actions={(
          <div className="flex items-center gap-2">
            {canEdit ? <Button size="sm" variant="secondary" onClick={openEdit}>Edit Patient Information</Button> : null}
            <Link className="text-sm text-blue-600" to="/patient-records">Back</Link>
          </div>
        )}
      />
      <PatientInfoCard patient={data} />
      <Modal
        open={editing}
        title="Edit Patient Information"
        onClose={() => setEditing(false)}
        footer={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button disabled={saving} onClick={saveEdit}>{saving ? 'Saving…' : 'Save changes'}</Button></>}
      >
        <PatientForm form={form} setForm={setForm} errors={errors} minorAge={0} />
        {errors.form ? <p className="text-sm text-red-600 mt-3">{errors.form}</p> : null}
        <p className="text-xs text-slate-500 mt-3">Changes are audited. Guardian details are set at registration for minors.</p>
      </Modal>
    </div>
  )
}