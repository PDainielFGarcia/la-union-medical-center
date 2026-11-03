import { Link } from 'react-router-dom'
import { BedDouble, Car, Clock, Users } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Card, CardTitle } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../auth/AuthContext'
import { dashboardApi } from '../api'
import { useAsync } from '../hooks/useAsync'
import { usePolling } from '../hooks/usePolling'
import { PendingVisitQueue } from '../components/PendingVisitQueue'
import { ROLES, ROLE_LABELS } from '../utils/constants'
import { formatDate, titleCaseStatus } from '../utils/format'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(() => dashboardApi.get(), [])
  usePolling(reload)

  if (loading && !data) return <LoadingState label="Loading dashboard..." />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  if (user.role === ROLES.DEPARTMENT_SECRETARY) {
    return (
      <div>
        <PageHeader title={`${user.department || 'Office'} — Visitors`} subtitle={`Welcome, ${user.name} — ${formatDate(new Date())}`} />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard label="Waiting Approval" value={data.visitor_counts.pending_approval} tone="amber" icon={<Clock className="w-5 h-5" />} />
          <StatCard label="Approved (QR issued)" value={data.visitor_counts.approved} tone="blue" icon={<Users className="w-5 h-5" />} />
          <StatCard label="Inside Now" value={data.visitor_counts.inside} tone="green" icon={<Users className="w-5 h-5" />} />
          <StatCard label="Exited Today" value={data.visitor_counts.exited} tone="slate" icon={<Users className="w-5 h-5" />} />
        </div>
        <PendingVisitQueue canReview />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`${ROLE_LABELS[user.role] || ''} Dashboard`}
        subtitle={`Welcome, ${user.name} — ${formatDate(new Date())}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Visitors Inside" value={data.visitor_counts.inside} hint={`${data.visitor_counts.pending_approval} waiting approval today`} tone="green" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Visit Waiting" value={data.queue_counts.waiting} hint={`${data.queue_counts.served} seen by a doctor today`} tone="amber" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Available Beds" value={data.bed_counts.available} hint={`${data.bed_counts.occupied} occupied of ${data.bed_counts.total}`} tone="rose" icon={<BedDouble className="w-5 h-5" />} />
        <StatCard label="Vehicles Parked" value={data.vehicles_parked} tone="blue" icon={<Car className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2">
          <CardTitle>Bed availability by ward</CardTitle>
          <div className="space-y-4">
            {data.ward_census.map((ward) => {
              const pct = ward.total ? Math.round((ward.occupied / ward.total) * 100) : 0
              return (
                <div key={ward.ward}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{ward.ward}</span>
                    <span className="text-slate-500"><strong className="text-emerald-600">{ward.available}</strong> free · {ward.occupied}/{ward.total} occupied</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <Link to="/wards" className="inline-block mt-4 text-sm text-blue-700 font-medium">See patients by ward →</Link>
        </Card>
        <Card>
          <CardTitle>Doctors on duty</CardTitle>
          <div className="divide-y divide-slate-100">
            {data.doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{doctor.name}</p>
                  <p className="text-xs text-slate-500">{doctor.clinic} · {doctor.waiting_count} waiting</p>
                </div>
                <Badge status={doctor.status}>{titleCaseStatus(doctor.status)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <CardTitle>Latest Hospital Visit Activity</CardTitle>
        {data.recent_activity.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recent_activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium text-blue-700">{item.queue_number}</p>
                  <p className="text-slate-600">{item.patient_name} · {item.clinic}</p>
                </div>
                <Badge status={item.status} />
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No hospital visits yet today.</p>}
      </Card>
    </div>
  )
}
