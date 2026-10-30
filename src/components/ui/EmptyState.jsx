export function EmptyState({ title = 'Nothing to show yet', description }) {
  return (
    <div className="text-center py-12 px-4">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? <p className="text-sm text-slate-500 mt-1">{description}</p> : null}
    </div>
  )
}
