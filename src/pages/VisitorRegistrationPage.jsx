import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi, parkingApi, visitorsApi } from '../api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/FormFields'
import { OtherSelect, resolveOther } from '../components/ui/OtherSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { PendingVisitQueue } from '../components/PendingVisitQueue'
import { useAsync } from '../hooks/useAsync'
import { ID_TYPES, PATIENT_VISIT_PURPOSES, ROOM_TYPES, ROOM_TYPE_LABELS, VEHICLE_TYPES, VISIT_PURPOSES } from '../utils/constants'
import { getErrorMessage } from '../utils/errors'

const emptyForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  address: '',
  contact_number: '',
  purpose: VISIT_PURPOSES[0],
  purpose_other: '',
  department_id: '',
  person_to_visit: '',
  age: '',
  id_type: ID_TYPES[0],
  id_type_other: '',
  id_number: '',
  has_vehicle: false,
  plate_number: '',
  vehicle_type: VEHICLE_TYPES[0],
  parking_area_id: '',
  slot_number: '',
}

function VisitTypeToggle({ value, onChange }) {
  const options = [
    { id: 'office', title: 'Office transaction', note: 'Sent to the office secretary for approval' },
    { id: 'patient', title: 'Visit an admitted patient', note: 'Guard checks the patient is admitted and approves' },
  ]
  return (
    <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`text-left rounded-xl border p-3 transition ${value === option.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <p className="text-sm font-semibold text-slate-900">{option.title}</p>
          <p className="text-xs text-slate-500">{option.note}</p>
        </button>
      ))}
    </div>
  )
}

function InpatientPicker({ data, loading, selectedId, onSelect, error }) {
  const [wardId, setWardId] = useState('')
  const [roomType, setRoomType] = useState('')
  const [q, setQ] = useState('')

  const matches = useMemo(() => (data?.patients || []).filter((p) =>
    (!wardId || String(p.ward_id) === wardId)
    && (!roomType || p.room_type === roomType)
    && p.patient_name.toLowerCase().includes(q.trim().toLowerCase())), [data, wardId, roomType, q])

  const selected = (data?.patients || []).find((p) => p.admission_id === selectedId)

  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800">Patient to visit *</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
          <option value="">All wards</option>
          {(data?.wards || []).map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
        </Select>
        <Select label="Room Type" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
          <option value="">All</option>
          {ROOM_TYPES.map((type) => <option key={type} value={type}>{ROOM_TYPE_LABELS[type]}</option>)}
        </Select>
        <Input label="Patient Name" placeholder="Type to search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading admitted patients…</p> : null}
      {!loading && matches.length === 0 ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No admitted patient matches. The patient is not listed in this ward, so the visit cannot be approved.
        </p>
      ) : null}
      {matches.length ? (
        <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {matches.map((p) => (
            <button
              key={p.admission_id}
              type="button"
              onClick={() => onSelect(p.admission_id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${selectedId === p.admission_id ? 'bg-blue-50' : ''}`}
            >
              <span className="font-medium text-slate-900">{p.patient_name}</span>
              <span className="block text-xs text-slate-500">{p.location}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Admitted: <strong>{selected.patient_name}</strong> — {selected.location}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export function VisitorRegistrationPage() {
  const departments = useAsync(() => catalogApi.departments(), [])
  const parkingAreas = useAsync(() => parkingApi.list({ active_only: 1 }), [])
  const inpatients = useAsync(() => visitorsApi.inpatients(), [])
  const [visitType, setVisitType] = useState('office')
  const [admissionId, setAdmissionId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const isPatientVisit = visitType === 'patient'

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function changeVisitType(type) {
    setVisitType(type)
    setErrors({})
    setMessage(null)
    setForm((current) => ({ ...current, purpose: type === 'patient' ? PATIENT_VISIT_PURPOSES[0] : VISIT_PURPOSES[0], purpose_other: '' }))
    if (type === 'patient') inpatients.reload({ silent: true })
  }

  function resetForm() {
    setForm({ ...emptyForm, purpose: isPatientVisit ? PATIENT_VISIT_PURPOSES[0] : VISIT_PURPOSES[0] })
    setAdmissionId(null)
    setErrors({})
  }

  function validate() {
    const next = {}
    if (!form.first_name.trim()) next.first_name = 'First name is required.'
    if (!form.last_name.trim()) next.last_name = 'Last name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (form.contact_number.trim() && !/^\d{11}$/.test(form.contact_number)) next.contact_number = 'Contact number must be exactly 11 digits.'
    if (form.purpose === 'Other' && !form.purpose_other.trim()) next.purpose = 'Please specify the purpose.'
    if (form.id_type === 'Other' && !form.id_type_other.trim()) next.id_type = 'Please specify the ID type.'
    if (!isPatientVisit && !form.department_id) next.department_id = 'Select the office to visit.'
    if (isPatientVisit && !admissionId) next.admission_id = 'Select an admitted patient.'
    if (form.has_vehicle && !form.plate_number.trim()) next.plate_number = 'Plate number is required.'
    if (form.has_vehicle && !form.parking_area_id) next.parking_area_id = 'Select the parking area.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function buildBody() {
    const body = {
      visit_type: visitType,
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || null,
      last_name: form.last_name.trim(),
      address: form.address,
      contact_number: form.contact_number.trim() || null,
      purpose: resolveOther(form.purpose, form.purpose_other),
      age: form.age === '' ? null : Number(form.age),
      id_type: resolveOther(form.id_type, form.id_type_other),
      id_number: form.id_number || null,
    }
    if (isPatientVisit) {
      body.admission_id = admissionId
    } else {
      body.department_id = Number(form.department_id)
      body.person_to_visit = form.person_to_visit || null
    }
    if (form.has_vehicle) {
      body.vehicle = { plate_number: form.plate_number, type: form.vehicle_type, parking_area_id: Number(form.parking_area_id), slot_number: form.slot_number || null }
    }
    return body
  }

  async function submit() {
    setSaving(true)
    try {
      const visitor = await visitorsApi.create(buildBody())
      setMessage(isPatientVisit
        ? { visitor, text: `${visitor.pass_id} approved to visit ${visitor.person_to_visit} (${visitor.visit_location}). Give the visitor the QR pass.` }
        : { visitor: null, text: `${visitor.pass_id} registered for ${visitor.department}. Waiting for the office secretary to approve; the QR pass will be ready once approved.` })
      resetForm()
    } catch (err) {
      setErrors({ form: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)
    if (validate()) submit()
  }

  const purposes = isPatientVisit ? PATIENT_VISIT_PURPOSES : VISIT_PURPOSES

  return (
    <div>
      <PageHeader title="Visitor Registration" subtitle="Same-day walk-in registration for office transactions and patient visits." />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <VisitTypeToggle value={visitType} onChange={changeVisitType} />

            <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
              <Input label="First Name *" name="first_name" placeholder="Juan" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} error={errors.first_name} />
              <Input label="Middle Name" name="middle_name" placeholder="Santos (optional)" value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} error={errors.middle_name} />
              <Input label="Last Name *" name="last_name" placeholder="Dela Cruz" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} error={errors.last_name} />
            </div>
            <Input
              label="Contact Number"
              name="contact_number"
              placeholder="09171234567"
              inputMode="numeric"
              maxLength={11}
              hint="Optional — if provided, exactly 11 digits"
              value={form.contact_number}
              onChange={(e) => update('contact_number', e.target.value.replace(/\D/g, '').slice(0, 11))}
              error={errors.contact_number}
            />
            <Input label="Age" name="age" type="number" min="0" placeholder="35" value={form.age} onChange={(e) => update('age', e.target.value)} />
            <div className="md:col-span-2">
              <Input label="Address *" name="address" value={form.address} onChange={(e) => update('address', e.target.value)} error={errors.address} />
            </div>

            {isPatientVisit ? (
              <InpatientPicker
                data={inpatients.data}
                loading={inpatients.loading}
                selectedId={admissionId}
                onSelect={setAdmissionId}
                error={errors.admission_id}
              />
            ) : (
              <>
                <Select label="Office to Visit *" name="department_id" value={form.department_id} onChange={(e) => update('department_id', e.target.value)} error={errors.department_id}>
                  <option value="">Select office</option>
                  {(departments.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
                <Input label="Person to See" name="person_to_visit" placeholder="Optional" value={form.person_to_visit} onChange={(e) => update('person_to_visit', e.target.value)} />
              </>
            )}

            <OtherSelect
              label="Purpose of Visit *"
              name="purpose"
              options={purposes}
              value={form.purpose}
              otherValue={form.purpose_other}
              onChange={(value) => update('purpose', value)}
              onOtherChange={(value) => update('purpose_other', value)}
              otherPlaceholder="Specify purpose"
              error={errors.purpose}
            />
            <OtherSelect
              label="ID Presented"
              name="id_type"
              options={ID_TYPES}
              value={form.id_type}
              otherValue={form.id_type_other}
              onChange={(value) => update('id_type', value)}
              onOtherChange={(value) => update('id_type_other', value)}
              otherPlaceholder="Specify ID type"
              error={errors.id_type}
            />
            <Input label="ID Number" name="id_number" placeholder="Optional" value={form.id_number} onChange={(e) => update('id_number', e.target.value)} />

            <label className="md:col-span-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.has_vehicle} onChange={(e) => update('has_vehicle', e.target.checked)} />
              Visitor brought a vehicle
            </label>
            {form.has_vehicle ? (
              <div className="md:col-span-2 grid md:grid-cols-4 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Input label="Plate Number *" name="plate_number" value={form.plate_number} onChange={(e) => update('plate_number', e.target.value.toUpperCase())} error={errors.plate_number} />
                <Select label="Vehicle Type" name="vehicle_type" value={form.vehicle_type} onChange={(e) => update('vehicle_type', e.target.value)}>
                  {VEHICLE_TYPES.map((item) => <option key={item}>{item}</option>)}
                </Select>
                <Select label="Parking Area *" name="parking_area_id" value={form.parking_area_id} onChange={(e) => update('parking_area_id', e.target.value)} error={errors.parking_area_id}>
                  <option value="">Select area</option>
                  {(parkingAreas.data || []).map((area) => (
                    <option key={area.id} value={area.id}>{area.name}{area.available != null ? ` (${area.available} free)` : ''}</option>
                  ))}
                </Select>
                <Input label="Slot No." name="slot_number" placeholder="Optional" value={form.slot_number} onChange={(e) => update('slot_number', e.target.value)} />
              </div>
            ) : null}

            {errors.form ? <p className="md:col-span-2 text-sm text-red-600">{errors.form}</p> : null}
            {message ? (
              <div className="md:col-span-2 text-sm text-emerald-700">
                <p>{message.text}</p>
                {message.visitor ? <Link className="font-medium text-blue-600 hover:underline" to={`/visitor-pass/${message.visitor.id}`}>Open QR pass →</Link> : null}
              </div>
            ) : null}
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : isPatientVisit ? 'Approve Visit & Issue QR' : 'Register & Send for Approval'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Clear Form</Button>
            </div>
          </form>
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-3">How it works</h2>
            <p className="text-sm font-medium text-slate-800">Office transaction</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600 mb-3">
              <li>Register the visitor and pick the office.</li>
              <li>That office's secretary approves or rejects.</li>
              <li>Once approved, give the visitor the QR pass.</li>
            </ol>
            <p className="text-sm font-medium text-slate-800">Patient visit</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600 mb-3">
              <li>Find the patient by ward, room type or name.</li>
              <li>If the patient is listed, approve — the QR is issued right away.</li>
              <li>If not listed, the visit cannot be approved.</li>
            </ol>
            <p className="text-sm text-slate-600">Scan the QR at the gate on entry, and again when the visitor leaves.</p>
          </Card>
          <PendingVisitQueue />
        </div>
      </div>
    </div>
  )
}
