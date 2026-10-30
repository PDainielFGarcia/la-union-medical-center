import { createQrToken, endOfVisitDay, isPastVisitDate, parseQrPayload, todayIso } from '../../utils/visitorPass'
import { ROLES } from '../../utils/constants'

const OPEN_STATUSES = ['pending_approval', 'approved', 'qr_generated', 'active']

export function expireVisitorIfNeeded(visitor) {
  if (OPEN_STATUSES.includes(visitor.status) && isPastVisitDate(visitor.visit_date)) {
    visitor.status = 'expired'
  }
  return visitor
}

export function publicVisit(visitor) {
  if (!visitor) return null
  return {
    id: visitor.id,
    visitor_id: visitor.visitor_id || null,
    pass_id: visitor.pass_id,
    registration_type: visitor.registration_type,
    full_name: visitor.full_name,
    address: visitor.address,
    contact_number: visitor.contact_number,
    purpose: visitor.purpose,
    facility: visitor.facility,
    person_to_visit: visitor.person_to_visit,
    visit_date: visitor.visit_date,
    status: visitor.status,
    qr_token: visitor.qr_token,
    qr_generated_at: visitor.qr_generated_at,
    qr_used_at: visitor.qr_used_at,
    qr_expires_at: visitor.qr_expires_at,
    entry_time: visitor.entry_time,
    exit_time: visitor.exit_time,
    age: visitor.age,
    guardian_name: visitor.guardian_name,
    visitor_email: visitor.visitor_email,
  }
}

export function buildVisitor({ id, passId, body, registrationType, actor }) {
  const visitDate = registrationType === 'walk_in' ? todayIso() : body.visit_date
  return {
    id,
    visitor_id: actor?.role === ROLES.VISITOR ? actor.id : null,
    pass_id: passId,
    registration_type: registrationType,
    full_name: body.full_name,
    age: body.age ? Number(body.age) : null,
    address: body.address || '',
    contact_number: body.contact_number || body.phone || '',
    visitor_email: body.visitor_email || body.email || actor?.email || null,
    id_type: body.id_type || '',
    id_number: body.id_number || '',
    purpose: body.purpose,
    facility: body.facility,
    person_to_visit: body.person_to_visit || body.facility,
    phone: body.contact_number || body.phone || '',
    vehicle_plate: body.vehicle_plate || '',
    guardian_name: body.age && Number(body.age) < 18 ? body.guardian_name || null : null,
    visit_date: visitDate,
    entry_time: null,
    exit_time: null,
    status: 'pending_approval',
    qr_token: null,
    qr_generated_at: null,
    qr_used_at: null,
    qr_expires_at: visitDate ? endOfVisitDay(visitDate) : null,
  }
}

export function duplicateActiveVisit(visitors, { email, contact, visitDate, purpose, facility }) {
  return visitors.find((item) => {
    expireVisitorIfNeeded(item)
    const samePerson = (email && item.visitor_email && item.visitor_email === email)
      || (contact && item.contact_number && item.contact_number === contact)
    const open = ['pending_approval', 'approved', 'qr_generated', 'active'].includes(item.status)
    return samePerson && item.visit_date === visitDate && item.purpose === purpose && item.facility === facility && open
  })
}

export function issueQrPass(visitor, visitors = []) {
  if (visitor.qr_token) return visitor
  const used = new Set(visitors.map((item) => item.qr_token).filter(Boolean))
  let token = createQrToken()
  while (used.has(token)) token = createQrToken()
  visitor.qr_token = token
  visitor.qr_generated_at = new Date().toISOString()
  visitor.qr_expires_at = endOfVisitDay(visitor.visit_date)
  visitor.status = 'qr_generated'
  return visitor
}

export function validatePass(visitors, rawValue) {
  const token = parseQrPayload(rawValue)
  if (!token) {
    return { valid: false, code: 'INVALID', message: 'This visitor pass is no longer valid.', visit: null }
  }
  const visitor = visitors.find((item) => item.qr_token === token)
  if (!visitor) {
    return { valid: false, code: 'INVALID', message: 'This visitor pass is no longer valid.', visit: null }
  }
  expireVisitorIfNeeded(visitor)
  if (['rejected', 'cancelled', 'expired', 'completed'].includes(visitor.status)) {
    return { valid: false, code: visitor.status.toUpperCase(), message: 'This visitor pass is no longer valid.', visit: publicVisit(visitor) }
  }
  if (visitor.qr_expires_at && new Date(visitor.qr_expires_at).getTime() < Date.now()) {
    visitor.status = 'expired'
    return { valid: false, code: 'EXPIRED', message: 'This visitor pass is no longer valid.', visit: publicVisit(visitor) }
  }
  if (!['approved', 'qr_generated', 'active'].includes(visitor.status)) {
    return { valid: false, code: 'PENDING', message: 'This visitor pass is not approved yet.', visit: publicVisit(visitor) }
  }
  return {
    valid: true,
    code: 'VALID',
    message: 'Valid visitor pass.',
    visit: publicVisit(visitor),
  }
}

export function canStaffManageVisitors(role) {
  return [ROLES.ADMINISTRATOR, ROLES.SECURITY_GUARD, ROLES.DEPARTMENT_SECRETARY].includes(role)
}
