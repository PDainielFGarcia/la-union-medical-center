import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { visitorsApi } from '../api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { Input, Select } from '../components/ui/FormFields'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { Table } from '../components/ui/Table'
import { PendingVisitQueue, VisitorDetailCard } from '../components/PendingVisitQueue'
import { Modal } from '../components/ui/Modal'
import { usePolling } from '../hooks/usePolling'
import { QrScanner } from '../components/QrScanner'
import { RejectReasonModal } from '../components/RejectReasonModal'
import { VisitorPassCard } from '../components/VisitorPassCard'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../auth/AuthContext'
import { ROLES, VISITOR_STATUSES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'
import { titleCaseStatus } from '../utils/format'
import { todayIso } from '../utils/visitorPass'

export function VisitorScanPage() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])

  async function handleScan(value) {
    setBusy(true)
    try {
      const res = await visitorsApi.scanToken(value)
      setResult({ ok: true, action: res.action, message: res.message, visit: res.visit })
      setLog((items) => [{ at: new Date(), action: res.action, visit: res.visit }, ...items].slice(0, 15))
    } catch (err) {
      setResult({ ok: false, message: getErrorMessage(err), visit: err?.details?.visit })
    } finally {
      setBusy(false)
    }
  }

  const tone = !result ? '' : result.ok ? (result.action === 'entry' ? 'border-emerald-300 bg-emerald-50' : 'border-blue-300 bg-blue-50') : 'border-red-300 bg-red-50'

  return (
    <div>
      <PageHeader title="Scan Visitor Pass" subtitle="First scan records entry, the second scan records exit. Passes are valid on the visit day only." />
      <div className="grid xl:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Scanner</CardTitle>
          <QrScanner onScan={handleScan} busy={busy} />
        </Card>
        <Card className={`border-2 ${tone}`}>
          <CardTitle>Result</CardTitle>
          {!result ? <p className="text-sm text-slate-500">Waiting for a scan…</p> : (
            <div className="space-y-2">
              <p className={`text-xl font-bold ${result.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.ok ? (result.action === 'entry' ? 'ENTRY ALLOWED' : 'EXIT RECORDED') : 'NOT ALLOWED'}
              </p>
              <p className="text-sm">{result.message}</p>
              {result.visit ? (
                <div className="text-sm pt-2 border-t">
                  <p className="font-semibold">{result.visit.full_name} · {result.visit.pass_id}</p>
                  <p>{result.visit.department}{result.visit.person_to_visit ? ` · ${result.visit.person_to_visit}` : ''}</p>
                  <p className="text-slate-500">Entry {result.visit.entry_time || '—'} · Exit {result.visit.exit_time || '—'}</p>
                  {result.visit.vehicle_plate ? <p>Vehicle {result.visit.vehicle_plate} · {result.visit.parking_area}</p> : null}
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
      <Card className="mt-4">
        <CardTitle>Scans this session</CardTitle>
        <Table
          rows={log.map((item, index) => ({ id: index, ...item }))}
          empty="No scans yet."
          columns={[
            { key: 'at', label: 'TIME', render: (row) => row.at.toLocaleTimeString() },
            { key: 'action', label: 'ACTION', render: (row) => <Badge tone={row.action === 'entry' ? 'success' : 'info'}>{row.action === 'entry' ? 'Entry' : 'Exit'}</Badge> },
            { key: 'name', label: 'VISITOR', render: (row) => row.visit?.full_name },
            { key: 'pass', label: 'PASS', render: (row) => row.visit?.pass_id },
            { key: 'dept', label: 'OFFICE / PATIENT LOCATION', render: (row) => row.visit?.department },
          ]}
        />
      </Card>
    </div>
  )
}

export function VisitorApprovalsPage() {
  const { user } = useAuth()
  const [viewing, setViewing] = useState(null)
  const today = useAsync(() => visitorsApi.list({ date: todayIso() }), [])
  usePolling(today.reload, 8000)
  const rows = (today.data || []).filter((item) => item.status !== 'pending_approval')

  return (
    <div>
      <PageHeader
        title="Visitor Approvals"
        subtitle={user.role === ROLES.ADMINISTRATOR ? 'All offices and patient visits' : `Visitors registered at the gate to see ${user.department || 'your office'}`}
      />
      <div className="mb-4">
        <PendingVisitQueue title="Waiting for your approval" canReview />
      </div>
      <Card>
        <CardTitle>Today's Decisions</CardTitle>
        <Table
          rows={rows}
          empty="No approved or rejected visits yet today."
          columns={[
            { key: 'pass_id', label: 'PASS ID' },
            { key: 'full_name', label: 'VISITOR' },
            { key: 'person_to_visit', label: 'TO SEE', render: (row) => row.person_to_visit || '—' },
            { key: 'purpose', label: 'PURPOSE' },
            { key: 'reviewed_by', label: 'REVIEWED BY', render: (row) => row.reviewed_by || '—' },
            { key: 'entry_time', label: 'ENTRY', render: (row) => row.entry_time || '—' },
            { key: 'exit_time', label: 'EXIT', render: (row) => row.exit_time || '—' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status}>{row.status === 'rejected' && row.rejection_reason ? `Rejected: ${row.rejection_reason}` : titleCaseStatus(row.status)}</Badge> },
            { key: 'actions', label: '', render: (row) => <Button size="sm" variant="secondary" onClick={() => setViewing(row)}>Details</Button> },
          ]}
        />
      </Card>
      <Modal open={Boolean(viewing)} title="Visitor Information" onClose={() => setViewing(null)} footer={<Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing ? <VisitorDetailCard visitor={viewing} /> : null}
      </Modal>
    </div>
  )
}

export function CurrentVisitorsPage() {
  const [q, setQ] = useState('')
  const [turningAway, setTurningAway] = useState(null)
  const [viewing, setViewing] = useState(null)
  const { data, loading, error, reload } = useAsync(() => visitorsApi.list({ date: todayIso() }), [])
  usePolling(reload)
  const rows = useMemo(
    () => (data || []).filter((item) => ['pending_approval', 'approved', 'inside'].includes(item.status)
      && `${item.full_name} ${item.pass_id} ${item.department} ${item.person_to_visit || ''} ${item.contact_number}`.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  )

  async function manualScan(row) {
    const label = row.status === 'approved' ? 'entry' : 'exit'
    if (!window.confirm(`Record ${label} for ${row.full_name} without scanning the QR?`)) return
    try {
      await visitorsApi.manualScan(row.id)
      reload({ silent: true })
    } catch (err) {
      window.alert(getErrorMessage(err))
    }
  }

  async function cancelVisit(row) {
    if (!window.confirm(`Cancel the visit of ${row.full_name}? Use this if the visitor left or the entry was a mistake.`)) return
    try {
      await visitorsApi.cancel(row.id)
      reload({ silent: true })
    } catch (err) {
      window.alert(getErrorMessage(err))
    }
  }

  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  const count = (status) => (data || []).filter((item) => item.status === status).length

  return (
    <div>
      <PageHeader title="Today's Visitors" subtitle="Visitors waiting for approval, approved (QR issued), and currently inside" actions={<Link to="/scan"><Button>Open Scanner</Button></Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Waiting Approval" value={count('pending_approval')} tone="amber" />
        <StatCard label="Approved (QR ready)" value={count('approved')} tone="blue" />
        <StatCard label="Inside" value={count('inside')} tone="green" />
        <StatCard label="Exited Today" value={count('completed')} tone="slate" />
      </div>
      <Card>
        <div className="mb-4 max-w-sm">
          <Input placeholder="Search name, pass ID, office, patient, contact…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search visitors" />
        </div>
        <Table
          rows={rows}
          empty="No active visitors."
          columns={[
            { key: 'pass_id', label: 'PASS ID' },
            { key: 'full_name', label: 'NAME' },
            { key: 'department', label: 'OFFICE / PATIENT LOCATION' },
            { key: 'person_to_visit', label: 'VISITING', render: (row) => row.person_to_visit || '—' },
            { key: 'purpose', label: 'PURPOSE' },
            { key: 'vehicle_plate', label: 'VEHICLE', render: (row) => row.vehicle_plate ? `${row.vehicle_plate}${row.parking_area ? ` · ${row.parking_area}` : ''}` : '—' },
            { key: 'entry_time', label: 'ENTRY', render: (row) => row.entry_time || '—' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status} /> },
            { key: 'actions', label: 'ACTIONS', render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setViewing(row)}>Details</Button>
                {row.status === 'approved' ? <Link to={`/visitor-pass/${row.id}`}><Button size="sm">Give QR Pass</Button></Link> : null}
                {['approved', 'inside'].includes(row.status) ? (
                  <Button size="sm" variant="secondary" onClick={() => manualScan(row)}>{row.status === 'approved' ? 'Manual Entry' : 'Manual Exit'}</Button>
                ) : null}
                {['pending_approval', 'approved'].includes(row.status) ? (
                  <Button size="sm" variant="danger" onClick={() => setTurningAway(row)}>Turn Away</Button>
                ) : null}
                {['pending_approval', 'approved'].includes(row.status) ? (
                  <Button size="sm" variant="ghost" onClick={() => cancelVisit(row)}>Cancel</Button>
                ) : null}
              </div>
            ) },
          ]}
        />
      </Card>
      <Modal open={Boolean(viewing)} title="Visitor Information" onClose={() => setViewing(null)} footer={<Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing ? <VisitorDetailCard visitor={viewing} /> : null}
      </Modal>
      <RejectReasonModal
        open={Boolean(turningAway)}
        appliesTo="guard_gate"
        title={turningAway ? `Turn away ${turningAway.full_name}` : ''}
        onClose={() => setTurningAway(null)}
        onSubmit={async (body) => {
          await visitorsApi.gateReject(turningAway.id, body)
          await reload({ silent: true })
        }}
      />
    </div>
  )
}

export function VisitorHistoryPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [date, setDate] = useState('')
  const [viewing, setViewing] = useState(null)
  const { data, loading, error, reload } = useAsync(() => visitorsApi.list({ q, status, ...(date ? { date } : {}) }), [q, status, date])

  if (loading && !data) return <LoadingState />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  return (
    <div>
      <PageHeader title="Visitor History" subtitle="All visitor registrations, approvals, and gate scans" />
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input placeholder="Search by name or pass ID…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Visit date" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="all">All Statuses</option>
            {VISITOR_STATUSES.map((item) => <option key={item} value={item}>{titleCaseStatus(item)}</option>)}
          </Select>
        </div>
        <p className="text-sm text-slate-500 mb-3">{(data || []).length} records found</p>
        <Table
          rows={data || []}
          columns={[
            { key: 'pass_id', label: 'PASS ID' },
            { key: 'full_name', label: 'NAME' },
            { key: 'department', label: 'OFFICE / PATIENT LOCATION' },
            { key: 'purpose', label: 'PURPOSE' },
            { key: 'visit_date', label: 'DATE' },
            { key: 'reviewed_by', label: 'REVIEWED BY', render: (row) => row.reviewed_by || '—' },
            { key: 'entry_time', label: 'ENTRY', render: (row) => row.entry_time || '—' },
            { key: 'exit_time', label: 'EXIT', render: (row) => row.exit_time || '—' },
            { key: 'status', label: 'STATUS', render: (row) => <Badge status={row.status}>{titleCaseStatus(row.status)}</Badge> },
            { key: 'actions', label: '', render: (row) => <Button size="sm" variant="secondary" onClick={() => setViewing(row)}>Details</Button> },
          ]}
        />
      </Card>
      <Modal open={Boolean(viewing)} title="Visitor Information" onClose={() => setViewing(null)} footer={<Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing ? <VisitorDetailCard visitor={viewing} /> : null}
      </Modal>
    </div>
  )
}

export function VisitorPassPage() {
  const { id } = useParams()
  const { data, loading, error, reload } = useAsync(() => visitorsApi.getPass(id), [id])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader
        title="Visitor Pass"
        subtitle="Print this pass or let the visitor take a photo of the QR."
        actions={<><Button variant="secondary" onClick={reload}>Refresh</Button><Button onClick={() => window.print()}>Print Pass</Button></>}
      />
      <VisitorPassCard visit={data} />
    </div>
  )
}
