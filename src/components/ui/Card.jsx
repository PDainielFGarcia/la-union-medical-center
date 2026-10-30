import { cn } from '../../utils/cn'

export function Card({ children, className, padding = true }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', padding && 'p-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
      {action}
    </div>
  )
}
