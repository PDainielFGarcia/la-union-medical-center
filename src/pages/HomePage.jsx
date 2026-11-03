import { Link, Navigate } from 'react-router-dom'
import { brand } from '../assets/brand'
import { useAuth } from '../auth/AuthContext'
import { PublicFooter } from '../components/PublicFooter'
import { roleHome } from '../utils/constants'

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

export function HomeGate() {
  const { user, isAuthenticated, loading } = useAuth()
  if (isAuthenticated) return <Navigate to={roleHome(user.role)} replace />
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f9] text-sm text-slate-600" role="status">
        Loading…
      </div>
    )
  }
  return <HomePage />
}

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1d4ed8]">
      <section className="relative overflow-hidden bg-[linear-gradient(155deg,#3b82f6_0%,#1d4ed8_42%,#1e3a8a_100%)] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/5" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="flex items-center gap-3">
            <img src={brand.lumcSeal} alt="La Union Medical Center seal" className="h-14 w-14 rounded-full bg-white object-contain shadow-md" />
            <div>
              <p className="text-2xl font-bold leading-none">LUMC</p>
              <p className="mt-1 text-sm text-blue-100">La Union Medical Center</p>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                Complete Hospital Operations, One Platform.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-blue-50 sm:text-lg">
                Visitor approvals and QR gate passes, hospital visit queues, ward and bed availability, admissions, and parking — all in one role-based system.
              </p>
              <ul className="mt-8 grid max-w-xl grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-blue-50">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[#1d4ed8] shadow-sm hover:bg-blue-50"
                >
                  Log In
                </Link>
                <Link
                  to="/hospital-information"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/70 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Hospital Information History
                </Link>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-white/20 bg-white/10 px-6 py-8 text-center shadow-lg backdrop-blur-sm">
              <img src={brand.lumcSeal} alt="" className="h-52 w-52 object-contain drop-shadow-md sm:h-64 sm:w-64" />
              <p className="mt-4 text-sm font-medium text-white">La Union Medical Center</p>
              <p className="mt-1 text-xs tracking-[0.2em] text-blue-100">EST. 2002</p>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
