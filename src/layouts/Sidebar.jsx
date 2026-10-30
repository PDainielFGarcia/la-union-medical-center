import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { ROLE_LABELS } from '../utils/constants'
import { initials } from '../utils/format'
import { navForRole } from './navConfig'
import { cn } from '../utils/cn'

export function Sidebar({ user, onLogout, open, onClose }) {
  const sections = navForRole(user.role)

  return (
    <>
      {open ? (
        <button type="button" className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" aria-label="Close menu" onClick={onClose} />
      ) : null}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-40 transition-transform',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
          <BrandMark />
          <div>
            <p className="text-white font-bold text-sm leading-tight">LUMC</p>
            <p className="text-slate-400 text-xs">La Union Medical Center</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                          isActive ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 hover:text-white',
                        )
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-400 text-xs truncate">{ROLE_LABELS[user.role]}</p>
          </div>
          <button type="button" onClick={onLogout} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400" aria-label="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  )
}
