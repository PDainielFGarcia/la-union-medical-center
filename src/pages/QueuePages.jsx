import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi, doctorsApi, queuesApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { ErrorState } from '../components/ui/ErrorState'
import { Input, Select } from '../components/ui/FormFields'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Table } from '../components/ui/Table'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { usePolling } from '../hooks/usePolling'
import { ROLES } from '../utils/constants'
import { titleCaseStatus } from '../utils/format'

/** OPD, nurses, and admins manage all clinics; doctors only their assigned clinic. */
function canInteractWithTicket(user, item) {
  if (!user) return false
  if ([ROLES.ADMINISTRATOR, ROLES.OPD_STAFF, ROLES.NURSING_STAFF].includes(user.role)) return true
  if (user.role === ROLES.DOCTOR) {
    return user.clinic_id != null && String(item.clinic_id) === String(user.clinic_id)
  }
  return false
}

const QUEUE_POLL_MS = 4000
const DISPLAY_POLL_MS = 3000
const UNASSIGNED = 'Unassigned'

const ACTIONS = {
  call: { label: 'Call', verb: 'call', variant: 'primary' },
  serve: { label: 'Serve', verb: 'start serving', variant: 'primary' },
  done: { label: 'Done', verb: 'mark as done', variant: 'primary' },
  skip: { label: 'Skip', verb: 'skip', variant: 'danger' },
}

/** Group tickets by clinic name, sorted alphabetically (Unassigned last). */
function groupByClinic(items) {
  const map = new Map()
  items.forEach((item) => {
    const key = item.clinic || UNASSIGNED
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return [...map.entries()]
    .sort(([a], [b]) => (a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a.localeCompare(b)))
    .map(([clinic, tickets]) => ({ clinic, tickets }))
}

/** Confirmation + undo handling shared by the staff queue pages. */
function useTicketActions(reload) {
  const [confirm, setConfirm] = useState(null)

  function request(item, action) {
    const meta = ACTIONS[action]
    setConfirm({
      title: `${meta.label} ${item.queue_number}?`,
      message: `Are you sure you want to ${meta.verb} ${item.patient_name} (${item.queue_number})?`,
      confirmLabel: meta.label,
      variant: meta.variant,
      run: async () => {
        await queuesApi[action](item.id)
        await reload({ silent: true })
      },
    })
  }

  function undo(item) {
    setConfirm({
      title: `Undo last action on ${item.queue_number}?`,
      message: `This reverts ${item.patient_name} (${item.queue_number}) from "${titleCaseStatus(item.status)}" to its previous step. Undo can only be used once per ticket.`,
      confirmLabel: 'Undo',
      variant: 'secondary',
      run: async () => {
        await queuesApi.undo(item.id)
        await reload({ silent: true })
      },
    })
  }

  return { confirm, setConfirm, request, undo }
}

function TicketActions({ item, onAction, onUndo, canInteract }) {
  if (!canInteract) {
    return <span className="text-xs text-slate-400">View only</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {item.status === 'waiting' ? <Button size="sm" onClick={() => onAction(item, 'call')}>Call</Button> : null}
      {item.status === 'called' ? <Button size="sm" onClick={() => onAction(item, 'serve')}>Serve</Button> : null}
      {item.status === 'serving' ? <Button size="sm" onClick={() => onAction(item, 'done')}>Done</Button> : null}
      {['waiting', 'called'].includes(item.status) ? <Button size="sm" variant="secondary" onClick={() => onAction(item, 'skip')}>Skip</Button> : null}
      {item.can_undo ? <Button size="sm" variant="ghost" onClick={() => onUndo(item)}>Undo</Button> : null}
    </div>
  )
}

export function QueueMonitorPage() {
  const { user } = useAuth()
  const [clinicId, setClinicId] = useState('all')
  const queues = useAsync(() => queuesApi.list(clinicId === 'all' ? {} : { clinic_id: clinicId }), [clinicId])
  const doctors = useAsync(() => doctorsApi.list(), [])
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const actions = useTicketActions(queues.reload)
  usePolling(queues.reload, QUEUE_POLL_MS)
  usePolling(doctors.reload, QUEUE_POLL_MS)

  if ((queues.loading && !queues.data) || (doctors.loading && !doctors.data)) return <LoadingState />
  if (queues.error && !queues.data) return <ErrorState message={queues.error} onRetry={queues.reload} />

  const items = queues.data || []
  const active = items.filter((item) => ['waiting', 'called', 'serving'].includes(item.status))
  const completed = items.filter((item) => item.status === 'completed')
  const groups = groupByClinic(active)

  return (
    <div>
      <PageHeader title="Queue Monitor" subtitle="Real-time patient queue management (refreshes every few seconds)" actions={<Link to="/public-display"><Button variant="secondary">Public Display</Button></Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Waiting" value={items.filter((i) => i.status === 'waiting').length} tone="amber" />
        <StatCard label="Called" value={items.filter((i) => i.status === 'called').length} tone="blue" />
        <StatCard label="Serving" value={items.filter((i) => i.status === 'serving').length} tone="green" />
        <StatCard label="Completed" value={completed.length} tone="slate" />
      </div>
      <div className="mb-4 max-w-xs">
        <Select value={clinicId} onChange={(e) => setClinicId(e.target.value)} aria-label="Filter clinic">
          <option value="all">All Clinics</option>
          {(clinics.data || []).map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
        </Select>
      </div>
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {groups.length ? groups.map(({ clinic, tickets }) => (
            <Card key={clinic}>
              <CardTitle>{clinic} <span className="text-sm font-normal text-slate-500">· {tickets.length} active</span></CardTitle>
              <div className="space-y-3">
                {tickets.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">{item.queue_number}</p>
                      <p className="font-medium">{item.patient_name}</p>
                      <p className="text-xs text-slate-500">{item.doctor_name || 'No doctor assigned'} • {item.clinic}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge status={item.status} />
                      <TicketActions item={item} onAction={actions.request} onUndo={actions.undo} canInteract={canInteractWithTicket(user, item)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )) : (
            <Card><p className="text-sm text-slate-500">No active queue tickets.</p></Card>
          )}
        </div>
        <Card>
          <CardTitle>Doctor Status</CardTitle>
          {(doctors.data || []).map((doctor) => (
            <div key={doctor.id} className="py-3 border-b border-slate-100 last:border-0">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">{doctor.name}</p>
                  <p className="text-xs text-slate-500">{doctor.specialty} • {doctor.clinic}</p>
                </div>
                <Badge status={doctor.status} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{doctor.waiting_count} waiting</p>
            </div>
          ))}
        </Card>
      </div>
      <Card className="mt-4">
        <CardTitle>Completed / History (Today)</CardTitle>
        <Table
          rows={completed}
          columns={[
            { key: 'queue_number', label: 'QUEUE #' },
            { key: 'patient_name', label: 'PATIENT' },
            { key: 'doctor_name', label: 'DOCTOR', render: (row) => row.doctor_name || '—' },
            { key: 'clinic', label: 'CLINIC' },
            { key: 'time', label: 'TIME' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
            { key: 'undo', label: '', render: (row) => (row.can_undo && canInteractWithTicket(user, row) ? <Button size="sm" variant="ghost" onClick={() => actions.undo(row)}>Undo</Button> : null) },
          ]}
        />
      </Card>
      <ConfirmModal action={actions.confirm} onClose={() => actions.setConfirm(null)} />
    </div>
  )
}

export function ClinicQueuesPage() {
  const { user } = useAuth()
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const doctors = useAsync(() => doctorsApi.list(), [])
  const queues = useAsync(() => queuesApi.list(), [])
  const actions = useTicketActions(queues.reload)
  usePolling(queues.reload, QUEUE_POLL_MS)
  usePolling(doctors.reload, QUEUE_POLL_MS)

  if ((clinics.loading && !clinics.data) || (doctors.loading && !doctors.data) || (queues.loading && !queues.data)) return <LoadingState />
  if (queues.error && !queues.data) return <ErrorState message={queues.error} onRetry={queues.reload} />

  const tickets = queues.data || []
  const clinicList = clinics.data || []
  const known = new Set(clinicList.map((clinic) => clinic.name))
  const sections = [
    ...clinicList.map((clinic) => ({ key: clinic.id, name: clinic.name, id: clinic.id })),
    ...(tickets.some((t) => !t.clinic || !known.has(t.clinic)) ? [{ key: 'unassigned', name: UNASSIGNED, id: null }] : []),
  ]

  return (
    <div>
      <PageHeader title="Clinic Queues" subtitle="Queue status per clinic, with the doctors on duty" />
      <div className="space-y-4">
        {sections.map((section) => {
          const clinicTickets = tickets.filter((item) => (section.id == null
            ? !item.clinic || !known.has(item.clinic)
            : String(item.clinic_id) === String(section.id)))
          const clinicDoctors = section.id == null ? [] : (doctors.data || []).filter((d) => String(d.primary_clinic_id) === String(section.id))
          const serving = clinicTickets.filter((item) => item.status === 'serving')
          const called = clinicTickets.filter((item) => item.status === 'called')
          const next = clinicTickets.find((item) => item.status === 'waiting')
          const waitingCount = clinicTickets.filter((item) => item.status === 'waiting').length
          return (
            <Card key={section.key}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-semibold text-lg">{section.name}</h2>
                  {clinicDoctors.length ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {clinicDoctors.map((doctor) => (
                        <span key={doctor.id} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          {doctor.name} <Badge status={doctor.status}>{titleCaseStatus(doctor.status)}</Badge>
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-500 mt-1">No doctors assigned to this clinic</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{waitingCount}</p>
                  <p className="text-xs text-slate-500">waiting</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm">
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Now Serving</p><p className="font-semibold">{serving.map((t) => t.queue_number).join(', ') || '—'}</p><p>{serving.map((t) => t.patient_name).join(', ') || 'None'}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Called</p><p className="font-semibold">{called.map((t) => t.queue_number).join(', ') || '—'}</p><p>{called.map((t) => t.patient_name).join(', ') || 'None'}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Next Up</p><p className="font-semibold">{next?.queue_number || '—'}</p><p>{next?.patient_name || 'None'}</p></div>
              </div>
              {clinicTickets.length ? (
                <Table
                  rows={clinicTickets}
                  columns={[
                    { key: 'queue_number', label: 'QUEUE #' },
                    { key: 'patient_name', label: 'PATIENT' },
                    { key: 'doctor_name', label: 'DOCTOR', render: (row) => row.doctor_name || '—' },
                    { key: 'time', label: 'TIME' },
                    { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status}>{titleCaseStatus(row.status)}</Badge> },
                    { key: 'actions', label: 'ACTIONS', render: (row) => <TicketActions item={row} onAction={actions.request} onUndo={actions.undo} canInteract={canInteractWithTicket(user, row)} /> },
                  ]}
                />
              ) : <p className="text-sm text-slate-500">No tickets today.</p>}
            </Card>
          )
        })}
      </div>
      <ConfirmModal action={actions.confirm} onClose={() => actions.setConfirm(null)} />
    </div>
  )
}

// Kept as an alias for any older imports.
export const DoctorQueuesPage = ClinicQueuesPage

export function QueueHistoryPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const { data, loading, error, reload } = useAsync(() => queuesApi.list({ q, status }), [q, status])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Queue History" subtitle="Complete history of all queue activities" actions={<Button variant="secondary" onClick={() => window.print()}>Export</Button>} />
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search by patient or queue number..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="called">Called</option>
            <option value="serving">Serving</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
            <option value="no_show">No-show</option>
          </Select>
        </div>
        <p className="text-sm text-slate-500 mb-3">{data.length} records</p>
        <Table
          rows={data}
          columns={[
            { key: 'queue_number', label: 'QUEUE #' },
            { key: 'patient_name', label: 'PATIENT' },
            { key: 'doctor_name', label: 'DOCTOR', render: (row) => row.doctor_name || '—' },
            { key: 'clinic', label: 'CLINIC' },
            { key: 'time', label: 'TIME' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  )
}

export function PublicDisplayPage() {
  const queues = useAsync(() => queuesApi.list(), [])
  const doctors = useAsync(() => doctorsApi.list(), [])
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const [now, setNow] = useState(() => new Date())
  usePolling(queues.reload, DISPLAY_POLL_MS)
  usePolling(doctors.reload, DISPLAY_POLL_MS)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const tickets = queues.data || []
  const doctorList = doctors.data || []
  const clinicList = clinics.data || []
  const known = new Set(clinicList.map((clinic) => clinic.name))
  const sections = [
    ...clinicList.map((clinic) => ({ key: clinic.id, name: clinic.name, id: clinic.id })),
    ...(tickets.some((t) => !t.clinic || !known.has(t.clinic)) ? [{ key: 'unassigned', name: UNASSIGNED, id: null }] : []),
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">La Union Medical Center</h1>
          <p className="text-slate-400">Hospital Queue Display</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{now.toLocaleTimeString()}</p>
          <p className="text-slate-400">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="grid xl:grid-cols-2 gap-6">
        {sections.map((section) => {
          const clinicTickets = tickets.filter((item) => (section.id == null
            ? !item.clinic || !known.has(item.clinic)
            : String(item.clinic_id) === String(section.id)))
          const clinicDoctors = section.id == null ? [] : doctorList.filter((d) => String(d.primary_clinic_id) === String(section.id))
          const serving = clinicTickets.filter((item) => item.status === 'serving')
          const calling = clinicTickets.filter((item) => item.status === 'called')
          const waiting = clinicTickets.filter((item) => item.status === 'waiting')
          return (
            <section key={section.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-2xl font-semibold mb-1">{section.name}</h2>
              <div className="mb-4 space-y-0.5">
                {clinicDoctors.length ? clinicDoctors.map((doctor) => (
                  <p key={doctor.id} className="text-sm text-slate-300">
                    {section.name}: {doctor.name} —{' '}
                    <span className={doctor.status === 'available' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                      {doctor.status === 'available' ? 'Available' : 'Unavailable'}
                    </span>
                  </p>
                )) : <p className="text-sm text-slate-500">No doctor assigned</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-2">Now Serving</h3>
                  {serving.length ? serving.map((item) => (
                    <div key={item.id} className="rounded-xl bg-blue-600 p-4 mb-2">
                      <p className="text-3xl font-bold">{item.queue_number}</p>
                      {item.doctor_name ? <p className="text-blue-100 text-sm">{item.doctor_name}</p> : null}
                    </div>
                  )) : <p className="text-slate-500 text-sm">—</p>}
                  <h3 className="text-sm uppercase tracking-wide text-slate-400 mt-4 mb-2">Now Calling</h3>
                  {calling.length ? calling.map((item) => (
                    <div key={item.id} className="rounded-xl bg-amber-500 text-slate-900 p-4 mb-2">
                      <p className="text-2xl font-bold">{item.queue_number}</p>
                    </div>
                  )) : <p className="text-slate-500 text-sm">—</p>}
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-2">Waiting ({waiting.length})</h3>
                  <div className="space-y-2">
                    {waiting.map((item) => (
                      <div key={item.id} className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2">
                        <span className="font-semibold text-blue-300">{item.queue_number}</span>
                      </div>
                    ))}
                    {!waiting.length ? <p className="text-slate-500 text-sm">No one waiting</p> : null}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
