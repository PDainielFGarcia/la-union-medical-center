import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { getErrorMessage } from '../../utils/errors'

/**
 * Confirmation dialog. `action` is { title, message, confirmLabel?, variant?, run: async () => void }.
 * Pass null to close. Errors thrown by run() are shown inside the dialog.
 */
export function ConfirmModal({ action, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function close() {
    if (busy) return
    setError('')
    onClose()
  }

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await action.run()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={Boolean(action)}
      title={action?.title || ''}
      onClose={close}
      footer={(
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button variant={action?.variant || 'primary'} onClick={confirm} disabled={busy}>
            {busy ? 'Working…' : action?.confirmLabel || 'Confirm'}
          </Button>
        </>
      )}
    >
      <p className="text-sm text-slate-600">{action?.message}</p>
      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
    </Modal>
  )
}
