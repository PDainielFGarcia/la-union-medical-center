import { MOCK_DB_KEY, MOCK_SCHEMA_VERSION, ROLES } from '../../utils/constants'
import { DEMO_PASSWORD } from '../../utils/constants'
import { createSeed } from './seed'
import { endOfVisitDay } from '../../utils/visitorPass'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function migrateVisitor(visitor) {
  const statusMap = { inside: 'active', exited: 'completed' }
  return {
    ...visitor,
    registration_type: visitor.registration_type || 'walk_in',
    facility: visitor.facility || visitor.person_to_visit || 'OPD',
    address: visitor.address || '',
    contact_number: visitor.contact_number || visitor.phone || '',
    visitor_email: visitor.visitor_email || null,
    visitor_id: visitor.visitor_id ?? null,
    qr_token: visitor.qr_token ?? null,
    qr_generated_at: visitor.qr_generated_at ?? null,
    qr_used_at: visitor.qr_used_at ?? null,
    qr_expires_at: visitor.qr_expires_at || (visitor.visit_date ? endOfVisitDay(visitor.visit_date) : null),
    status: statusMap[visitor.status] || visitor.status,
  }
}

function migrate(db) {
  const next = db
  next.visitors = (next.visitors || []).map(migrateVisitor)
  if (!next.users?.some((user) => user.role === ROLES.VISITOR)) {
    next.users = next.users || []
    next.users.push({
      id: Math.max(0, ...next.users.map((user) => user.id || 0)) + 1,
      name: 'Juan Dela Cruz',
      email: 'visitor@hospital.ph',
      password: DEMO_PASSWORD,
      role: ROLES.VISITOR,
      department: null,
      status: 'active',
    })
  }
  next.schemaVersion = MOCK_SCHEMA_VERSION
  return next
}

function load() {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.schemaVersion !== MOCK_SCHEMA_VERSION) {
        const migrated = migrate(parsed)
        localStorage.setItem(MOCK_DB_KEY, JSON.stringify(migrated))
        return migrated
      }
      return parsed
    }
  } catch {
    /* ignore */
  }
  return clone(createSeed())
}

let db = load()

export function getDb() {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      db = parsed.schemaVersion === MOCK_SCHEMA_VERSION ? parsed : migrate(parsed)
      if (!Array.isArray(db.visitors)) db.visitors = []
    }
  } catch {
    /* keep the in-memory copy */
  }
  return db
}

export function saveDb() {
  db.schemaVersion = MOCK_SCHEMA_VERSION
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db))
  window.dispatchEvent(new Event('lumc-db-updated'))
}

export function resetDb() {
  db = clone(createSeed())
  saveDb()
  return db
}

export function nextId(collection) {
  const items = db[collection] || []
  return items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1
}

export function publicUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

export function addNotification({ title, body }) {
  if (!db.notifications) db.notifications = []
  db.notifications.unshift({
    id: nextId('notifications'),
    title,
    body,
    read: false,
    created_at: new Date().toISOString(),
  })
  saveDb()
}

export function addAudit(entry) {
  if (!db.auditLogs) db.auditLogs = []
  db.auditLogs.unshift({
    id: nextId('auditLogs'),
    timestamp: new Date().toISOString(),
    ...entry,
  })
  saveDb()
}
