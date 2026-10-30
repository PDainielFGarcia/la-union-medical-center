# LUMC Laravel API

Base URL: `http://localhost:8000/api` (frontend: `VITE_API_BASE_URL`).

All endpoints except `POST /login` require `Authorization: Bearer {token}` (Laravel Sanctum).

Success responses are `{ "data": ... }` (or `{ "message": ... }`). Errors:

```json
{ "message": "Human-readable error", "errors": { "field": ["..."] } }
```

`401` not logged in, `403` wrong role, `404` not found, `409` conflict (duplicate), `422` validation / business rule.

## Roles

`administrator`, `security_guard`, `opd_staff` (OPD & Admission Staff), `department_secretary` (office secretary — one per office, approves office visits only), `nursing_staff`, `doctor`.

The `role:` middleware always admits administrators. In the tables below, **Admin** = administrator only.

## Auth

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| POST | `/login` | public | `{ email, password }` → `{ token, token_type, user }`. Throttled 10/min. |
| POST | `/logout` | any | Revokes current token |
| GET | `/user` | any | Current user |

## Common

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/dashboard` | any | Today's counts (secretaries: own office), bed totals, ward census, vehicles parked |
| GET | `/search?q=` | any | Global search |
| GET | `/notifications` | any | Own + role-wide + global |
| POST | `/notifications/read` | any | Mark read |
| GET | `/departments`, `/clinics`, `/rejection-reasons`, `/parking-areas` | any | Catalogs. `/parking-areas?active_only=1` |
| GET | `/settings` | any | Current settings |

## Visitors (same-day walk-in)

Two visit types:

- **`office`** — guard registers and picks one of the 12 offices (`departments`) → that office's secretary approves (QR issued) or rejects.
- **`patient`** — guard picks a currently admitted patient (`GET /inpatients`) → the **guard** approves at registration and the QR is issued immediately. Not allowed if the patient is not admitted to a bed. Visiting hours and visitors per patient are at the guard's discretion (not enforced).

Both: guard scans QR at entry → scans again at exit.

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/inpatients?ward_id=&room_type=&q=` | guard | Admitted patients with a bed: `{ wards, patients: [{ admission_id, patient_name, ward, room_type, room, bed_number, location }] }`. Name and location only. |
| GET | `/visitors` | guard, secretary | Filters: `status`, `date`, `visit_type`, `department_id`, `q`. Secretaries only see office visits for their own office. |
| POST | `/visitors` | guard | See bodies below. `409` if this person already has an open visit to the same office/patient today. |
| GET | `/visitors/{id}/pass` | guard, secretary | Pass details + QR payload (approved/inside only) |
| GET | `/visitors/{id}/scans` | guard, secretary | Scan history |
| POST | `/visitors/{id}/approve` | secretary of that office (office visits) | `{ remarks? }` → issues QR |
| POST | `/visitors/{id}/reject` | secretary of that office (office visits) | `{ rejection_reason_id, rejection_notes? }` |
| POST | `/visitor-passes/scan` | guard | `{ token }` (raw `VISIT-PASS:...` text). Approved → entry, inside → exit. Response `{ action: "entry"|"exit", message, visit }`. `404` unknown QR; `422 { message, code, visit }` for expired/used/not approved. |
| POST | `/visitors/{id}/scan` | guard | Manual entry/exit without QR (same rules) |
| POST | `/visitors/{id}/gate-reject` | guard | Turn away at gate: `{ rejection_reason_id, rejection_notes? }` |
| POST | `/visitors/{id}/cancel` | guard | Only pending/approved visits |

`POST /visitors` — office transaction:

```json
{
  "visit_type": "office",
  "full_name": "Juan Dela Cruz",
  "age": 34,
  "address": "San Fernando, La Union",
  "contact_number": "09171234567",
  "purpose": "Document Request",
  "department_id": 5,
  "person_to_visit": "Ms. Santos",
  "id_type": "Driver's License",
  "id_number": "N01-23-456789",
  "guardian_id": null,
  "guardian": { "full_name": "...", "relationship": "...", "contact_number": "..." },
  "vehicle": { "plate_number": "ABC 1234", "type": "Car", "color": "White", "parking_area_id": 1, "slot_number": "A-12" }
}
```

`POST /visitors` — patient visit (returns status `approved` with `qr_token`, `person_to_visit` = patient name, `visit_location` e.g. `Medical Ward No. 1 · Private Room 1 · MW1-PR-01`):

```json
{
  "visit_type": "patient",
  "admission_id": 1,
  "full_name": "Ana Dela Cruz",
  "address": "San Fernando, La Union",
  "contact_number": "09170000010",
  "purpose": "Patient Visit",
  "age": 40
}
```

Errors: `422` "patient is not currently admitted".

A guardian (`guardian_id` or `guardian.*`) is required when `age` is under `settings.minor_age_threshold` (default 18). `vehicle` is optional for both types.
Visit statuses: `pending_approval`, `approved`, `inside`, `completed`, `rejected`, `cancelled`, `expired` (past the visit day).

## Patients and OPD

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/patients?q=` | OPD, nurse, doctor | Search name / patient ID / contact / PhilHealth |
| GET | `/patients/{id}` | same | Includes encounters and `current_admission` |
| POST | `/patients` | OPD | Required: `first_name`, `last_name`, `birthday`, `sex`, `complete_address`. Optional: middle name, contact, civil status, nationality, religion, `philhealth_number`, spouse/father/mother names. Returns `LUMC-NNNN`. |
| GET | `/opd-registrations?date=` | OPD, nurse, doctor | Defaults to today |
| POST | `/opd-registrations` | OPD | `{ patient_id, clinic_id?, doctor_id?, reason?, registration_type?, vehicle? }` → encounter + queue ticket. `409` if already queued today. |
| POST | `/opd-encounters/{id}/triage` | nurse | Symptom checklist booleans (`cough`, `fever`, `runny_nose`, `vomiting_diarrhea`, `loss_taste_smell`, `body_aches`, `difficulty_breathing`, `sore_throat`, `covid_exposure`), `symptom_duration?`, `notes?`, `doctor_id?`. Initial notes only. |
| GET | `/queues?clinic_id=&queue_date=` | OPD, nurse, doctor | Defaults to today |
| POST | `/queues/{id}/call` \| `/serve` \| `/done` \| `/skip` | OPD, doctor, nurse | `serve` marks the patient as seen by the doctor |
| POST | `/queues/{id}/cancel` | OPD | |
| GET | `/doctors` | OPD, nurse, doctor | |
| POST | `/doctors` | Admin | |
| PUT | `/doctors/{id}` | OPD, doctor | Schedule / duty status |

## Beds and admissions

Nurses and doctors can **view** wards, beds and who is in them. Only **OPD & Admission staff** (and admins) can change anything. In this table **OPD** = OPD & Admission staff.

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/wards` | OPD, nurse, doctor | Per ward: totals by status and room type |
| GET | `/beds` | same | Filters: `ward`/`ward_id`, `status`, `room_type` |
| GET | `/admissions?status=` | same | |
| GET | `/bed-events?date=` | same | Bed history |
| POST | `/admissions` | OPD | `{ patient_id, opd_encounter_id?, priority? (Normal/Urgent/Emergency), reason?, bed_id? }`. With `bed_id` the patient is admitted right away, otherwise `waiting_for_bed`. `409` if already admitted. |
| POST | `/admissions/{id}/assign` | OPD | `{ bed_id }` or `{ bed_number }`. Also used for transfers (old bed → cleaning). |
| POST | `/admissions/{id}/discharge` | OPD | `{ discharge_notes? }`. Bed → cleaning. |
| POST | `/beds/{id}/reserve` | OPD | `{ reserved_for, notes? }` |
| POST | `/beds/{id}/status` | OPD | `{ status: available|cleaning|maintenance|unavailable, notes? }`. Not allowed on occupied beds. |

## Parking

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/vehicles?status=&parking_area_id=&date=&q=` | guard, OPD | |
| POST | `/vehicles` | guard, OPD | `{ plate_number, owner_type: visitor|patient|other, parking_area_id, slot_number?, type?, color?, owner?, visitor_id?, patient_id? }`. `409` if the plate is already parked. |
| POST | `/vehicles/{id}/exit` | guard, OPD | |
| POST | `/parking-areas` | Admin | `{ name, code, capacity? }` |
| PUT | `/parking-areas/{id}` | Admin | `{ name?, code?, capacity?, is_active? }` |

## Reports and exports (Admin)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/reports/summary` | Dashboard-style totals and peak hours |
| GET | `/reports/daily?date=` | Daily summary (JSON) |
| GET | `/reports/daily/{type}.pdf?date=` | `type` = `patients`, `visitors`, `audit` |
| GET | `/exports/{dataset}.csv?from=&to=` | `dataset` = `patients`, `opd`, `admissions`, `census`, `visitors`, `vehicles`, `audit`. UTF-8 CSV for Google Sheets / Excel. |

The scheduler also saves the three daily PDFs to `backend/storage/app/reports/{date}/` at 00:15 for the previous day.

## Audit logs

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/audit-logs?date=&action=&role=&q=` | Admin, guard | Guards only see visitor and vehicle entries |

## Backups (Admin)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/backups` | List backup files |
| POST | `/backups` | Run a backup now |
| GET | `/backups/{name}` | Download a `.sql.gz` file |

## Users and settings (Admin)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/users` | |
| POST | `/users` | `{ name, email, role, department_id?, password? }` |
| PUT | `/users/{id}` | `{ name?, email?, role?, department_id?, password?, status: active|inactive }` |
| PUT | `/settings` | `hospital_name`, `minor_age_threshold.years`, `backup_retention_days.days` |
