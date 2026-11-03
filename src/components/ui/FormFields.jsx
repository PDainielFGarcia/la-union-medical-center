import { cn } from '../../utils/cn'

export function Input({ label, id, error, className, hint, startAdornment, endAdornment, variant = 'default', ...props }) {
  const inputId = id || props.name
  const glass = variant === 'glass'
  return (
    <div>
      {label ? (
        <label
          htmlFor={inputId}
          className={glass
            ? 'mb-1.5 block text-xs font-semibold tracking-[0.14em] text-white uppercase'
            : 'mb-1.5 block text-sm font-medium text-slate-700'}
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        {startAdornment ? (
          <span className={cn('pointer-events-none absolute top-1/2 left-3 -translate-y-1/2', glass ? 'text-white/70' : 'text-slate-400')}>
            {startAdornment}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            'w-full min-h-11 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2',
            glass
              ? 'border-white/25 bg-white/15 text-white placeholder:text-white/60 focus:border-white/50 focus:ring-white/40'
              : 'border-slate-300 bg-white text-slate-900 focus:border-transparent focus:ring-blue-500',
            startAdornment && 'pl-10',
            endAdornment && 'pr-12',
            error && (glass ? 'border-red-200' : 'border-red-400'),
            className,
          )}
          {...props}
        />
        {endAdornment ? <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{endAdornment}</span> : null}
      </div>
      {hint ? <p className={cn('mt-1 text-xs', glass ? 'text-blue-100' : 'text-slate-500')}>{hint}</p> : null}
      {error ? <p className={cn('mt-1 text-xs', glass ? 'text-red-100' : 'text-red-600')}>{error}</p> : null}
    </div>
  )
}

export function Select({ label, id, error, children, className, ...props }) {
  const inputId = id || props.name
  return (
    <div>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={inputId}
        className={cn(
          'w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500',
          error && 'border-red-400',
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
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
