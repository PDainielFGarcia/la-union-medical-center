export const ROLES = {
  ADMINISTRATOR: 'administrator',
  SECURITY_GUARD: 'security_guard',
  OPD_STAFF: 'opd_staff',
  DEPARTMENT_SECRETARY: 'department_secretary',
  NURSING_STAFF: 'nursing_staff',
  DOCTOR: 'doctor',
}

export const ROLE_LABELS = {
  [ROLES.ADMINISTRATOR]: 'Administrator',
  [ROLES.SECURITY_GUARD]: 'Security Guard',
  [ROLES.OPD_STAFF]: 'OPD & Admission Staff',
  [ROLES.DEPARTMENT_SECRETARY]: 'Office Secretary',
  [ROLES.NURSING_STAFF]: 'Nursing Staff',
  [ROLES.DOCTOR]: 'Doctor',
}

export const AUTH_STORAGE_KEY = 'lumc_auth'
export const MOCK_DB_KEY = 'lumc_mock_db'
export const MOCK_SCHEMA_VERSION = 4
export const DEMO_PASSWORD = '12345678'

export function roleHome(role) {
  if (role === ROLES.SECURITY_GUARD) return '/security'
  if (role === ROLES.DEPARTMENT_SECRETARY) return '/visitor-approvals'
  return '/dashboard'
}

export const VISITOR_STATUSES = [
  'pending_approval',
  'approved',
  'inside',
  'completed',
  'rejected',
  'cancelled',
  'expired',
]

export const QUEUE_STATUSES = ['waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled']
export const BED_STATUSES = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'unavailable']
export const BED_MANUAL_STATUSES = ['available', 'cleaning', 'maintenance', 'unavailable']
export const ROOM_TYPES = ['private', 'ward', 'charity']
export const ROOM_TYPE_LABELS = { private: 'Private Room', ward: 'Ward', charity: 'Charity' }
export const DOCTOR_STATUSES = ['available', 'unavailable']
export const GUARDIAN_RELATIONSHIPS = ['Mother', 'Father', 'Sibling', 'Guardian', 'Other']
export const ADMISSION_STATUSES = ['waiting_for_bed', 'admitted', 'discharged']
export const ADMISSION_PRIORITIES = ['Normal', 'Urgent', 'Emergency']
export const VEHICLE_STATUSES = ['parked', 'exited']
export const VEHICLE_TYPES = ['Car', 'SUV / Van', 'Motorcycle', 'Tricycle', 'Truck', 'Other']

export const ID_TYPES = [
  'PhilSys ID',
  "Driver's License",
  'Passport',
  'School ID',
  'Senior Citizen ID',
  'Barangay ID',
]

export const VISIT_PURPOSES = [
  'Official Business',
  'Document Request',
  'Payment / Billing',
  'Follow-up of Requirements',
  'Delivery',
  'Appointment',
  'Other',
]

export const PATIENT_VISIT_PURPOSES = [
  'Patient Visit',
  'Watcher / Bantay',
  'Bring Items to Patient',
  'Other',
]

export const TRIAGE_SYMPTOMS = [
  ['cough', 'Cough'],
  ['fever', 'Fever'],
  ['runny_nose', 'Runny nose / colds'],
  ['vomiting_diarrhea', 'Vomiting / diarrhea'],
  ['loss_taste_smell', 'Loss of taste or smell'],
  ['body_aches', 'Body aches'],
  ['difficulty_breathing', 'Difficulty breathing'],
  ['sore_throat', 'Sore throat'],
]

export const EXPORT_DATASETS = [
  ['patients', 'Patients registered'],
  ['opd', 'Hospital visits & consultations'],
  ['admissions', 'Admissions & discharges'],
  ['census', 'Bed census (current)'],
  ['visitors', 'Visitors'],
  ['vehicles', 'Vehicles & parking'],
  ['audit', 'Audit log'],
]
