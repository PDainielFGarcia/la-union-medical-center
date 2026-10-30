import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from './ui/Button'

const REGION_ID = 'lumc-qr-region'

/**
 * Two input paths:
 * - USB/Bluetooth handheld scanners behave like a keyboard: they type the payload and press Enter.
 * - Device camera via html5-qrcode (needs https or localhost for camera permission).
 */
export function QrScanner({ onScan, busy }) {
  const [manual, setManual] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const inputRef = useRef(null)
  const scannerRef = useRef(null)
  const lastRef = useRef({ value: '', at: 0 })
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!busy) inputRef.current?.focus()
  }, [busy])

  useEffect(() => {
    if (!cameraOn) return undefined
    const scanner = new Html5Qrcode(REGION_ID)
    scannerRef.current = scanner
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          const now = Date.now()
          if (text === lastRef.current.value && now - lastRef.current.at < 4000) return
          lastRef.current = { value: text, at: now }
          onScanRef.current(text)
        },
        () => {},
      )
      .catch((err) => {
        setCameraError(String(err?.message || err || 'Unable to start camera.'))
        setCameraOn(false)
      })
    return () => {
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      }
    }
  }, [cameraOn])

  function submitManual(event) {
    event.preventDefault()
    const value = manual.trim()
    if (!value) return
    setManual('')
    onScan(value)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submitManual} className="flex gap-2">
        <input
          ref={inputRef}
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Scan with the handheld scanner or paste the QR code text"
          aria-label="QR code value"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={busy}
          autoComplete="off"
        />
        <Button type="submit" disabled={busy || !manual.trim()}>Submit</Button>
      </form>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => { setCameraError(''); setCameraOn((on) => !on) }}>
          {cameraOn ? 'Stop camera' : 'Use camera'}
        </Button>
        {cameraError ? <p className="text-xs text-red-600">{cameraError}</p> : null}
      </div>
      <div id={REGION_ID} className={cameraOn ? 'max-w-sm rounded-xl overflow-hidden border border-slate-200' : 'hidden'} />
    </div>
  )
}
