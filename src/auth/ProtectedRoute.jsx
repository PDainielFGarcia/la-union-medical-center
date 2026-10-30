import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoadingState } from '../components/ui/LoadingState'
import { roleHome } from '../utils/constants'

export function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState label="Loading session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles?.length && !roles.includes(user.role) && user.role !== 'administrator') {
    return <Navigate to={roleHome(user.role)} replace state={{ accessDenied: true }} />
  }

  return children
}

export function GuestRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState label="Loading..." />
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to={roleHome(user?.role)} replace />
  }
  return children
}
