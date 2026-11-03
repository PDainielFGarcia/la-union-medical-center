import { cn } from '../../utils/cn'

export function Card({ children, className, padding = true }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm', padding && 'p-5 sm:p-6', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-base font-semibold tracking-tight text-slate-900">{children}</h3>
      {action}
    </div>
  )
}
