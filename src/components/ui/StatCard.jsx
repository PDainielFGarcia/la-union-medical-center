const tones = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
}

export function StatCard({ label, value, hint, icon, tone = 'blue' }) {
  return (
    <div className="flex min-h-[112px] items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-1 text-xs leading-5 text-slate-400">{hint}</p> : null}
      </div>
      {icon ? <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}>{icon}</div> : null}
    </div>
  )
}
