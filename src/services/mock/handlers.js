import { ApiError } from '../../utils/errors'
import { delay } from '../../utils/format'
import { DEMO_PASSWORD, ROLES } from '../../utils/constants'
import { todayIso } from '../../utils/visitorPass'
import { addAudit, addNotification, getDb, nextId, publicUser, saveDb } from './store'
import {
  buildVisitor,
  canStaffManageVisitors,
  duplicateActiveVisit,
  expireVisitorIfNeeded,
  issueQrPass,
  publicVisit,
  validatePass,
} from './visitPass'

const TOKEN_PREFIX = 'mock-token-'

function json(data, meta) {
  return { data, meta }
}

function matchPath(pattern, pathname) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    if (patternParts[i].startsWith('{')) {
      params[patternParts[i].slice(1, -1)] = decodeURIComponent(pathParts[i])
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function queryOf(url) {
  return Object.fromEntries(url.searchParams.entries())
}

function matchesQuery(item, q, fields) {
  if (!q) return true
  const needle = q.toLowerCase()
  return fields.some((field) => String(item[field] || '').toLowerCase().includes(needle))
}

function pad(n, width = 3) {
  return String(n).padStart(width, '0')
}

export async function handleMockRequest({ method, path, body, token }) {
  await delay(220)
  const url = new URL(path, 'http://localhost')
  const pathname = url.pathname.replace(/^\/api/, '') || '/'
  const query = queryOf(url)

  const db = getDb()
  const currentUser = token?.startsWith(TOKEN_PREFIX)
    ? db.users.find((user) => user.id === Number(token.slice(TOKEN_PREFIX.length)))
    : null

  if (method === 'POST' && pathname === '/login') {
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const user = db.users.find((item) => item.email.toLowerCase() === email)
    if (!user || password !== user.password) {
      throw new ApiError('Invalid email or password.', 401)
    }
    addAudit({
      user_name: user.name,
      role: user.role,
      action: 'Login',
      record: 'Session',
      status: 'Success',
      details: 'User logged in successfully',
    })
    return json({
      token: `${TOKEN_PREFIX}${user.id}`,
      token_type: 'Bearer',
      user: publicUser(user),
    })
  }

  if (method === 'POST' && pathname === '/logout') {
    return json({ message: 'Logged out' })
  }

  const isPublic = pathname === '/login'
    || (method === 'POST' && pathname === '/visitor-requests')
    || (method === 'POST' && pathname === '/visitor-passes/validate')

  if (!currentUser && !isPublic) {
    throw new ApiError('Unauthenticated.', 401)
  }

  if (method === 'POST' && pathname === '/visitor-requests') {
    const visitDate = body.visit_date
    const minDate = todayIso()
    if (!body.full_name || !body.address || !body.contact_number || !body.purpose || !body.facility || !visitDate) {
      throw new ApiError('Please complete all required visit fields.', 422)
    }
    if (visitDate <= minDate) {
      throw new ApiError('Advance visits must be requested for a future date (typically 1–2 days ahead).', 422)
    }
    const duplicate = duplicateActiveVisit(db.visitors, {
      email: body.email,
      contact: body.contact_number,
      visitDate,
      purpose: body.purpose,
      facility: body.facility,
    })
    if (duplicate) {
      throw new ApiError('An active pass already exists for this visit. Use the existing visitor pass.', 409)
    }
    const id = nextId('visitors')
    const visitor = buildVisitor({
      id,
      passId: `V${pad(id)}`,
      body,
      registrationType: 'advance',
      actor: currentUser,
    })
    db.visitors.unshift(visitor)
    saveDb()
    addNotification({
      title: 'Advance visit request',
      body: `${visitor.full_name} requested ${visitor.facility} on ${visitor.visit_date} (${visitor.pass_id}). Open Guard Dashboard to approve.`,
    })
    addAudit({
      user_name: body.full_name,
      role: 'visitor',
      action: 'Advance Visit Request',
      record: `${visitor.pass_id} - ${visitor.full_name}`,
      status: 'Success',
      details: `Advance request for ${visitor.facility} on ${visitor.visit_date}`,
    })
    return json(publicVisit(visitor))
  }

  if (method === 'POST' && pathname === '/visitor-passes/validate') {
    const result = validatePass(db.visitors, body?.token || body?.payload)
    saveDb()
    return json(result)
  }

  if (method === 'GET' && pathname === '/user') {
    return json(publicUser(currentUser))
  }

  if (method === 'GET' && pathname === '/dashboard') {
    const visitorsInside = db.visitors.filter((item) => {
      expireVisitorIfNeeded(item)
      return item.status === 'active'
    }).length
    const pending = db.visitors.filter((item) => item.status === 'pending_approval').length
    const waiting = db.queues.filter((item) => item.status === 'waiting').length
    const served = db.queues.filter((item) => item.status === 'completed').length
    const availableDoctors = db.doctors.filter((item) => item.status === 'available').length
    const availableBeds = db.beds.filter((item) => item.status === 'available').length
    const occupiedBeds = db.beds.filter((item) => item.status === 'occupied').length
    return json({
      visitor_counts: {
        inside: visitorsInside,
        pending_approval: pending,
        exited: db.visitors.filter((item) => item.status === 'completed').length,
        rejected: db.visitors.filter((item) => item.status === 'rejected').length,
      },
      queue_counts: { waiting, served },
      doctor_counts: { available: availableDoctors, total: db.doctors.length },
      bed_counts: {
        available: availableBeds,
        occupied: occupiedBeds,
        reserved: db.beds.filter((item) => item.status === 'reserved').length,
        cleaning: db.beds.filter((item) => item.status === 'cleaning').length,
        maintenance: db.beds.filter((item) => item.status === 'maintenance').length,
      },
      doctors: db.doctors,
      recent_activity: db.queues.slice().reverse().slice(0, 6),
    })
  }

  if (method === 'GET' && pathname === '/notifications') {
    return json(db.notifications)
  }

  if (method === 'POST' && pathname === '/notifications/read') {
    db.notifications.forEach((item) => {
      item.read = true
    })
    saveDb()
    return json(db.notifications)
  }

  if (method === 'GET' && pathname === '/search') {
    const q = (query.q || '').toLowerCase()
    if (!q) return json({ patients: [], visitors: [], queues: [] })
    return json({
      patients: db.patients.filter((item) =>
        `${item.first_name} ${item.last_name} ${item.patient_number}`.toLowerCase().includes(q),
      ),
      visitors: db.visitors.filter((item) =>
        `${item.full_name} ${item.pass_id}`.toLowerCase().includes(q),
      ),
      queues: db.queues.filter((item) =>
        `${item.queue_number} ${item.patient_name}`.toLowerCase().includes(q),
      ),
    })
  }

  if (method === 'GET' && pathname === '/visitors/mine') {
    db.visitors.forEach(expireVisitorIfNeeded)
    const mine = db.visitors.filter((item) =>
      item.visitor_id === currentUser.id
      || item.visitor_email === currentUser.email
      || item.contact_number === currentUser.email,
    )
    saveDb()
    return json(mine.map(publicVisit))
  }

  if (method === 'GET' && pathname === '/visitors') {
    db.visitors.forEach(expireVisitorIfNeeded)
    saveDb()
    const items = db.visitors.filter((item) => {
      const statusOk = !query.status || query.status === 'all' || item.status === query.status
      const typeOk = !query.registration_type || query.registration_type === 'all' || item.registration_type === query.registration_type
      return statusOk && typeOk && matchesQuery(item, query.q, ['full_name', 'pass_id', 'person_to_visit', 'facility', 'contact_number', 'qr_token'])
    })
    return json(items.map(publicVisit))
  }

  if (method === 'POST' && pathname === '/visitors') {
    if (!canStaffManageVisitors(currentUser.role) && currentUser.role !== ROLES.ADMINISTRATOR) {
      throw new ApiError('Not allowed to register visitors.', 403)
    }
    const registrationType = body.registration_type === 'advance' ? 'advance' : 'walk_in'
    if (!body.full_name || !body.address || !body.contact_number || !body.purpose || !body.facility) {
      throw new ApiError('Please complete all required visitor fields.', 422)
    }
    const visitDate = registrationType === 'walk_in' ? todayIso() : body.visit_date
    const duplicate = duplicateActiveVisit(db.visitors, {
      email: body.email,
      contact: body.contact_number,
      visitDate,
      purpose: body.purpose,
      facility: body.facility,
    })
    if (duplicate) {
      throw new ApiError('An active pass already exists for this visit. Retrieve the existing record instead of creating another.', 409)
    }
    const id = nextId('visitors')
    const visitor = buildVisitor({
      id,
      passId: `V${pad(id)}`,
      body,
      registrationType,
      actor: currentUser,
    })
    db.visitors.unshift(visitor)
    saveDb()
    addNotification({
      title: visitor.registration_type === 'walk_in' ? 'Walk-in visitor registered' : 'Advance visit recorded',
      body: `${visitor.full_name} (${visitor.pass_id}) is pending approval.`,
    })
    addAudit({
      user_name: currentUser.name,
      role: currentUser.role,
      action: 'Visitor Registration',
      record: `${visitor.pass_id} - ${visitor.full_name}`,
      status: 'Success',
      details: `${registrationType === 'walk_in' ? 'Walk-in' : 'Advance'} visitor registered and pending approval`,
    })
    return json(publicVisit(visitor))
  }

  const visitorPass = matchPath('/visitors/{id}/pass', pathname)
  if (method === 'GET' && visitorPass) {
    const visitor = db.visitors.find((item) => String(item.id) === visitorPass.id)
    if (!visitor) throw new ApiError('Visitor pass not found.', 404)
    expireVisitorIfNeeded(visitor)
    saveDb()
    const isOwner = visitor.visitor_id === currentUser.id || visitor.visitor_email === currentUser.email
    if (!isOwner && !canStaffManageVisitors(currentUser.role)) {
      throw new ApiError('Not allowed to view this pass.', 403)
    }
    return json(publicVisit(visitor))
  }

  const visitorAction = matchPath('/visitors/{id}/{action}', pathname)
  if (method === 'POST' && visitorAction) {
    const visitor = db.visitors.find((item) => String(item.id) === visitorAction.id)
    if (!visitor) throw new ApiError('Visitor not found.', 404)
    expireVisitorIfNeeded(visitor)
    const action = visitorAction.action
    if (action === 'approve') {
      if (visitor.status !== 'pending_approval') throw new ApiError('Only pending visits can be approved.', 422)
      visitor.status = 'approved'
      if (visitor.registration_type === 'advance') {
        issueQrPass(visitor, db.visitors)
      }
    } else if (action === 'reject') {
      visitor.status = 'rejected'
    } else if (action === 'activate' || action === 'exit') {
      if (action === 'exit') {
        if (!['active', 'approved', 'qr_generated'].includes(visitor.status)) {
          throw new ApiError('This visit cannot be completed.', 422)
        }
        visitor.status = 'completed'
        visitor.exit_time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        visitor.qr_used_at = visitor.qr_used_at || new Date().toISOString()
      } else {
        if (!['approved', 'qr_generated'].includes(visitor.status)) {
          throw new ApiError('This pass cannot be activated.', 422)
        }
        visitor.status = 'active'
        visitor.entry_time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        visitor.qr_used_at = new Date().toISOString()
      }
    } else if (action === 'complete') {
      visitor.status = 'completed'
      visitor.exit_time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      visitor.qr_used_at = visitor.qr_used_at || new Date().toISOString()
    } else if (action === 'cancel') {
      if (['completed', 'expired'].includes(visitor.status)) throw new ApiError('This visit cannot be cancelled.', 422)
      visitor.status = 'cancelled'
    } else {
      throw new ApiError('Unknown visitor action.', 400)
    }
    saveDb()
    return json(publicVisit(visitor))
  }

  if (method === 'GET' && pathname === '/patients') {
    const source = query.source || 'all'
    let items = db.patients
    if (source === 'local') items = items.filter((item) => item.source === 'local')
    if (source === 'ihomis') items = [...db.ihomisPatients]
    if (source === 'all' && query.q) items = [...db.patients, ...db.ihomisPatients]
    items = items.filter((item) =>
      matchesQuery(item, query.q, ['first_name', 'last_name', 'patient_number', 'philhealth_number', 'contact_number']),
    )
    return json(items)
  }

  const patientOne = matchPath('/patients/{id}', pathname)
  if (method === 'GET' && patientOne) {
    const patient = db.patients.find((item) => String(item.id) === patientOne.id)
    if (!patient) throw new ApiError('Patient not found.', 404)
    return json(patient)
  }

  if (method === 'POST' && pathname === '/patients') {
    const id = nextId('patients')
    const patient = {
      id,
      patient_number: `P${pad(id)}`,
      first_name: body.first_name,
      last_name: body.last_name,
      age: Number(body.age),
      gender: body.gender,
      date_of_birth: body.date_of_birth,
      contact_number: body.contact_number,
      email: body.email || '',
      address: body.address || '',
      philhealth_number: body.philhealth_number || '',
      source: 'local',
      assigned_doctor_id: body.assigned_doctor_id ? Number(body.assigned_doctor_id) : null,
      status: 'waiting',
      created_at: new Date().toISOString(),
    }
    db.patients.unshift(patient)
    addAudit({
      user_name: currentUser.name,
      role: currentUser.role,
      action: 'Patient Registration',
      record: `${patient.patient_number} - ${patient.first_name} ${patient.last_name}`,
      status: 'Success',
      details: body.reason ? `Registered for ${body.reason}` : 'New patient registered',
    })
    return json(patient)
  }

  if (method === 'GET' && pathname === '/opd-registrations') {
    const items = db.queues
      .filter((item) => item.patient_id)
      .filter((item) => !query.status || query.status === 'all' || item.status === query.status)
      .filter((item) => {
        if (!query.clinic || query.clinic === 'all') return true
        const doctor = db.doctors.find((doc) => doc.id === item.doctor_id)
        return doctor?.specialty === query.clinic
      })
      .filter((item) => matchesQuery(item, query.q, ['patient_name', 'queue_number']))
      .map((item) => {
        const patient = db.patients.find((p) => p.id === item.patient_id)
        const doctor = db.doctors.find((d) => d.id === item.doctor_id)
        return {
          ...item,
          patient_number: patient?.patient_number,
          age: patient?.age,
          clinic: doctor?.specialty,
          doctor_name: doctor?.name,
        }
      })
    return json(items)
  }

  if (method === 'POST' && pathname === '/opd-registrations') {
    const doctor = db.doctors.find((item) => item.id === Number(body.doctor_id))
    if (!doctor) throw new ApiError('Doctor not found.', 404)
    const prefix = doctor.specialty === 'Internal Medicine' ? 'IM' : doctor.specialty === 'OB-Gyne' ? 'OB' : doctor.specialty.slice(0, 3).toUpperCase()
    const count = db.queues.filter((item) => item.queue_number.startsWith(prefix)).length + 1
    const ticket = {
      id: nextId('queues'),
      queue_number: `${prefix}-${pad(count)}`,
      patient_name: body.patient_name,
      patient_id: body.patient_id ? Number(body.patient_id) : null,
      doctor_id: doctor.id,
      clinic: doctor.clinic,
      reason: body.reason || 'Consultation',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting',
    }
    db.queues.push(ticket)
    saveDb()
    return json(ticket)
  }

  if (method === 'GET' && pathname === '/queues') {
    let items = db.queues.map((item) => ({
      ...item,
      doctor_name: db.doctors.find((d) => d.id === item.doctor_id)?.name,
    }))
    if (query.doctor_id) items = items.filter((item) => String(item.doctor_id) === String(query.doctor_id))
    if (query.status && query.status !== 'all') items = items.filter((item) => item.status === query.status)
    if (query.q) items = items.filter((item) => matchesQuery(item, query.q, ['queue_number', 'patient_name', 'doctor_name']))
    return json(items)
  }

  const queueAction = matchPath('/queues/{id}/{action}', pathname)
  if (method === 'POST' && queueAction) {
    const ticket = db.queues.find((item) => String(item.id) === queueAction.id)
    if (!ticket) throw new ApiError('Queue ticket not found.', 404)
    const map = { call: 'called', serve: 'serving', done: 'completed', skip: 'skipped' }
    if (!map[queueAction.action]) throw new ApiError('Unknown queue action.', 400)
    ticket.status = map[queueAction.action]
    saveDb()
    return json(ticket)
  }

  if (method === 'GET' && pathname === '/doctors') {
    return json(db.doctors.map((item) => ({
      ...item,
      waiting_count: db.queues.filter((q) => q.doctor_id === item.id && q.status === 'waiting').length,
    })))
  }

  if (method === 'POST' && pathname === '/doctors') {
    const id = nextId('doctors')
    const doctor = {
      id,
      name: body.name,
      specialty: body.specialty,
      clinic: body.clinic,
      schedule: body.schedule || 'Mon-Fri 8AM-5PM',
      weekly: body.weekly || { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
      status: 'available',
      waiting_count: 0,
    }
    db.doctors.push(doctor)
    saveDb()
    return json(doctor)
  }

  const doctorOne = matchPath('/doctors/{id}', pathname)
  if (method === 'PUT' && doctorOne) {
    const doctor = db.doctors.find((item) => String(item.id) === doctorOne.id)
    if (!doctor) throw new ApiError('Doctor not found.', 404)
    Object.assign(doctor, body)
    saveDb()
    return json(doctor)
  }

  if (method === 'GET' && pathname === '/beds') {
    let items = db.beds
    if (query.ward && query.ward !== 'all') items = items.filter((item) => item.ward === query.ward)
    if (query.status && query.status !== 'all') items = items.filter((item) => item.status === query.status)
    return json(items)
  }

  if (method === 'GET' && pathname === '/wards') {
    const names = [...new Set(db.beds.map((item) => item.ward))]
    return json(names.map((ward) => {
      const beds = db.beds.filter((item) => item.ward === ward)
      const occupied = beds.filter((item) => item.status === 'occupied').length
      return {
        name: ward,
        total: beds.length,
        available: beds.filter((item) => item.status === 'available').length,
        occupied,
        unavailable: beds.filter((item) => ['cleaning', 'maintenance', 'unavailable'].includes(item.status)).length,
        occupancy: beds.length ? Math.round((occupied / beds.length) * 100) : 0,
        beds,
      }
    }))
  }

  if (method === 'GET' && pathname === '/admissions') {
    return json(db.admissions)
  }

  if (method === 'POST' && pathname === '/admissions') {
    const id = nextId('admissions')
    const admission = {
      id,
      admission_number: `ADM${pad(id)}`,
      patient_name: body.patient_name,
      priority: body.priority || 'Normal',
      reason: body.reason,
      waiting_since: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bed_number: null,
      status: 'waiting_for_bed',
    }
    db.admissions.unshift(admission)
    saveDb()
    return json(admission)
  }

  const admissionAction = matchPath('/admissions/{id}/{action}', pathname)
  if (method === 'POST' && admissionAction) {
    const admission = db.admissions.find((item) => String(item.id) === admissionAction.id)
    if (!admission) throw new ApiError('Admission not found.', 404)
    if (admissionAction.action === 'assign') {
      const bed = db.beds.find((item) => item.bed_number === body.bed_number && item.status === 'available')
      if (!bed) throw new ApiError('Selected bed is not available.', 422)
      bed.status = 'reserved'
      bed.patient_name = admission.patient_name
      admission.bed_number = bed.bed_number
      admission.status = 'bed_assigned'
    } else if (admissionAction.action === 'confirm') {
      admission.status = 'confirmed'
      const bed = db.beds.find((item) => item.bed_number === admission.bed_number)
      if (bed) bed.status = 'occupied'
    } else if (admissionAction.action === 'discharge') {
      admission.status = 'discharged'
      const bed = db.beds.find((item) => item.bed_number === admission.bed_number)
      if (bed) {
        bed.status = 'cleaning'
        bed.patient_name = null
      }
    }
    saveDb()
    return json(admission)
  }

  if (method === 'GET' && pathname === '/vehicles') {
    return json(db.vehicles.filter((item) => matchesQuery(item, query.q, ['plate_number', 'owner', 'vehicle_number'])))
  }

  if (method === 'POST' && pathname === '/vehicles') {
    const id = nextId('vehicles')
    const vehicle = {
      id,
      vehicle_number: `VEH${pad(id)}`,
      plate_number: body.plate_number,
      type: body.type,
      color: body.color,
      owner: body.owner,
      purpose: body.purpose,
      entry_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exit_time: null,
      status: 'parked',
    }
    db.vehicles.unshift(vehicle)
    saveDb()
    return json(vehicle)
  }

  const vehicleExit = matchPath('/vehicles/{id}/exit', pathname)
  if (method === 'POST' && vehicleExit) {
    const vehicle = db.vehicles.find((item) => String(item.id) === vehicleExit.id)
    if (!vehicle) throw new ApiError('Vehicle not found.', 404)
    vehicle.status = 'exited'
    vehicle.exit_time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    saveDb()
    return json(vehicle)
  }

  if (method === 'GET' && pathname === '/users') {
    return json(db.users.map(publicUser))
  }

  if (method === 'POST' && pathname === '/users') {
    const id = nextId('users')
    const user = {
      id,
      name: body.name,
      email: body.email,
      password: body.password || DEMO_PASSWORD,
      role: body.role,
      department: body.department,
      status: 'active',
    }
    db.users.push(user)
    saveDb()
    return json(publicUser(user))
  }

  const userOne = matchPath('/users/{id}', pathname)
  if (method === 'PUT' && userOne) {
    const user = db.users.find((item) => String(item.id) === userOne.id)
    if (!user) throw new ApiError('User not found.', 404)
    Object.assign(user, body)
    saveDb()
    return json(publicUser(user))
  }

  if (method === 'GET' && pathname === '/audit-logs') {
    let items = db.auditLogs
    if (query.action && query.action !== 'all') items = items.filter((item) => item.action === query.action)
    if (query.role && query.role !== 'all') items = items.filter((item) => item.role === query.role)
    if (query.q) items = items.filter((item) => matchesQuery(item, query.q, ['user_name', 'record', 'details', 'action']))
    return json(items)
  }

  if (method === 'GET' && pathname === '/reports/summary') {
    return json({
      total_visitors: db.visitors.length,
      total_patients: db.patients.length,
      in_queue: db.queues.filter((item) => ['waiting', 'called', 'serving'].includes(item.status)).length,
      beds_occupied: db.beds.filter((item) => item.status === 'occupied').length,
      peak_hours: [
        { hour: '7AM', value: 2 },
        { hour: '8AM', value: 18 },
        { hour: '9AM', value: 22 },
        { hour: '10AM', value: 14 },
        { hour: '11AM', value: 9 },
        { hour: '12PM', value: 6 },
        { hour: '1PM', value: 8 },
        { hour: '2PM', value: 7 },
        { hour: '3PM', value: 5 },
        { hour: '4PM', value: 3 },
      ],
      purposes: [
        { label: 'Patient Visit', value: 45 },
        { label: 'Administrative', value: 12 },
        { label: 'Delivery', value: 8 },
        { label: 'Official', value: 5 },
      ],
    })
  }

  if (method === 'GET' && pathname === '/settings') return json(db.settings)
  if (method === 'PUT' && pathname === '/settings') {
    Object.assign(db.settings, body)
    saveDb()
    return json(db.settings)
  }

  if (method === 'GET' && pathname === '/integrations') return json(db.integrations)
  if (method === 'POST' && pathname === '/integrations/google-sheets/connect') {
    db.integrations.google_sheets.connected = true
    db.integrations.google_sheets.last_sync = new Date().toISOString()
    saveDb()
    return json(db.integrations)
  }

  throw new ApiError(`No mock handler for ${method} ${pathname}`, 404)
}
