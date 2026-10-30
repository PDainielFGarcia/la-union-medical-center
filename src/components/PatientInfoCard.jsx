import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Badge } from './ui/Badge'
import { Card, CardTitle } from './ui/Card'
import { Table } from './ui/Table'
import { formatDateTime, titleCaseStatus } from '../utils/format'
import { TRIAGE_SYMPTOMS } from '../utils/constants'

const SYMPTOM_LABELS = Object.fromEntries(TRIAGE_SYMPTOMS)

function Field({ label, value }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="font-medium break-words">{value || '—'}</dd></div>
}

export function admissionLocation(admission) {
  return admission.bed_number ? `${admission.ward}, ${admission.room}, bed ${admission.bed_number}` : 'waiting for bed'
}

export function CurrentAdmissionBadge({ admission }) {
  if (!admission) return <Badge tone="neutral">Not admitted</Badge>
  return (
    <Badge tone={admission.status === 'admitted' ? 'danger' : 'warning'}>
      {admission.status === 'admitted' ? `Admitted · ${admission.ward || 'Ward'} · bed ${admission.bed_number}` : 'Admitted · waiting for bed'}
    </Badge>
  )
}

function GuardianList({ guardians }) {
  if (!guardians?.length) return <p className="text-sm text-slate-500">No guardians on record.</p>
  return (
    <div className="space-y-2">
      {guardians.map((guardian) => (
        <div key={guardian.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <p className="font-medium">{guardian.full_name}</p>
          <p className="text-slate-500">{guardian.relationship || '—'} · {guardian.contact_number || '—'}</p>
        </div>
      ))}
    </div>
  )
}

function ScreeningDetails({ screening }) {
  if (!screening) return <p className="text-sm text-slate-500">Not screened for this visit.</p>
  const labels = (screening.symptoms || []).map((key) => SYMPTOM_LABELS[key] || key)
  return (
    <dl className="grid sm:grid-cols-2 gap-3 text-sm">
      <Field label="Positive symptoms" value={labels.length ? labels.join(', ') : 'None reported'} />
      <Field label="Duration" value={screening.symptom_duration} />
      <Field label="COVID exposure" value={screening.covid_exposure ? 'Yes' : 'No'} />
      <Field label="Screened at" value={screening.screened_at ? formatDateTime(screening.screened_at) : null} />
      <div className="sm:col-span-2"><Field label="Notes" value={screening.notes} /></div>
    </dl>
  )
}

function HospitalVisitRow({ visit }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
        <div className="flex-1 min-w-0 grid sm:grid-cols-4 gap-1 sm:gap-3 text-sm">
          <span className="font-medium text-slate-900">{visit.queue_date || '—'}</span>
          <span className="text-blue-700 font-semibold">{visit.queue_number}</span>
          <span className="text-slate-600 truncate">{visit.clinic || '—'}</span>
          <span className="sm:text-right"><Badge status={visit.status}>{titleCaseStatus(visit.status)}</Badge></span>
        </div>
      </button>
      {open ? (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
          <dl className="grid sm:grid-cols-3 gap-3 text-sm">
            <Field label="Reason" value={visit.reason} />
            <Field label="Doctor" value={visit.doctor_name} />
            <Field label="Arrived" value={visit.time} />
          </dl>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">Screening Results</p>
            <ScreeningDetails screening={visit.screening} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Patient details. `compact` renders a short version for modals;
 * the full version adds hospital visits and admissions history.
 */
export function PatientInfoCard({ patient, compact = false }) {
  const admission = patient.current_admission
  const visits = patient.hospital_visits || patient.opd_visits || []
  const basic = (
    <dl className={`grid gap-4 text-sm ${compact ? 'grid-cols-2' : 'md:grid-cols-3'}`}>
      <Field label="Patient ID" value={patient.patient_id} />
      <Field label="Birthday" value={patient.birthday} />
      <Field label="Age" value={patient.age} />
      <Field label="Sex" value={patient.sex} />
      <Field label="Civil status" value={patient.civil_status} />
      <Field label="Contact" value={patient.contact_number} />
      <Field label="PhilHealth" value={patient.philhealth_number} />
      <Field label="Nationality" value={patient.nationality} />
      <Field label="Religion" value={patient.religion} />
      <div className={compact ? 'col-span-2' : 'md:col-span-3'}><Field label="Address" value={patient.complete_address} /></div>
      {!compact ? (
        <>
          <Field label="Spouse" value={patient.spouse_name} />
          <Field label="Father" value={patient.father_name} />
          <Field label="Mother" value={patient.mother_name} />
        </>
      ) : null}
    </dl>
  )

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold">{patient.full_name}</p>
          <CurrentAdmissionBadge admission={admission} />
        </div>
        {admission ? <p className="text-sm text-slate-600">{admission.admission_number} · {admissionLocation(admission)}</p> : null}
        {basic}
        <div>
          <p className="text-sm font-semibold mb-2">Guardians</p>
          <GuardianList guardians={patient.guardians} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {admission ? (
        <Card>
          <CardTitle>Current Admission</CardTitle>
          <p className="text-sm">{admission.admission_number} · <Badge status={admission.status} /> · {admissionLocation(admission)}</p>
        </Card>
      ) : null}
      <Card>
        <CardTitle>Patient Information</CardTitle>
        {basic}
      </Card>
      <Card>
        <CardTitle>Guardians</CardTitle>
        <GuardianList guardians={patient.guardians} />
      </Card>
      <Card>
        <CardTitle>Hospital Visits</CardTitle>
        <p className="text-xs text-slate-500 mb-3">Click a visit to view screening results and details.</p>
        {visits.length ? (
          <div className="space-y-2">
            {visits.map((visit) => <HospitalVisitRow key={visit.id} visit={visit} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hospital visits yet.</p>
        )}
      </Card>
      <Card>
        <CardTitle>Admissions History</CardTitle>
        <Table
          rows={patient.admissions || []}
          empty="No admissions yet."
          columns={[
            { key: 'admission_number', label: 'ADMISSION' },
            { key: 'ward', label: 'WARD / BED', render: (row) => (row.bed_number ? `${row.ward} · ${row.bed_number}` : '—') },
            { key: 'priority', label: 'PRIORITY' },
            { key: 'admitted_at', label: 'ADMITTED', render: (row) => (row.admitted_at ? formatDateTime(row.admitted_at) : '—') },
            { key: 'discharged_at', label: 'DISCHARGED', render: (row) => (row.discharged_at ? formatDateTime(row.discharged_at) : '—') },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  )
}
