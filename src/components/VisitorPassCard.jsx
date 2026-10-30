import { Badge } from './ui/Badge'
import { QrCodeDisplay } from './QrCodeDisplay'
import { qrPayload } from '../utils/visitorPass'
import { titleCaseStatus } from '../utils/format'

const DISPLAYABLE = ['approved', 'inside']

export function VisitorPassCard({ visit }) {
  if (!visit) return null
  const showQr = visit.qr_token && DISPLAYABLE.includes(visit.status)

  return (
    <article className="visitor-pass max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      <div className="bg-blue-700 text-white px-6 py-4">
        <p className="text-xs tracking-[0.2em] font-semibold">LUMC</p>
        <h2 className="text-xl font-bold">VISITOR PASS</h2>
        <p className="text-blue-100 text-sm">La Union Medical Center · Valid today only</p>
      </div>
      <div className="p-6 space-y-3 text-sm">
        <p><span className="text-slate-500">Visitor:</span> <strong>{visit.full_name}</strong></p>
        <p><span className="text-slate-500">{visit.visit_type === 'patient' ? 'Visiting:' : 'Office:'}</span> {visit.visit_type === 'patient' ? `${visit.person_to_visit} — ${visit.visit_location}` : visit.department}</p>
        {visit.visit_type !== 'patient' && visit.person_to_visit ? <p><span className="text-slate-500">To see:</span> {visit.person_to_visit}</p> : null}
        <p><span className="text-slate-500">Purpose:</span> {visit.purpose}</p>
        <p><span className="text-slate-500">Visit Date:</span> {visit.visit_date}</p>
        <p><span className="text-slate-500">Pass ID:</span> {visit.pass_id}</p>
        {visit.vehicle_plate ? <p><span className="text-slate-500">Vehicle:</span> {visit.vehicle_plate}{visit.parking_area ? ` · ${visit.parking_area}` : ''}{visit.parking_slot ? ` (${visit.parking_slot})` : ''}</p> : null}
        <p className="flex items-center gap-2">
          <span className="text-slate-500">Status:</span>
          <Badge status={visit.status}>{titleCaseStatus(visit.status)}</Badge>
        </p>
        <div className="pt-2">
          {showQr ? <QrCodeDisplay value={qrPayload(visit.qr_token)} size={240} /> : (
            <p className="text-center text-slate-500 py-8">
              {visit.status === 'pending_approval'
                ? 'Waiting for the office secretary to approve this visit.'
                : 'This pass can no longer be used.'}
            </p>
          )}
        </div>
        <p className="text-center text-xs text-slate-500 pt-2">
          Present this QR to the guard when entering and again when leaving. It expires at the end of the visit day.
        </p>
      </div>
    </article>
  )
}
