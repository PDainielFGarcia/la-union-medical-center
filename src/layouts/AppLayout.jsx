import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { roleHome } from '../utils/constants'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { canAccessPath } from './navConfig'

export function AppLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [accessNotice, setAccessNotice] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    if (location.state?.accessDenied) {
      setAccessNotice("You aren't allowed to take that action.")
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (!accessNotice) return undefined
    const timer = setTimeout(() => setAccessNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [accessNotice])

  if (user && !canAccessPath(user.role, location.pathname)) {
    return <Navigate to={roleHome(user.role)} replace state={{ accessDenied: true }} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} onLogout={handleLogout} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header user={user} onMenu={() => setOpen(true)} />
        {accessNotice ? (
          <div className="mx-4 lg:mx-6 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            {accessNotice}
          </div>
        ) : null}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
