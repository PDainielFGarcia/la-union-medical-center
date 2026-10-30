import { useState } from 'react'
import { catalogApi, doctorsApi } from '../api'
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
import { usePolling } from '../hooks/usePolling'
import { useAuth } from '../auth/AuthContext'
import { DOCTOR_STATUSES, ROLES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'
import { titleCaseStatus } from '../utils/format'

export function DoctorListPage() {
  const { data, loading, error, reload } = useAsync(() => doctorsApi.list(), [])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Doctor List" subtitle="Directory of doctors, clinics, and current status" />
      <Card>
        <Table
          rows={data}
          columns={[
            { key: 'name', label: 'DOCTOR' },
            { key: 'specialty', label: 'SPECIALTY', render: (row) => row.specialty || '—' },
            { key: 'clinic', label: 'CLINIC', render: (row) => row.clinic || '—' },
            { key: 'schedule', label: 'SCHEDULE' },
            { key: 'waiting_count', label: 'QUEUE', render: (row) => `${row.waiting_count} waiting` },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
          ]}
        />
      </Card>
    </div>
  )
}

export function DoctorSchedulesPage() {
  return <DoctorListPage />
}

function canChangeAvailability(user, doctor) {
  if (!user) return false
  if ([ROLES.ADMINISTRATOR, ROLES.OPD_STAFF].includes(user.role)) return true
  if (user.role === ROLES.DOCTOR) {
    return user.doctor_id != null && String(doctor.id) === String(user.doctor_id)
  }
  return false
}

export function DoctorAvailabilityPage() {
  const { user } = useAuth()
  const canManageAny = [ROLES.ADMINISTRATOR, ROLES.OPD_STAFF].includes(user?.role)
  const { data, loading, error, reload, setData } = useAsync(() => doctorsApi.list(), [])
  const clinics = useAsync(() => catalogApi.clinics(), [])
  const assignable = useAsync(() => (canManageAny ? doctorsApi.assignableUsers() : Promise.resolve([])), [canManageAny])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ user_id: '', primary_clinic_id: '', specialty: '' })
  const [actionError, setActionError] = useState('')
  usePolling(reload, 5000)
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  async function changeStatus(doctor, status) {
    if (!canChangeAvailability(user, doctor) || doctor.status === status) return
    setActionError('')
    try {
      const updated = await doctorsApi.update(doctor.id, { status })
      setData((current) => (current || []).map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function assignDoctor() {
    setActionError('')
    if (!form.user_id || !form.primary_clinic_id) {
      setActionError('Select a doctor account and a clinic.')
      return
    }
    try {
      const created = await doctorsApi.create({
        user_id: Number(form.user_id),
        primary_clinic_id: Number(form.primary_clinic_id),
        specialty: form.specialty || null,
      })
      setData((current) => {
        const list = current || []
        const idx = list.findIndex((d) => d.id === created.id)
        if (idx >= 0) {
          const next = [...list]
          next[idx] = created
          return next
        }
        return [...list, created]
      })
      setOpen(false)
      setForm({ user_id: '', primary_clinic_id: '', specialty: '' })
      assignable.reload?.()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Doctor Availability"
        subtitle={canManageAny
          ? 'Set availability for any doctor. Assign or reassign doctor accounts to clinics.'
          : 'You can only change your own availability.'}
        actions={canManageAny ? <Button onClick={() => setOpen(true)}>Assign Doctor to Clinic</Button> : null}
      />
      <div className="grid grid-cols-2 gap-4 mb-4 max-w-xl">
        <StatCard label="Available" value={(data || []).filter((d) => d.status === 'available').length} tone="green" />
        <StatCard label="Unavailable" value={(data || []).filter((d) => d.status !== 'available').length} tone="rose" />
      </div>
      {actionError ? <p className="text-sm text-red-600 mb-3">{actionError}</p> : null}
      <Card>
        <Table
          rows={data || []}
          columns={[
            { key: 'name', label: 'DOCTOR' },
            { key: 'specialty', label: 'SPECIALTY', render: (row) => row.specialty || '—' },
            { key: 'clinic', label: 'CLINIC', render: (row) => row.clinic || '—' },
            { key: 'waiting_count', label: 'QUEUE', render: (row) => `${row.waiting_count} waiting` },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status}>{titleCaseStatus(row.status)}</Badge> },
            { key: 'change', label: 'CHANGE STATUS', render: (row) => (
              canChangeAvailability(user, row) ? (
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden" role="group" aria-label={`Availability for ${row.name}`}>
                  {DOCTOR_STATUSES.map((status) => {
                    const active = row.status === status
                    const activeTone = status === 'available' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    return (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={active}
                        onClick={() => changeStatus(row, status)}
                        className={`px-3 py-1.5 text-xs font-medium transition ${active ? activeTone : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                      >
                        {titleCaseStatus(status)}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )
            ) },
          ]}
        />
        <p className="text-xs text-slate-500 mt-4">All doctors are system users. Nurses cannot change availability.</p>
      </Card>
      <Modal
        open={open}
        title="Assign Doctor to Clinic"
        onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={assignDoctor}>Assign</Button></>}
      >
        <div className="space-y-3">
          <Select label="Doctor account *" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
            <option value="">Select doctor user</option>
            {(assignable.data || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}{u.already_linked ? ' (reassign)' : ''}
              </option>
            ))}
          </Select>
          <Select label="Clinic *" value={form.primary_clinic_id} onChange={(e) => setForm({ ...form, primary_clinic_id: e.target.value })}>
            <option value="">Select clinic</option>
            {(clinics.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Specialty (optional)" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          {!(assignable.data || []).length ? <p className="text-sm text-amber-700">Ask an administrator to create a user with the Doctor role (Users & Roles), then assign them here.</p> : null}
        </div>
      </Modal>
    </div>
  )
}
