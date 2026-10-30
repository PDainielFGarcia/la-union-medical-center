import { useState } from 'react'
import { Link } from 'react-router-dom'
import { visitorsApi } from '../api'
import { useAsync } from '../hooks/useAsync'
import { usePolling } from '../hooks/usePolling'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardTitle } from './ui/Card'
import { Modal } from './ui/Modal'
import { RejectReasonModal } from './RejectReasonModal'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime, titleCaseStatus } from '../utils/format'
import { todayIso } from '../utils/visitorPass'

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 break-words">{children || '—'}</dd>
    </div>
  )
}

function visitorName(item) {
  const parts = [item.first_name, item.middle_name, item.last_name].filter(Boolean)
  return parts.length ? parts.join(' ') : item.full_name
}

/** Full visitor card shown in a modal. */
export function VisitorDetailCard({ visitor }) {
  const isPatientVisit = visitor.visit_type === 'patient'
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-slate-900">{visitorName(visitor)}</p>
          <p className="text-sm text-slate-500">{visitor.pass_id}</p>
        </div>
        <Badge status={visitor.status}>{titleCaseStatus(visitor.status)}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Detail label="First name">{visitor.first_name}</Detail>
        <Detail label="Middle name">{visitor.middle_name}</Detail>
        <Detail label="Last name">{visitor.last_name}</Detail>
        <Detail label="Age">{visitor.age != null ? `${visitor.age} y/o` : null}</Detail>
        <Detail label="Contact number">{visitor.contact_number}</Detail>
        <Detail label="Visit type">{isPatientVisit ? 'Patient visit' : 'Office transaction'}</Detail>
        <Detail label={isPatientVisit ? 'Patient / location' : 'Office'}>{visitor.department}</Detail>
        <Detail label="Person to see">{visitor.person_to_visit}</Detail>
        <div className="col-span-2"><Detail label="Purpose">{visitor.purpose}</Detail></div>
        <Detail label="ID presented">{visitor.id_type}</Detail>
        <Detail label="ID number">{visitor.id_number}</Detail>
        <div className="col-span-2"><Detail label="Address">{visitor.address}</Detail></div>
        <Detail label="Registered">{visitor.created_at ? formatDateTime(visitor.created_at) : null}</Detail>
        <Detail label="Visit date">{visitor.visit_date}</Detail>
        {visitor.reviewed_at ? <Detail label="Reviewed">{formatDateTime(visitor.reviewed_at)}</Detail> : null}
        {visitor.entry_time ? <Detail label="Entry">{visitor.entry_time}</Detail> : null}
        {visitor.exit_time ? <Detail label="Exit">{visitor.exit_time}</Detail> : null}
        {visitor.vehicle_plate ? <Detail label="Vehicle">{`${visitor.vehicle_plate}${visitor.parking_area ? ` · ${visitor.parking_area}` : ''}`}</Detail> : null}
        {visitor.rejection_reason || visitor.rejection_notes ? (
          <div className="col-span-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <Detail label="Rejection reason">
              {[visitor.rejection_reason, visitor.rejection_notes].filter(Boolean).join(' — ')}
            </Detail>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

/**
 * canReview: office secretary/admin view with approve + reject (from the visitor card).
 * Otherwise (guard) it is a read-only "waiting for approval" list.
 */
export function PendingVisitQueue({ title = 'Waiting for office approval', canReview = false }) {
  const { data, loading, error, reload } = useAsync(() => visitorsApi.list({ status: 'pending_approval', date: todayIso() }), [])
  const [selectedId, setSelectedId] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  usePolling(reload)
  const pending = data || []
  const selected = pending.find((item) => item.id === selectedId) || null

  function closeCard() {
    setSelectedId(null)
    setActionError('')
  }

  async function approve(id) {
    setActionError('')
    setBusy(true)
    try {
      await visitorsApi.approve(id)
      closeCard()
      await reload({ silent: true })
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardTitle>{title}{pending.length ? ` (${pending.length})` : ''}</CardTitle>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading && !data ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {pending.length ? pending.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setSelectedId(item.id)}
          className="w-full text-left border border-slate-200 rounded-xl p-4 mb-3 last:mb-0 hover:border-blue-400 hover:bg-blue-50/40 transition"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{visitorName(item)} {item.age ? `(${item.age} y/o)` : ''}</p>
              <p className="text-sm text-slate-500">{item.pass_id} · registered {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-sm text-slate-600">{item.department} · {item.purpose}{item.person_to_visit ? ` · to see ${item.person_to_visit}` : ''}</p>
              <p className="text-xs text-blue-600 mt-1">Click to view full details{canReview ? ' and approve / reject' : ''}</p>
            </div>
            <Badge status={item.status}>{titleCaseStatus(item.status)}</Badge>
          </div>
        </button>
      )) : (!loading ? <p className="text-sm text-slate-500">No visitors waiting for approval.</p> : null)}

      <Modal
        open={Boolean(selected)}
        title="Visitor details"
        onClose={closeCard}
        footer={selected ? (
          canReview ? (
            <>
              <Button variant="secondary" onClick={closeCard} disabled={busy}>Close</Button>
              <Button variant="danger" disabled={busy} onClick={() => { setRejecting(selected); closeCard() }}>Reject</Button>
              <Button disabled={busy} onClick={() => approve(selected.id)}>{busy ? 'Approving…' : 'Approve & issue QR'}</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={closeCard}>Close</Button>
              <Link to={`/visitor-pass/${selected.id}`}><Button>View pass</Button></Link>
            </>
          )
        ) : null}
      >
        {selected ? <VisitorDetailCard visitor={selected} /> : null}
        {actionError ? <p className="text-sm text-red-600 mt-3">{actionError}</p> : null}
      </Modal>

      <RejectReasonModal
        open={Boolean(rejecting)}
        title={rejecting ? `Reject ${visitorName(rejecting)}` : ''}
        onClose={() => setRejecting(null)}
        onSubmit={async (body) => {
          await visitorsApi.reject(rejecting.id, body)
          await reload({ silent: true })
        }}
      />
    </Card>
  )
}
