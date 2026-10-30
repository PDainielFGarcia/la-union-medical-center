import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auditApi, parkingApi, vehiclesApi, visitorsApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { Input, Select } from '../components/ui/FormFields'
import { LoadingState } from '../components/ui/LoadingState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { PendingVisitQueue } from '../components/PendingVisitQueue'
import { usePolling } from '../hooks/usePolling'
import { StatCard } from '../components/ui/StatCard'
import { Table } from '../components/ui/Table'
import { useAsync } from '../hooks/useAsync'
import { VEHICLE_TYPES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime } from '../utils/format'
import { todayIso } from '../utils/visitorPass'

export function SecurityDashboardPage() {
  const visitors = useAsync(() => visitorsApi.list({ date: todayIso() }), [])
  const parking = useAsync(() => parkingApi.list({ active_only: 1 }), [])
  usePolling(visitors.reload)

  if (visitors.loading && !visitors.data) return <LoadingState />
  if (visitors.error && !visitors.data) return <ErrorState message={visitors.error} onRetry={visitors.reload} />
  const list = visitors.data || []
  const approved = list.filter((item) => item.status === 'approved')
  const inside = list.filter((item) => item.status === 'inside')

  return (
    <div>
      <PageHeader
        title="Guard Dashboard"
        subtitle="Register walk-in visitors, hand out QR passes once approved, and scan passes at entry and exit."
        actions={<><Link to="/visitors"><Button variant="secondary">Register Visitor</Button></Link><Link to="/scan"><Button>Scan QR</Button></Link></>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Waiting Approval" value={list.filter((i) => i.status === 'pending_approval').length} tone="amber" />
        <StatCard label="Approved — give QR" value={approved.length} tone="blue" />
        <StatCard label="Inside Now" value={inside.length} tone="green" />
        <StatCard label="Exited Today" value={list.filter((i) => i.status === 'completed').length} tone="slate" />
      </div>
      <div className="grid xl:grid-cols-2 gap-4 mb-4">
        <PendingVisitQueue />
        <Card>
          <CardTitle>Approved — hand out QR pass</CardTitle>
          {approved.length ? approved.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium">{item.full_name} <span className="text-xs text-slate-400">{item.pass_id}</span></p>
                <p className="text-xs text-slate-500">{item.department} · approved by {item.reviewed_by}</p>
              </div>
              <Link to={`/visitor-pass/${item.id}`}><Button size="sm">Open Pass</Button></Link>
            </div>
          )) : <p className="text-sm text-slate-500">No approved visitors waiting for their pass.</p>}
        </Card>
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Visitors Currently Inside</CardTitle>
          {inside.length ? inside.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium">{item.full_name}</p>
                <p className="text-xs text-slate-500">Entered {item.entry_time} · {item.department}</p>
              </div>
              <Badge status="inside" />
            </div>
          )) : <p className="text-sm text-slate-500">No visitors currently inside.</p>}
        </Card>
        <Card>
          <CardTitle>Parking Availability</CardTitle>
          {(parking.data || []).map((area) => (
            <div key={area.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
              <span>{area.name}</span>
              <span className="font-medium">{area.parked} parked{area.capacity != null ? ` · ${area.available} free of ${area.capacity}` : ''}</span>
            </div>
          ))}
          <Link to="/vehicles" className="inline-block mt-3"><Button size="sm" variant="secondary">Manage Vehicles</Button></Link>
        </Card>
      </div>
    </div>
  )
}

const emptyVehicle = { plate_number: '', type: VEHICLE_TYPES[0], color: '', owner: '', owner_type: 'visitor', parking_area_id: '', slot_number: '' }

export function VehiclesPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('parked')
  const [areaId, setAreaId] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyVehicle)
  const [formError, setFormError] = useState('')
  const areas = useAsync(() => parkingApi.list(), [])
  const { data, loading, error, reload } = useAsync(
    () => vehiclesApi.list({ q, status, ...(areaId ? { parking_area_id: areaId } : {}) }),
    [q, status, areaId],
  )

  async function create() {
    setFormError('')
    if (!form.plate_number.trim() || !form.parking_area_id) {
      setFormError('Plate number and parking area are required.')
      return
    }
    try {
      await vehiclesApi.create({ ...form, parking_area_id: Number(form.parking_area_id) })
      setOpen(false)
      setForm(emptyVehicle)
      reload()
      areas.reload({ silent: true })
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  async function logExit(row) {
    await vehiclesApi.exit(row.id)
    reload()
    areas.reload({ silent: true })
  }

  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  return (
    <div>
      <PageHeader title="Vehicles & Parking" subtitle="Plate numbers and parking locations of visitor and patient vehicles" actions={<Button onClick={() => setOpen(true)}>Record Vehicle</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {(areas.data || []).filter((a) => a.is_active).map((area) => (
          <StatCard key={area.id} label={area.name} value={area.parked} hint={area.capacity != null ? `${area.available} of ${area.capacity} free` : 'No set capacity'} />
        ))}
      </div>
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search plate or owner…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="parked">Currently parked</option>
            <option value="exited">Exited</option>
            <option value="all">All</option>
          </Select>
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-label="Parking area">
            <option value="">All parking areas</option>
            {(areas.data || []).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </Select>
        </div>
        <Table
          rows={data || []}
          empty="No vehicles."
          columns={[
            { key: 'plate_number', label: 'PLATE NO.' },
            { key: 'type', label: 'TYPE' },
            { key: 'owner', label: 'OWNER', render: (row) => (
              <div>
                <p>{row.owner || '—'}</p>
                <p className="text-xs text-slate-400">{row.owner_type}{row.visitor_pass_id ? ` · ${row.visitor_pass_id}` : ''}{row.patient_number ? ` · ${row.patient_number}` : ''}</p>
              </div>
            ) },
            { key: 'parking_area', label: 'PARKING', render: (row) => `${row.parking_area || '—'}${row.slot_number ? ` · ${row.slot_number}` : ''}` },
            { key: 'entry_time', label: 'IN' },
            { key: 'exit_time', label: 'OUT', render: (row) => row.exit_time || '—' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
            { key: 'actions', label: '', render: (row) => row.status === 'parked' ? <Button size="sm" variant="secondary" onClick={() => logExit(row)}>Log Exit</Button> : null },
          ]}
        />
      </Card>
      <Modal open={open} title="Record Vehicle" onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Save</Button></>}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Plate number *" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value.toUpperCase() })} />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {VEHICLE_TYPES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="Belongs to" value={form.owner_type} onChange={(e) => setForm({ ...form, owner_type: e.target.value })}>
            <option value="visitor">Visitor</option>
            <option value="patient">Patient</option>
            <option value="employee">Employee</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Owner / driver name" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Select label="Parking area *" value={form.parking_area_id} onChange={(e) => setForm({ ...form, parking_area_id: e.target.value })}>
            <option value="">Select area</option>
            {(areas.data || []).filter((a) => a.is_active).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </Select>
          <Input label="Slot no." value={form.slot_number} onChange={(e) => setForm({ ...form, slot_number: e.target.value })} />
          <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          {formError ? <p className="col-span-2 text-sm text-red-600">{formError}</p> : null}
        </div>
      </Modal>
    </div>
  )
}

export function SecurityLogsPage() {
  const [q, setQ] = useState('')
  const [date, setDate] = useState(todayIso())
  const { data, loading, error, reload } = useAsync(() => auditApi.list({ q, date }), [q, date])
  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Security Logs" subtitle="Visitor and vehicle activity at the gate" />
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search by user or record…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        </div>
        <p className="text-sm text-slate-500 mb-3">{(data || []).length} log entries</p>
        <Table
          rows={data || []}
          columns={[
            { key: 'timestamp', label: 'TIMESTAMP', render: (row) => formatDateTime(row.timestamp) },
            { key: 'user_name', label: 'USER' },
            { key: 'action', label: 'ACTION' },
            { key: 'record', label: 'RECORD' },
            { key: 'details', label: 'DETAILS' },
          ]}
        />
      </Card>
    </div>
  )
}
