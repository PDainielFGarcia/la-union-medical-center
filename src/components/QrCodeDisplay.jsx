import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCodeDisplay({ value, size = 240 }) {
  const [src, setSrc] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!value) {
      setSrc('')
      return undefined
    }
    let active = true
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setSrc(url)
      })
      .catch(() => {
        if (active) setError('Unable to render QR code.')
      })
    return () => {
      active = false
    }
  }, [value, size])

  if (!value) return <p className="text-sm text-slate-500">QR pass has not been generated for this visit.</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!src) return <p className="text-sm text-slate-500">Generating QR pass…</p>

  return (
    <img
      src={src}
      alt="Digital visitor pass QR code"
      width={size}
      height={size}
      className="mx-auto bg-white p-2 rounded-lg border border-slate-200"
    />
  )
}
