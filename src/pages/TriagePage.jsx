import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { UserRound, Users } from 'lucide-react'

export function TriagePage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Triage / First Contact" subtitle="Select who is entering to route them to the right registration" />
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Who is entering the hospital?</h2>
      <p className="text-sm text-slate-500 mb-6">Select one to begin the registration process</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <button type="button" onClick={() => navigate('/patient-registration')} className="text-left bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <UserRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Patient</h3>
          <p className="text-sm text-slate-500 mt-1">For medical consultation, check-up, or treatment</p>
          <p className="text-sm text-blue-600 font-medium mt-4">Routes to OPD</p>
        </button>
        <button type="button" onClick={() => navigate('/visitors')} className="text-left bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Visitor</h3>
          <p className="text-sm text-slate-500 mt-1">For visiting a patient or official business</p>
          <p className="text-sm text-blue-600 font-medium mt-4">Routes to Security</p>
        </button>
      </div>
      <p className="text-sm text-slate-500 mt-6">This screen is used by front-desk personnel to quickly route patients and visitors.</p>
    </div>
  )
}
