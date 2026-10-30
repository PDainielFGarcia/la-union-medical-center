# Database (MySQL)

Database name: `lumc`. Engine InnoDB, charset `utf8mb4`, timezone `Asia/Manila` (app-level).

Source of truth: the Laravel migrations in `backend/database/migrations/`. [`database/schema.sql`](../database/schema.sql) is a structure-only dump generated from them (see the header of that file for the regenerate command).

## Scope

The system stores **administrative data only**:

- Visitors (same-day walk-in, QR entry/exit): office transactions approved by that office's secretary; patient visits approved by the guard after confirming the patient is admitted
- Patients coming in (registration + OPD queue), whether they were seen by a doctor
- Admissions, discharges, ward/bed assignment and bed availability
- Visitor and patient vehicles (plate + parking location)
- Audit trail, notifications, settings

**Not stored:** diagnoses, medications, lab results, billing. The OPD symptom checklist (`triage_records`) is an initial screening note for the nurse/doctor only. There is **no iHOMIS integration** and **no Google Sheets sync** — data leaves the system only as PDF reports and CSV exports.

## Defaults

| Topic | Default |
| --- | --- |
| Minor age | Under 18 requires a guardian for **patients** at registration and admission (`settings.minor_age_threshold`); not enforced for visitors |
| Visits | Same day only; QR expires at the end of the visit day |
| Patient visiting hours / visitors per patient | Not enforced; at the guard's discretion |
| Discharge | Admission → `discharged`; bed → `cleaning` |
| Transfer | Old bed → `cleaning`; new bed → `occupied` |
| Bed labels | `{WARD}-PR-NN` private room, `{WARD}-W-NN` ward, `{WARD}-C-NN` charity |
| Queue number | `{CLINIC_CODE}-{NNN}` per clinic per day |
| IDs | Patient `LUMC-NNNN`, visit `VYYMMDD-NNN`, admission `ADMYYMMDD-NNN`, vehicle `VEHYYMMDD-NNN` |

## Seeded bed layout (84 beds)

| Ward | Code | Private rooms (1 bed each) | Ward beds | Charity | Total |
| --- | --- | --- | --- | --- | --- |
| Medical Ward 1 | MW1 | 8 | 8 | – | 16 |
| Medical Ward 2 | MW2 | – | 6 | 6 | 12 |
| Pavilion | PAV | 13 | 4 | – | 17 |
| Pediatrics | PED | 5 | 5 | – | 10 |
| OB-Gyne | OB | 4 | 15 | – | 19 |
| ICU | ICU | – | 10 | – | 10 |

## Tables

### users
| Column | Notes |
| --- | --- |
| first_name / middle_name / last_name / name | Name parts + composed display name (capitalized on save) |
| login | Unique username used to sign in (not email) |
| contact_number | Required, exactly 11 digits |
| role | `administrator`, `security_guard`, `opd_staff` (OPD & Admission Staff), `department_secretary` (office secretary), `nursing_staff`, `doctor` |
| department_id | The office an office secretary belongs to; they only see/approve visits for it |
| status | `active` / `inactive` |

### departments
The official offices visitors can transact with; each has one secretary (`secretary_user_id` → `users.id`). Seeded:

| Code | Office |
| --- | --- |
| ADMIN | CEO Office / Administrative Office |
| PSU | Property & Supply |
| BUDGET | Budget Office |
| HR | Human Resource |
| ACCT | Accounting |
| MRD | Medical Records |
| MSS | Social Service |
| XRAY | X-ray Desk |
| NSO | Nursing Office |
| PHARM | Pharmacy |
| PHIC | PhilHealth |
| BILL | Billing |

### clinics
OPD clinics; `code` is used in queue numbers.

### rejection_reasons
Catalog for secretary rejection and gate turn-away. `applies_to`: `visitor_request` | `guard_gate` | `both`. `allows_custom_text` for "Other".

### doctors
Optional `user_id` link to a `doctor` login. `primary_clinic_id`, `status`, `is_on_duty`.

### guardians / guardianables
`guardianables` links a guardian to a `patient` or `visitor` (`guardianable_type` + `guardianable_id`). One guardian may accompany many minors.

### patients
Unique `patient_id` (`LUMC-NNNN`). Required: first/last name, birthday, sex, complete address. Optional: contact, civil status, nationality, religion, `philhealth_number`, spouse/father/mother names.

### opd_encounters
One hospital visit (OPD encounter + clinic queue ticket): patient + clinic + status (`registered` → `triaged` → `with_doctor` → `completed`). Screening is stored on the encounter; `seen_by_doctor_at` marks "seen by doctor".

### triage_records
One per encounter. Symptom checklist booleans + `notes`. Initial notes only, not a medical record.

### doctor_assignments
Doctor assigned during screening; `is_current` marks the active one.

### queues
Per clinic per day (`clinic_id` + `queue_date` + `queue_number` unique). Statuses: `waiting`, `called`, `serving`, `completed`, `skipped`, `cancelled`. `wait_seconds` = time from ticket to service.

### visitors
One row per visit.

| Column | Notes |
| --- | --- |
| pass_id | `VYYMMDD-NNN` |
| visit_type | `office` (office transaction) or `patient` (visiting an admitted patient) |
| department_id | Office visits: routes approval to that office's secretary. Null for patient visits |
| person_to_visit | Office visits: optional person to see. Patient visits: the patient's name |
| admission_id / patient_id / ward_id | Patient visits: the admission the guard confirmed |
| visit_location | Patient visits: ward · room · bed at the time of the visit (kept even if the patient is later transferred) |
| visit_date | Always the registration day |
| status | Office: `pending_approval` → `approved` → `inside` → `completed`. Patient: created as `approved` → `inside` → `completed`. Also `rejected`, `cancelled`, `expired` |
| reviewed_by / reviewed_at / review_remarks | Who approved: the office secretary, or the guard for patient visits |
| rejection_reason_id / rejection_notes | Secretary rejection or gate turn-away |
| qr_token | 48 hex chars, issued on approval; QR payload `VISIT-PASS:{qr_token}` |
| qr_expires_at | End of visit day |
| entry_scanned_at / exit_scanned_at | Set by guard scans |

### visitor_scan_events
Every gate scan: `scan_type` (`entry`/`exit`), `result` (`allowed`/`rejected`), optional reason, `scanned_by`.

### wards / beds
Bed `room_type`: `private`, `ward`, `charity`. Bed status: `available`, `occupied`, `reserved`, `cleaning`, `maintenance`, `unavailable`. `current_patient_id` is set while occupied; `reserved_for` is free text.

### admissions
`ADMYYMMDD-NNN`. Statuses: `waiting_for_bed`, `admitted`, `discharged`. `admitted_by`, `discharged_by`, `priority`, `reason` (administrative), `discharge_notes`. One active admission per patient.

### bed_events
Bed history with patient and performer. `event_type`: `assign`, `transfer_in`, `release` (discharge or transfer out), `reserve`, or a manual status (`available`, `cleaning`, `maintenance`, `unavailable`).

### parking_areas
Admin-editable lots (`name`, `code`, optional `capacity`, `is_active`).

### vehicles
`plate_number` (uppercased), `type`, `color`, `owner`, `owner_type` (`visitor`/`patient`/`other`), optional `visitor_id`/`patient_id`, `parking_area_id`, optional `slot_number`, `entry_time`, `exit_time`, `status` (`parked`/`exited`).

### notifications
Targeted by `user_id`, by `role`, or global (both null). `read_at` null = unread.

### audit_logs
Append-only: user, role, action, record label, status, details, timestamp.

### settings
`setting_key` → JSON value. Editable: `hospital_name`, `minor_age_threshold`, `backup_retention_days`.

## Relationships

```
departments.secretary_user_id → users
users.department_id → departments
doctors.user_id → users, doctors.primary_clinic_id → clinics
patients ← opd_encounters → clinics
opd_encounters → triage_records (1:1), doctor_assignments → doctors, queues
visitors → departments (office visits) | admissions, patients, wards (patient visits)
visitors → visitor_scan_events, vehicles
patients → admissions → beds → wards
beds → bed_events
parking_areas ← vehicles → visitors | patients
guardians → guardianables → patients | visitors
```
