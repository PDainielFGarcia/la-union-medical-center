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
    <div className="flex min-h-screen bg-[#f3f5f9]">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} onLogout={handleLogout} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header user={user} onMenu={() => setOpen(true)} />
        {accessNotice ? (
          <div className="mx-4 mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:mx-8" role="alert">
            {accessNotice}
          </div>
        ) : null}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
