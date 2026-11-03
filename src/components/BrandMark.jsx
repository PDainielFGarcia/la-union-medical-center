import { brand } from '../assets/brand'
import { cn } from '../utils/cn'

export function BrandMark({ size = 'md' }) {
  const box = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  return (
    <img src={brand.lumcSeal} alt="" className={cn(box, 'rounded-full bg-white object-contain')} />
  )
}
