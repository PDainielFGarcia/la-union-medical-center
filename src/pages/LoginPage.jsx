import { useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { brand } from '../assets/brand'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/FormFields'
import { useAuth } from '../auth/AuthContext'
import { roleHome } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(160deg,#2f6bff_0%,#1d4ed8_46%,#1e3a8a_100%)] text-white">
      <img
        src={brand.provinceSeal}
        alt=""
        className="pointer-events-none absolute -left-16 top-1/2 hidden w-[28rem] -translate-y-1/2 opacity-20 lg:block"
      />
      <img
        src={brand.lumcSeal}
        alt=""
        className="pointer-events-none absolute -right-10 top-1/2 hidden w-[30rem] -translate-y-1/2 opacity-20 lg:block"
      />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <img src={brand.lumcSeal} alt="La Union Medical Center seal" className="h-12 w-12 shrink-0 rounded-full bg-white object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide sm:text-base">LA UNION MEDICAL CENTER</p>
            <p className="truncate text-[10px] font-medium tracking-[0.12em] text-blue-100 sm:text-[11px]">VISITOR/PATIENT MANAGEMENT SYSTEM</p>
          </div>
          <img src={brand.provinceSeal} alt="" className="hidden h-10 w-10 object-contain sm:block" />
          <img src={brand.bagongPilipinas} alt="Bagong Pilipinas" className="hidden h-10 w-10 object-contain md:block" />
        </div>
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-medium hover:bg-white/20 sm:px-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back to Homepage</span>
          <span className="sm:hidden">Home</span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <img src={brand.lumcSeal} alt="" className="mb-4 h-24 w-24 object-contain drop-shadow-lg" />
        <form
          className="w-full max-w-md rounded-2xl border border-white/20 bg-[#1e4fbe]/70 p-6 shadow-2xl backdrop-blur-md sm:p-8"
          onSubmit={handleSubmit}
        >
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="mt-1 text-sm text-blue-100">Enter your login and password</p>
          <div className="mt-6 space-y-4">
            <Input
              variant="glass"
              label="Login"
              name="login"
              autoComplete="username"
              placeholder="Your login"
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              startAdornment={<User className="h-4 w-4" aria-hidden="true" />}
            />
            <Input
              variant="glass"
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              startAdornment={<Lock className="h-4 w-4" aria-hidden="true" />}
              endAdornment={(
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            />
            {error ? (
              <p className="rounded-lg bg-white px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
            ) : null}
            <Button
              type="submit"
              className="w-full min-h-12 !bg-[#dc2626] text-base tracking-wide uppercase hover:!bg-[#b91c1c]"
              disabled={submitting}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </div>
        </form>
      </main>

      <p className="relative z-10 px-4 pb-5 text-center text-xs tracking-wide text-blue-100">
        © 2026 LA UNION MEDICAL CENTER — AGOO, LA UNION — AGKAYSA!
      </p>
    </div>
  )
}
