export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500" role="status">
      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      {label}
    </div>
  )
}
