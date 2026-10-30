import { cn } from '../../utils/cn'

export function Input({ label, id, error, className, hint, ...props }) {
  const inputId = id || props.name
  return (
    <div>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export function Select({ label, id, error, children, className, ...props }) {
  const inputId = id || props.name
  return (
    <div>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      ) : null}
      <select
        id={inputId}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export function Textarea({ label, id, error, className, ...props }) {
  const inputId = id || props.name
  return (
    <div>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
