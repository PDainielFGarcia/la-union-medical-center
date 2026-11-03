import { Mail, MapPin, Phone } from 'lucide-react'
import { brand } from '../assets/brand'

export function PublicFooter() {
  return (
    <footer className="bg-[#0b1736] text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={brand.lumcSeal} alt="" className="h-14 w-14 object-contain" />
            <div>
              <p className="text-sm font-bold tracking-wide text-white">LA UNION MEDICAL CENTER</p>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400">OFFICIAL HOSPITAL PORTAL</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            A center of excellence in healthcare, training, and research serving La Union since 2002.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <img src={brand.provinceSeal} alt="Seal of the Province of La Union" className="h-12 w-12 object-contain" />
            <img src={brand.bagongPilipinas} alt="Bagong Pilipinas" className="h-12 w-12 object-contain" />
            <img src={brand.ihomp} alt="iHOMP, Integrated Hospital Operation Management Program Unit" className="h-14 w-14 object-contain" />
            <img src={brand.agkaysa} alt="La Union: Agkaysa!" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-amber-400">
            <span className="inline-block h-4 w-1 rounded-full bg-amber-400" aria-hidden="true" />
            CONTACT INFO
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>Barangay Nazareno, Agoo, La Union, 2504</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>
                <a className="hover:text-white" href="tel:+63726075541">(072) 607-5541</a>
                {' · '}
                <a className="hover:text-white" href="tel:+63726075939">(072) 607-5939</a>
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <a className="break-all hover:text-white" href="mailto:pglu_lumc@launion.gov.ph">pglu_lumc@launion.gov.ph</a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>
                Emergency:{' '}
                <a className="hover:text-white" href="tel:+639277286330">0927-728-6330</a>
                {' '}(24/7)
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-amber-400">
            <span className="inline-block h-4 w-1 rounded-full bg-amber-400" aria-hidden="true" />
            GOVERNING BODY
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Board of Trustees chaired by the Incumbent Governor of La Union. Established under Republic Act 9259.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xl font-extrabold tracking-wide text-amber-300">AGKAYSA!</p>
            <p className="text-sm text-slate-300">Province of La Union</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs tracking-wide text-slate-400">
        © 2026 LA UNION MEDICAL CENTER — AGOO, LA UNION — AGKAYSA!
      </div>
    </footer>
  )
}
