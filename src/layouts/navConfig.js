import {
  Activity,
  Ambulance,
  ArrowRightLeft,
  BedDouble,
  Building2,
  Car,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  DatabaseBackup,
  FileBarChart,
  FileClock,
  History,
  Hospital,
  LayoutDashboard,
  ListOrdered,
  Monitor,
  ParkingSquare,
  QrCode,
  ScrollText,
  Settings,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
  UserSearch,
} from 'lucide-react'
import { ROLES } from '../utils/constants'

const { ADMINISTRATOR: ADMIN, SECURITY_GUARD: GUARD, OPD_STAFF: OPD, DEPARTMENT_SECRETARY: SECRETARY, NURSING_STAFF: NURSE, DOCTOR } = ROLES
const ALL = Object.values(ROLES)

export const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
      { to: '/profile', label: 'My Profile', icon: UserPlus, roles: ALL },
      { to: '/triage', label: 'Front Desk Routing', icon: ArrowRightLeft, roles: [ADMIN, GUARD, OPD] },
    ],
  },
  {
    label: 'Visitors',
    items: [
      { to: '/security', label: 'Guard Dashboard', icon: Shield, roles: [ADMIN, GUARD] },
      { to: '/visitors', label: 'Register Visitor', icon: UserPlus, roles: [ADMIN, GUARD] },
      { to: '/scan', label: 'Scan QR Pass', icon: QrCode, roles: [ADMIN, GUARD] },
      { to: '/current-visitors', label: "Today's Visitors", icon: Users, roles: [ADMIN, GUARD] },
      { to: '/visitor-approvals', label: 'Visitor Approvals', icon: CheckSquare, roles: [ADMIN, SECRETARY] },
      { to: '/visitor-history', label: 'Visitor History', icon: History, roles: [ADMIN, GUARD, SECRETARY] },
    ],
  },
  {
    label: 'Patients & Visits',
    items: [
      { to: '/patient-registration', label: 'Register & Queue', icon: UserPlus, roles: [ADMIN, OPD] },
      { to: '/opd-registration', label: "Today's Hospital Visits", icon: ClipboardList, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/screening', label: 'Initial Screening', icon: ClipboardCheck, roles: [ADMIN, NURSE] },
      { to: '/patient-search', label: 'Patient Search', icon: UserSearch, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/patient-records', label: 'Patient Records', icon: FileClock, roles: [ADMIN, OPD, NURSE, DOCTOR] },
    ],
  },
  {
    label: 'Queue',
    items: [
      { to: '/queue-monitor', label: 'Queue Monitor', icon: ListOrdered, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/clinic-queues', label: 'Clinic Queues', icon: Stethoscope, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/queue-history', label: 'Queue History', icon: History, roles: [ADMIN, OPD] },
      { to: '/public-display', label: 'Public Queue Display', icon: Monitor, roles: [ADMIN, OPD] },
    ],
  },
  {
    label: 'Doctors',
    items: [
      { to: '/doctors', label: 'Doctor List', icon: Stethoscope, roles: [ADMIN, OPD, DOCTOR] },
      { to: '/doctor-availability', label: 'Availability', icon: Activity, roles: [ADMIN, OPD, DOCTOR] },
    ],
  },
  {
    label: 'Beds & Admissions',
    items: [
      { to: '/wards', label: 'Wards & Patients', icon: Building2, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/bed-overview', label: 'Bed Overview', icon: BedDouble, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/admissions', label: 'Admissions', icon: Ambulance, roles: [ADMIN, OPD, NURSE, DOCTOR] },
      { to: '/bed-assignment', label: 'Waiting for Bed', icon: Hospital, roles: [ADMIN, OPD, NURSE] },
      { to: '/bed-history', label: 'Bed History', icon: History, roles: [ADMIN, OPD, NURSE] },
    ],
  },
  {
    label: 'Parking',
    items: [
      { to: '/vehicles', label: 'Vehicles', icon: Car, roles: [ADMIN, GUARD, OPD] },
      { to: '/security-logs', label: 'Security Logs', icon: ScrollText, roles: [ADMIN, GUARD] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/reports', label: 'Reports & Exports', icon: FileBarChart, roles: [ADMIN] },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [ADMIN] },
      { to: '/backups', label: 'Backups', icon: DatabaseBackup, roles: [ADMIN] },
      { to: '/users', label: 'Users & Roles', icon: Users, roles: [ADMIN] },
      { to: '/parking-areas', label: 'Parking Areas', icon: ParkingSquare, roles: [ADMIN] },
      { to: '/settings', label: 'Settings', icon: Settings, roles: [ADMIN] },
    ],
  },
]

const DETAIL_ROUTES = {
  '/visitor-pass': [ADMIN, GUARD, SECRETARY],
}

export function canAccessPath(role, pathname) {
  if (role === ADMIN) return true
  const items = NAV_SECTIONS.flatMap((section) => section.items)
  const match = items
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  if (match) return match.roles.includes(role)
  const detail = Object.keys(DETAIL_ROUTES).find((prefix) => pathname.startsWith(prefix))
  return detail ? DETAIL_ROUTES[detail].includes(role) : true
}

export function navForRole(role) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length)
}
