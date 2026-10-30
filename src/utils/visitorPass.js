const QR_PREFIX = 'VISIT-PASS:'

export function createQrToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function qrPayload(token) {
  return `${QR_PREFIX}${token}`
}

export function parseQrPayload(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw
}

export function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDaysIso(days) {
  const now = new Date()
  now.setDate(now.getDate() + days)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function endOfVisitDay(visitDate) {
  return `${visitDate}T23:59:59`
}

export function isPastVisitDate(visitDate) {
  return Boolean(visitDate) && visitDate < todayIso()
}
