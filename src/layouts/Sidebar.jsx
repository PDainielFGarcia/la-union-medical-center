import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { brand } from '../assets/brand'
import { ROLE_LABELS } from '../utils/constants'
import { initials } from '../utils/format'
import { navForRole } from './navConfig'
import { roleColor } from './roleTheme'
import { cn } from '../utils/cn'

export function Sidebar({ user, onLogout, open, onClose }) {
  const sections = navForRole(user.role)
  const color = roleColor(user.role)

  return (
    <>
      {open ? (
        <button type="button" className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" aria-label="Close menu" onClick={onClose} />
      ) : null}
      <aside
        style={{ backgroundColor: color }}
        className={cn(
          'fixed top-0 left-0 z-40 flex h-screen w-64 flex-col text-white transition-transform lg:sticky',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/15 px-4">
          <img src={brand.lumcSeal} alt="" className="h-10 w-10 rounded-full bg-white object-contain" />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-white">LUMC</p>
            <p className="truncate text-xs text-white/80">La Union Medical Center</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.14em] text-white/75 uppercase">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors',
                          isActive ? 'bg-white/20 font-semibold text-white' : 'text-white/90 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-2xl bg-black/20 p-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-white/75">{ROLE_LABELS[user.role]}</p>
            </div>
            <button type="button" onClick={onLogout} className="flex h-11 w-11 items-center justify-center rounded-xl text-white/85 hover:bg-white/10" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
