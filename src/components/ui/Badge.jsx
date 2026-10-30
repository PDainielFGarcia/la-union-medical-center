import { cn } from '../../utils/cn'
import { titleCaseStatus } from '../../utils/format'

const tones = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
}

const statusMap = {
  inside: 'success',
  available: 'success',
  completed: 'success',
  active: 'success',
  success: 'success',
  approved: 'success',
  parked: 'success',
  pending_approval: 'warning',
  waiting: 'warning',
  called: 'warning',
  on_break: 'warning',
  reserved: 'warning',
  cleaning: 'warning',
  waiting_for_bed: 'warning',
  bed_assigned: 'info',
  serving: 'info',
  in_consultation: 'info',
  confirmed: 'info',
  rejected: 'danger',
  unavailable: 'danger',
  occupied: 'danger',
  maintenance: 'danger',
  skipped: 'danger',
  no_show: 'danger',
  qr_generated: 'info',
  cancelled: 'neutral',
  expired: 'neutral',
  discharged: 'neutral',
}

export function Badge({ children, tone, status, className }) {
  const resolved = tone || statusMap[status] || 'neutral'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[resolved], className)}>
      {children || titleCaseStatus(status)}
    </span>
  )
}
