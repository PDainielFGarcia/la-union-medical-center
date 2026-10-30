import { cn } from '../utils/cn'

export function BrandMark({ size = 'md' }) {
  const box = size === 'lg' ? 'w-12 h-12 rounded-xl' : 'w-9 h-9 rounded-lg'
  const icon = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'
  return (
    <div className={cn(box, 'bg-blue-600 flex items-center justify-center')}>
      <svg className={cn(icon, 'text-white')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v6m0 0l3-3m-3 3L9 5m3 16v-6m0 0l3 3m-3-3l-3 3M2 12h6m0 0l-3-3m3 3l-3 3m16 0h-6m0 0l3-3m-3 3l3 3" />
      </svg>
    </div>
  )
}
