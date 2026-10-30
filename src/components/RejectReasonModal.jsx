import { useEffect, useState } from 'react'
import { catalogApi } from '../api'
import { Button } from './ui/Button'
import { Select, Textarea } from './ui/FormFields'
import { Modal } from './ui/Modal'
import { getErrorMessage } from '../utils/errors'

export function RejectReasonModal({ open, title = 'Reject visit', appliesTo = 'visitor_request', onClose, onSubmit }) {
  const [reasons, setReasons] = useState([])
  const [reasonId, setReasonId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setNotes('')
    setError('')
    catalogApi.rejectionReasons(appliesTo).then((items) => {
      setReasons(items)
      setReasonId(items[0]?.id ? String(items[0].id) : '')
    }).catch((err) => setError(getErrorMessage(err)))
  }, [open, appliesTo])

  const selected = reasons.find((item) => String(item.id) === reasonId)

  async function submit() {
    if (selected?.allows_custom_text && reasonId && !notes.trim()) {
      setError('Please describe the reason.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        rejection_reason_id: reasonId ? Number(reasonId) : null,
        rejection_notes: notes || null,
      })
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Reject'}</Button></>}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-500">A rejection reason is optional. You may reject without selecting one.</p>
        <Select label="Reason (optional)" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
          <option value="">No reason selected</option>
          {reasons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
        <Textarea label={selected?.allows_custom_text ? 'Details *' : 'Notes (optional)'} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Modal>
  )
}
