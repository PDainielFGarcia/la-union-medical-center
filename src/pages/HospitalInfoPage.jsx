import { Link } from 'react-router-dom'
import { brand } from '../assets/brand'
import { useAuth } from '../auth/AuthContext'
import { PublicFooter } from '../components/PublicFooter'
import { roleHome } from '../utils/constants'

const DEPARTMENTS = [
  {
    title: '1. Department of Surgery',
    lead: 'Sub-specialties include:',
    items: [
      'Orthopedic',
      'Ophthalmology',
      'Otorhinolaryngology',
      'Neuro Surgical',
      'Urology',
      'Thoracic & Cardiovascular Surgery',
    ],
  },
  {
    title: '2. Department of Internal Medicine',
    lead: 'Sub-specialties include:',
    items: [
      'Adult Cardiology',
      'Gastroenterology',
      'Nephrology',
      'Ambulatory Diabetes',
      'DOTS Clinic',
    ],
  },
  {
    title: '3. Department of Obstetrics and Gynecology',
    lead: 'Sub-specialty:',
    items: ['Gynecologic Oncology'],
  },
  {
    title: '4. Department of Pediatrics',
    lead: 'Sub-specialty:',
    items: ['Pediatric Cardiology'],
  },
]

const MISSION = [
  'A comprehensive family medicine program with emphasis on the preventive, promotive and curative aspects of health care.',
  'A multi-specialty center with focus towards diagnostic and therapeutic component of the more difficult specialized cases.',
  'A training center for provincial medical and paramedical health provider.',
  'A research center for locally based public health concerns.',
]

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-[#182D69]">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700">{children}</div>
    </section>
  )
}

export function HospitalInfoPage() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-[#f3f5f9]">
      <header className="bg-[linear-gradient(155deg,#3b82f6_0%,#1d4ed8_48%,#1e3a8a_100%)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={brand.lumcSeal} alt="La Union Medical Center seal" className="h-12 w-12 rounded-full bg-white object-contain" />
              <span>
                <span className="block text-sm font-bold tracking-wide">LA UNION MEDICAL CENTER</span>
                <span className="block text-xs text-blue-100">Agoo, La Union</span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2">
              <Link to="/" className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-medium hover:bg-white/10">
                Back to Homepage
              </Link>
              {isAuthenticated ? (
                <Link to={roleHome(user.role)} className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#1d4ed8] hover:bg-blue-50">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#1d4ed8] hover:bg-blue-50">
                  Log In
                </Link>
              )}
            </div>
          </div>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-blue-100">LA UNION MEDICAL CENTER</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Hospital Information History</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:px-8 sm:py-10">
        <Section title="The Hospital">
          <p>
            The La Union Medical Center, located at Barangay Nazareno, Agoo, La Union, is a Level 2 Tertiary Provincial Hospital worth P650 million (11.3 million euro dollars) with a 100-bed authorized capacity. The hospital was donated by the European Union to replace the old Doña Gregoria Memorial Hospital (DGMH), which was damaged by the 1990 earthquake.
          </p>
          <p>
            The Hospital opened its doors to the people of La Union and nearby provinces last April 08, 2002, and was transformed into autonomization or Economic Enterprise for Sustainability and Development through Executive Order 004 Series of 2002, operating as such for the first two (2) years with a set of Board of Trustees chaired by then incumbent Governor, Honorable Victor F. Ortega.
          </p>
          <p>
            On March 02, 2005, the hospital was converted into a non-stock, non-profit local government controlled corporation by virtue of the enactment of Republic Act 9259.
          </p>
          <p>
            It is the first and only Provincial Hospital transformed into a non-stock, non-profit local government controlled corporation up to the present time. It has a set of Board of Trustees with fifteen (15) members chaired by the incumbent Governor of the province, Honorable Manuel C. Ortega.
          </p>
        </Section>

        <Section title="Major Clinical Departments">
          <p>The hospital operated with four (4) major clinical departments:</p>
          <div className="grid gap-4 md:grid-cols-2">
            {DEPARTMENTS.map((department) => (
              <article key={department.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-semibold text-slate-900">{department.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{department.lead}</p>
                <ul className="mt-3 space-y-2">
                  {department.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-800">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Hospital Workforce">
            <p>The hospital operates with a manpower complement of 294 employees as of the present time.</p>
            <p>
              Though due to voluminous work to be done on a 24/7 and 365 days in a year, the hospital needs more additional employees, but due to budgetary constraints, hiring of additional employees is not possible.
            </p>
          </Section>
          <Section title="Financial Operations">
            <p>
              The hospital&apos;s financial operations under the Finance Department are fully computerized with the setting up of a fully automated financial operations system and the computerized Electronic New Government Auditing System (E-NGAS).
            </p>
          </Section>
        </div>

        <Section title="Population and Patient Services">
          <p>The Province of La Union has a total population of 740,000.</p>
          <p>
            LUMC for the past ten (10) years has served 490,581 out-patients and 137,593 in-patients or a total of 628,174 or more than 50% of the population.
          </p>
          <p>Also, for the past ten (10) years, the ratio of patients served averages to:</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              ['48%', 'Charity Patients'],
              ['45%', 'PhilHealth Insurance Patients'],
              ['7%', 'Private Paying Patients'],
            ].map(([value, label]) => (
              <li key={label} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                <p className="text-2xl font-bold text-[#182D69]">{value}</p>
                <p className="mt-1 text-sm text-slate-700">{label}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Hospital Budget and Sustainability">
          <p>
            LUMC has a P40 million annual budget with financial assistance of P35 million from the Provincial Government of La Union and P5 million from the Governor&apos;s Economic Development Fund (EDF).
          </p>
          <p>
            And so, La Union Medical Center must generate about P100 million cost recovery and revenue enhancement program to sustain the operations of the hospital.
          </p>
          <p>The hospital has established a Private and Public Mix type of revenue enhancement program.</p>
          <p>The hospital&apos;s Social Service Section classifies patients according to their capacity to pay from Class A to D.</p>
          <p>The amount/cost of hospital services which are not paid are considered as quantified free service extended to indigent patients.</p>
        </Section>

        <Section title="Hospital Infrastructure and Development">
          <p>Originally, the hospital had twenty-five (25) detached buildings.</p>
          <p>However, from the hospital&apos;s income, two (2) buildings were added:</p>
          <ul className="space-y-2">
            {['A 2-storey Medical Ward Building', 'A Pediatric Ward Building'].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>At present, a 2-storey OB-Gyne building is being constructed (Phase 1), funded by the Department of Health.</p>
          <p>However, Phase 2 requires additional funding of about P15 million to be fully functional and operational.</p>
        </Section>

        <Section title="Commitment to Healthcare">
          <p>
            The La Union Medical Center, though with limited resources, will try its best to continue to fulfill its mission and vision in the delivery of quality tertiary medical/surgical care delivered in an atmosphere of competent, affordable, compassionate, friendly, and caring hospital environment, most especially to the people of La Union.
          </p>
        </Section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 border-t-4 border-t-[#182D69] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-[#182D69]">Vision</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-700">
              The La Union Medical Center shall be the center-point for the delivery of quality tertiary medical/surgical care for the people especially in La Union provided in an atmosphere of competent, affordable, compassionate friendly and caring hospital environment.
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 border-t-4 border-t-[#1d4ed8] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-[#182D69]">Mission</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-700">
              The La Union Medical Center is deeply committed in transmitting into action:
            </p>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-7 text-slate-700">
              {MISSION.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
