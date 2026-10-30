import { useState } from 'react'
import { auditApi, backupsApi, catalogApi, parkingApi, reportsApi, settingsApi, usersApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { Input, Select } from '../components/ui/FormFields'
import { LoadingState } from '../components/ui/LoadingState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Table } from '../components/ui/Table'
import { useAsync } from '../hooks/useAsync'
import { EXPORT_DATASETS, ROLE_LABELS, ROLES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime } from '../utils/format'
import { useAuth } from '../auth/AuthContext'
import { todayIso } from '../utils/visitorPass'

function useAction() {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  async function run(key, fn) {
    setBusy(key)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy('')
    }
  }
  return { busy, error, run }
}

export function ReportsPage() {
  const [date, setDate] = useState(todayIso())
  const [from, setFrom] = useState(todayIso())
  const [to, setTo] = useState(todayIso())
  const daily = useAsync(() => reportsApi.daily(date), [date])
  const action = useAction()
  const d = daily.data

  return (
    <div>
      <PageHeader title="Reports & Exports" subtitle="Daily PDF reports and Google Sheets–ready CSV exports" />
      <Card className="mb-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <Input label="Report date" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {[['patients', 'Daily Patient Report'], ['visitors', 'Daily Visitor Report'], ['audit', 'Daily Audit Log']].map(([type, label]) => (
              <Button key={type} disabled={Boolean(action.busy)} onClick={() => action.run(`pdf-${type}`, () => reportsApi.downloadDailyPdf(type, date))}>
                {action.busy === `pdf-${type}` ? 'Generating…' : `${label} (PDF)`}
              </Button>
            ))}
          </div>
        </div>
        {action.error ? <p className="text-sm text-red-600 mt-3">{action.error}</p> : null}
      </Card>

      {daily.loading && !d ? <LoadingState /> : daily.error ? <ErrorState message={daily.error} onRetry={daily.reload} /> : d ? (
        <>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Patients · {d.date}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <StatCard label="New patients" value={d.patients.new_patients} />
            <StatCard label="Hospital visits" value={d.patients.opd_arrivals} />
            <StatCard label="Seen by doctor" value={d.patients.seen_by_doctor} tone="green" />
            <StatCard label="Admitted" value={d.patients.admitted} />
            <StatCard label="Discharged" value={d.patients.discharged} />
            <StatCard label="Currently admitted" value={d.patients.currently_admitted} />
          </div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Visitors · {d.date}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <StatCard label="Registered" value={d.visitors.registered} />
            <StatCard label="Approved" value={d.visitors.approved} />
            <StatCard label="Rejected" value={d.visitors.rejected} />
            <StatCard label="Entered" value={d.visitors.entered} />
            <StatCard label="Exited" value={d.visitors.exited} />
            <StatCard label="Vehicles parked" value={d.visitors.vehicles_parked} />
          </div>
          <Card className="mb-4">
            <CardTitle>Bed availability by ward (now)</CardTitle>
            <Table
              rowKey="ward"
              rows={d.census}
              columns={[
                { key: 'ward', label: 'WARD' },
                { key: 'total', label: 'TOTAL' },
                { key: 'occupied', label: 'OCCUPIED', render: (r) => String(r.occupied) },
                { key: 'available', label: 'AVAILABLE', render: (r) => String(r.available) },
                { key: 'reserved', label: 'RESERVED', render: (r) => String(r.reserved) },
                { key: 'unavailable', label: 'UNAVAILABLE', render: (r) => String(r.unavailable) },
              ]}
            />
          </Card>
        </>
      ) : null}

      <Card>
        <CardTitle>Export for Google Sheets (CSV)</CardTitle>
        <p className="text-sm text-slate-500 mb-3">
          Downloads a UTF-8 CSV. In Google Sheets choose <strong>File → Import → Upload</strong>, or open it in Excel.
        </p>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {EXPORT_DATASETS.map(([key, label]) => (
            <Button key={key} variant="secondary" disabled={Boolean(action.busy)} onClick={() => action.run(`csv-${key}`, () => reportsApi.downloadCsv(key, from, to))}>
              {action.busy === `csv-${key}` ? 'Exporting…' : label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function BackupsPage() {
  const { data, loading, error, reload } = useAsync(() => backupsApi.list(), [])
  const action = useAction()
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader
        title="Database Backups"
        subtitle="A compressed MySQL dump is created automatically every night. Keep a copy off this computer."
        actions={<Button disabled={Boolean(action.busy)} onClick={() => action.run('create', async () => { await backupsApi.create(); await reload({ silent: true }) })}>{action.busy === 'create' ? 'Backing up…' : 'Back up now'}</Button>}
      />
      {action.error ? <p className="text-sm text-red-600 mb-3">{action.error}</p> : null}
      <Card>
        <Table
          rowKey="name"
          rows={data || []}
          empty="No backups yet."
          columns={[
            { key: 'name', label: 'FILE' },
            { key: 'created_at', label: 'CREATED', render: (row) => formatDateTime(row.created_at) },
            { key: 'size', label: 'SIZE', render: (row) => formatBytes(row.size) },
            { key: 'actions', label: '', render: (row) => <Button size="sm" variant="secondary" onClick={() => action.run(row.name, () => backupsApi.download(row.name))}>Download</Button> },
          ]}
        />
      </Card>
    </div>
  )
}

export function ParkingAreasPage() {
  const { data, loading, error, reload } = useAsync(() => parkingApi.list(), [])
  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')

  async function save() {
    setFormError('')
    try {
      const body = { name: editing.name, code: editing.code, capacity: editing.capacity === '' || editing.capacity == null ? null : Number(editing.capacity), is_active: Boolean(editing.is_active) }
      if (editing.id) await parkingApi.update(editing.id, body)
      else await parkingApi.create(body)
      setEditing(null)
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Parking Areas" subtitle="Areas the guard can choose when recording a vehicle" actions={<Button onClick={() => setEditing({ name: '', code: '', capacity: '', is_active: true })}>Add Area</Button>} />
      <Card>
        <Table
          rows={data || []}
          columns={[
            { key: 'name', label: 'NAME' },
            { key: 'code', label: 'CODE' },
            { key: 'capacity', label: 'CAPACITY', render: (row) => row.capacity ?? '—' },
            { key: 'parked', label: 'PARKED NOW', render: (row) => String(row.parked) },
            { key: 'is_active', label: 'STATUS', render: (row) => <Badge tone={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'actions', label: '', render: (row) => <Button size="sm" variant="secondary" onClick={() => setEditing({ ...row })}>Edit</Button> },
          ]}
        />
      </Card>
      <Modal open={Boolean(editing)} title={editing?.id ? 'Edit parking area' : 'Add parking area'} onClose={() => setEditing(null)} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing ? (
          <div className="space-y-3">
            <Input label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Code" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
            <Input label="Capacity (optional)" type="number" min="0" value={editing.capacity ?? ''} onChange={(e) => setEditing({ ...editing, capacity: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(editing.is_active)} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

const ACCESS = [
  ['Visitor registration & QR scanning', [ROLES.SECURITY_GUARD]],
  ['Approve patient visits (patient must be admitted)', [ROLES.SECURITY_GUARD]],
  ['Approve / reject office visits (own office)', [ROLES.DEPARTMENT_SECRETARY]],
  ['Patient registration', [ROLES.OPD_STAFF]],
  ['Hospital visits & queue', [ROLES.OPD_STAFF, ROLES.NURSING_STAFF, ROLES.DOCTOR]],
  ['Initial screening checklist', [ROLES.NURSING_STAFF]],
  ['View beds & who is in them', [ROLES.OPD_STAFF, ROLES.NURSING_STAFF, ROLES.DOCTOR]],
  ['Admit / transfer / discharge, bed status', [ROLES.OPD_STAFF]],
  ['Vehicles & parking', [ROLES.SECURITY_GUARD, ROLES.OPD_STAFF]],
  ['Reports, exports, backups, users, settings', []],
]

function passwordLooksValid(value) {
  if (!value) return true
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

export function UsersPage() {
  const { data, loading, error, reload } = useAsync(() => usersApi.list(), [])
  const departments = useAsync(() => catalogApi.departments(), [])
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')
  const blank = {
    first_name: '', middle_name: '', last_name: '', login: '', contact_number: '',
    role: ROLES.OPD_STAFF, department_id: '', clinic_id: '', specialty: '', password: '', admin_password: '',
  }

  async function save() {
    setFormError('')
    if (editing.contact_number && !/^\d{11}$/.test(editing.contact_number)) {
      setFormError('Contact number must be exactly 11 digits when provided.')
      return
    }
    if (editing.role === ROLES.DEPARTMENT_SECRETARY && !editing.department_id) {
      setFormError('Select an office for office secretaries.')
      return
    }
    if (editing.role === ROLES.DOCTOR && !editing.clinic_id) {
      setFormError('Select a clinic for doctors.')
      return
    }
    if (!editing.id && !editing.login?.trim()) {
      setFormError('Login is required.')
      return
    }
    if (editing.password && !passwordLooksValid(editing.password)) {
      setFormError('Password must be at least 8 characters and include both letters and numbers.')
      return
    }
    const changingSecrets = Boolean(editing.password) || (editing.id && editing.login?.trim())
    if (editing.id && changingSecrets && !editing.admin_password) {
      setFormError('Enter your administrator password to change login or password.')
      return
    }
    try {
      const body = {
        first_name: editing.first_name,
        middle_name: editing.middle_name || null,
        last_name: editing.last_name,
        contact_number: editing.contact_number || null,
        role: editing.role,
        department_id: editing.role === ROLES.DEPARTMENT_SECRETARY && editing.department_id ? Number(editing.department_id) : null,
        clinic_id: editing.role === ROLES.DOCTOR && editing.clinic_id ? Number(editing.clinic_id) : null,
        specialty: editing.role === ROLES.DOCTOR ? (editing.specialty || null) : null,
      }
      if (!editing.id) {
        body.login = editing.login
        body.password = editing.password || undefined
        await usersApi.create(body)
      } else {
        if (editing.login?.trim()) body.login = editing.login.trim()
        if (editing.password) body.password = editing.password
        if (body.login || body.password) body.admin_password = editing.admin_password
        await usersApi.update(editing.id, body)
      }
      setEditing(null)
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Logins are hidden. Secretaries need an office; doctors need a clinic. Default password is 12345678." actions={<Button onClick={() => setEditing({ ...blank })}>Add User</Button>} />
      <Card className="mb-4">
        <Table
          rows={data || []}
          columns={[
            { key: 'name', label: 'NAME' },
            { key: 'login_masked', label: 'LOGIN', render: (row) => row.login_masked || '••••••••' },
            { key: 'contact_number', label: 'CONTACT' },
            { key: 'role', label: 'ROLE', render: (row) => ROLE_LABELS[row.role] || row.role },
            { key: 'assignment', label: 'OFFICE / CLINIC', render: (row) => row.department || row.clinic || '—' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status === 'active' ? 'active' : 'cancelled'}>{row.status}</Badge> },
            { key: 'actions', label: '', render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing({
                  ...blank,
                  ...row,
                  login: '',
                  password: '',
                  admin_password: '',
                  department_id: row.department_id || '',
                  clinic_id: row.clinic_id || '',
                  specialty: row.specialty || '',
                  middle_name: row.middle_name || '',
                })}
                >
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={async () => { await usersApi.update(row.id, { status: row.status === 'active' ? 'inactive' : 'active' }); reload() }}>
                  {row.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ) },
          ]}
        />
      </Card>
      <Card>
        <CardTitle>Who can do what</CardTitle>
        <p className="text-xs text-slate-500 mb-3">Enforced by the server. Administrators can do everything every role can do.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2">Function</th>
                {Object.entries(ROLE_LABELS).filter(([r]) => r !== ROLES.ADMINISTRATOR).map(([r, label]) => <th key={r} className="px-2">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {ACCESS.map(([label, roles]) => (
                <tr key={label} className="border-t">
                  <td className="py-2">{label}</td>
                  {Object.keys(ROLE_LABELS).filter((r) => r !== ROLES.ADMINISTRATOR).map((r) => <td key={r} className="text-center">{roles.includes(r) ? '✓' : ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={Boolean(editing)} title={editing?.id ? 'Edit user' : 'Add user'} onClose={() => setEditing(null)} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing ? (
          <div className="space-y-3">
            <Input label="First name *" value={editing.first_name || ''} onChange={(e) => setEditing({ ...editing, first_name: e.target.value })} />
            <Input label="Middle name" value={editing.middle_name || ''} onChange={(e) => setEditing({ ...editing, middle_name: e.target.value })} />
            <Input label="Last name *" value={editing.last_name || ''} onChange={(e) => setEditing({ ...editing, last_name: e.target.value })} />
            <Input
              label={editing.id ? 'New login (leave blank to keep; hidden in list)' : 'Login *'}
              value={editing.login || ''}
              onChange={(e) => setEditing({ ...editing, login: e.target.value })}
              autoComplete="off"
            />
            <Input label="Contact number (optional, 11 digits)" value={editing.contact_number || ''} onChange={(e) => setEditing({ ...editing, contact_number: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
            <Select label="Role" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value, department_id: '', clinic_id: '' })}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
            {editing.role === ROLES.DEPARTMENT_SECRETARY ? (
              <Select label="Office *" value={editing.department_id} onChange={(e) => setEditing({ ...editing, department_id: e.target.value })}>
                <option value="">Select office</option>
                {(departments.data || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            ) : null}
            {editing.role === ROLES.DOCTOR ? (
              <>
                <Select label="Clinic *" value={editing.clinic_id} onChange={(e) => setEditing({ ...editing, clinic_id: e.target.value })}>
                  <option value="">Select clinic</option>
                  {(clinics.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input label="Specialty (optional)" value={editing.specialty || ''} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} />
              </>
            ) : null}
            {editing.role !== ROLES.DEPARTMENT_SECRETARY && editing.role !== ROLES.DOCTOR ? (
              <p className="text-xs text-slate-500">Office / clinic: none for this role.</p>
            ) : null}
            <Input
              label={editing.id ? 'New password (leave blank to keep)' : 'Password (default 12345678)'}
              type="password"
              value={editing.password}
              onChange={(e) => setEditing({ ...editing, password: e.target.value })}
              hint="At least 8 characters with letters and numbers"
            />
            {editing.id ? (
              <Input
                label="Your administrator password (required to change login or password)"
                type="password"
                value={editing.admin_password || ''}
                onChange={(e) => setEditing({ ...editing, admin_password: e.target.value })}
              />
            ) : null}
            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export function AuditLogsPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [date, setDate] = useState(todayIso())
  const { data, loading, error, reload } = useAsync(() => auditApi.list({ q, role, ...(date ? { date } : {}) }), [q, role, date])
  const action = useAction()
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Who did what, and when"
        actions={date ? (
          <>
            <Button variant="secondary" onClick={() => action.run('pdf', () => reportsApi.downloadDailyPdf('audit', date))}>PDF</Button>
            <Button variant="secondary" onClick={() => action.run('csv', () => reportsApi.downloadCsv('audit', date, date))}>CSV</Button>
          </>
        ) : null}
      />
      {action.error ? <p className="text-sm text-red-600 mb-3">{action.error}</p> : null}
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search user, action, record, details…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <p className="text-sm text-slate-500 mb-3">{(data || []).length} log entries</p>
        <Table
          rows={data || []}
          columns={[
            { key: 'timestamp', label: 'TIMESTAMP', render: (row) => formatDateTime(row.timestamp) },
            { key: 'user_name', label: 'USER', render: (row) => row.user_name || 'System' },
            { key: 'role', label: 'ROLE', render: (row) => ROLE_LABELS[row.role] || row.role || '—' },
            { key: 'action', label: 'ACTION' },
            { key: 'record', label: 'RECORD' },
            { key: 'status', label: 'STATUS' },
            { key: 'details', label: 'DETAILS' },
          ]}
        />
      </Card>
    </div>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const { data, loading, error, reload, setData } = useAsync(() => settingsApi.get(), [])
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  async function save() {
    setMessage('')
    setSaveError('')
    try {
      setData(await settingsApi.update(data))
      setMessage('Settings saved.')
    } catch (err) {
      setSaveError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>General</CardTitle>
          <div className="space-y-3">
            <Input label="Hospital name (shown on reports)" value={data.hospital_name || ''} onChange={(e) => setData({ ...data, hospital_name: e.target.value })} />
            <Input label="Minor age (guardian required for patients below this age)" type="number" min="1" max="21" value={data.minor_age_threshold?.years ?? 18} onChange={(e) => setData({ ...data, minor_age_threshold: { years: Number(e.target.value) } })} />
          </div>
        </Card>
        <Card>
          <CardTitle>Backups</CardTitle>
          <Input label="Keep backups for (days)" type="number" min="1" max="365" value={data.backup_retention_days?.days ?? 30} onChange={(e) => setData({ ...data, backup_retention_days: { days: Number(e.target.value) } })} hint="Older backup files are deleted automatically after each nightly backup." />
          <dl className="text-sm space-y-2 mt-4">
            <div className="flex justify-between"><dt>Signed in as</dt><dd>{user.name}</dd></div>
            <div className="flex justify-between"><dt>Role</dt><dd>{ROLE_LABELS[user.role]}</dd></div>
          </dl>
        </Card>
      </div>
      {message ? <p className="text-sm text-emerald-600 mt-4">{message}</p> : null}
      {saveError ? <p className="text-sm text-red-600 mt-4">{saveError}</p> : null}
      <Button className="mt-4" onClick={save}>Save Settings</Button>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-slate-500 mt-2">Page not found</p>
    </div>
  )
}
