export function StatCard({ label, value, hint, icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {hint ? <p className="text-xs text-slate-400 mt-1">{hint}</p> : null}
      </div>
      {icon ? <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</div> : null}
    </div>
  )
}
