import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/FormFields'
import { useAuth } from '../auth/AuthContext'
import { roleHome } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'

const LOGO_SRC = '/lumc-logo.png'

const FEATURES = [
  'Visitor Management',
  'Patient & Hospital Visits',
  'Queue Management',
  'Bed Management',
  'Parking',
  'QR Gate Scanning',
  'Daily Reports & Backups',
  'Audit & Compliance',
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!loginName.trim() || !password) {
      setError('Login and password are required.')
      return
    }
    setSubmitting(true)
    try {
      const user = await login(loginName.trim(), password)
      navigate(roleHome(user.role), { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={LOGO_SRC}
              alt="La Union Medical Center logo"
              className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-white/40 bg-white"
            />
            <div>
              <h1 className="text-2xl font-bold">LUMC</h1>
              <p className="text-blue-200 text-sm">La Union Medical Center</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Complete Hospital Operations, One Platform.</h2>
          <p className="text-blue-100 text-lg">
            Visitor approvals and QR gate passes, hospital visit queues, ward and bed availability, admissions, and parking — all in one role-based system.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-blue-100">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs relative z-10">© 2026 La Union Medical Center.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <img
              src={LOGO_SRC}
              alt="La Union Medical Center logo"
              className="w-20 h-20 rounded-full object-cover shadow-md bg-white"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">LUMC</h1>
              <p className="text-slate-500 text-sm">La Union Medical Center</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="hidden lg:flex justify-center mb-6">
              <img
                src={LOGO_SRC}
                alt="La Union Medical Center logo"
                className="w-24 h-24 rounded-full object-cover shadow-md bg-white"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center lg:text-left">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1 text-center lg:text-left">Enter your login and password</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Login"
                name="login"
                autoComplete="username"
                placeholder="Your login"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </div>
          <p className="lg:hidden text-center text-slate-400 text-xs mt-6">© 2026 La Union Medical Center.</p>
        </div>
      </div>
    </div>
  )
}
