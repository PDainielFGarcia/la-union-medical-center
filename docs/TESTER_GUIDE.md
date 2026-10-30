# LUMC System — Tester Guide (Feature Freeze)

This guide prepares the team for **UAT (user acceptance testing)** before the **client demo**, then **pre-deployment hardening** (when the lead gives the go-ahead).

| Phase | Document |
| --- | --- |
| Setup + test cases (this file) | [`docs/TESTER_GUIDE.md`](TESTER_GUIDE.md) |
| Client demo script | [`docs/DEMO.md`](DEMO.md) |
| Hospital deployment | [`docs/DEPLOY.md`](DEPLOY.md) |

> **For the team member preparing the zip:** zip the project folder but **leave out** `node_modules\`, `backend\vendor\`, `backend\.env`, `.env`, `dist\` / `backend\public\spa\assets\` (optional — can rebuild), and `backend\storage\app\backups\`. Testers recreate dependencies in Part 1.

---

# Part 1 — Setup on a fresh PC

## 1.1 What you need

| Software | Why | Download |
| --- | --- | --- |
| **WampServer 3.3+** (64-bit) with **PHP 8.3** and **MySQL** | Database and PHP | https://wampserver.aviatechno.net/ |
| **Node.js LTS** (v20 or newer) | Frontend | https://nodejs.org/ |
| The **project folder** | The system | From the team (zip) |

Composer is included as `tools\composer.phar`.

> XAMPP or Laragon also works if PHP is **8.3+** and MySQL/MariaDB is running.

## 1.2 Install

1. Install WampServer; tray icon must be **green**.
2. Install Node.js LTS.
3. Unzip to a simple path, e.g. `C:\LUMC`.

## 1.3 Make PHP available in the terminal

1. Note the PHP folder under `C:\wamp64\bin\php\` (e.g. `php8.3.14`).
2. Add that folder to your user **Path**.
3. Reopen PowerShell; run `php -v` → should show PHP 8.3+.

## 1.4 Create the database

1. Open http://localhost/phpmyadmin (`root`, empty password).
2. Create database `lumc`, collation `utf8mb4_unicode_ci`.

## 1.5 Set up the backend

```powershell
cd C:\LUMC\backend
php ..\tools\composer.phar install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
```

Check `BACKUP_MYSQLDUMP_PATH` in `backend\.env` points at a real `mysqldump.exe` under `C:\wamp64\bin\mysql\...` (forward slashes, no quotes).

## 1.6 Set up the frontend

```powershell
cd C:\LUMC
npm install
copy .env.example .env
```

Ensure `.env` has:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK=false
```

## 1.7 Start the system (every test session)

1. WAMP icon **green**.
2. Terminal 1: `cd C:\LUMC\backend` → `php artisan serve`
3. Terminal 2: `cd C:\LUMC` → `npm run dev`
4. Open **http://localhost:5173**

Optional API smoke test (API must be running, DB freshly seeded):

```powershell
powershell -ExecutionPolicy Bypass -File C:\LUMC\backend\scripts\smoke-test.ps1
```

## 1.8 Reset demo data

```powershell
cd C:\LUMC\backend
php artisan migrate:fresh --seed
```

**Never** run this on a live hospital database.

## 1.9 Troubleshooting

| Problem | Fix |
| --- | --- |
| `php` not recognized | Redo 1.3; reopen PowerShell |
| DB connection refused | Start WAMP (green icon) |
| Unknown database `lumc` | Redo 1.4 |
| Network / login fails | Ensure `php artisan serve` is running |
| Port in use | Close other apps or reboot |
| Backup fails | Fix `BACKUP_MYSQLDUMP_PATH` |
| Camera / QR on phone | Prefer localhost + webcam; phones often need HTTPS |

---

# Part 2 — Acceptance test script

Mark each case **Pass / Fail / Blocked**. File bugs with the template in §2.15.

## 2.1 Demo accounts

Password for **all** demo accounts: **`12345678`**  
(Login page quick-fill buttons use the same password.)

| Role | Login | Notes |
| --- | --- | --- |
| Administrator | `admin` | Full access to every role’s capabilities |
| Security Guard | `guard` | Visitors, QR, parking |
| OPD & Admission Staff | `opd` | Patients, hospital visits, queues, beds |
| Nursing Staff | `nurse` | Screening, view wards/queues; no admit/bed edits |
| Doctor (Internal Medicine) | `dr.reyes` | Clinic queues for **Internal Medicine** only (actions) |
| Doctor (Pediatrics) | `dr.santos` | Clinic queues for **Pediatrics** only (actions) |

**Office secretaries** (see only their office’s visitors):

| Office | Login |
| --- | --- |
| CEO / Administrative | `secretary.admin` |
| Property & Supply | `secretary.property` |
| Budget | `secretary.budget` |
| Human Resource | `secretary.hr` |
| Accounting | `secretary.accounting` |
| Medical Records | `secretary.records` |
| Social Service | `secretary.social` |
| X-ray Desk | `secretary.xray` |
| Nursing Office | `secretary.nursing` |
| Pharmacy | `secretary.pharmacy` |
| PhilHealth | `secretary.philhealth` |
| Billing | `secretary.billing` |

**Tip:** use a normal window + Incognito for two roles at once.

## 2.2 How to record results

| Column | Meaning |
| --- | --- |
| Result | Pass / Fail / Blocked |
| Notes | Optional; required on Fail |

---

## 2.3 Login, identity, access & profile

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| A-01 | Log in with each demo account using **login** (not email) and password `12345678` | Each lands on its role home | |
| A-02 | Wrong password | Error; not logged in | |
| A-03 | Inspect left menu per role | Only allowed pages; no “Doctor Schedules” / “Doctor Queues” tabs | |
| A-04 | As nurse, open `/users` in the address bar | Redirected to home **and** on-screen notice: not allowed to take that action | |
| A-05 | As secretary, open `/patient-registration` | Same redirect + notice | |
| A-06 | Log out; use browser Back | Login page; protected content not shown | |
| A-07 | Open **Profile** (sidebar) as any user | Can edit first / middle / last name, contact number, login, password; **cannot** change role, office/clinic, or status | |
| A-08 | Profile: set contact to fewer/more than 11 digits or letters | Rejected — contact must be **exactly 11 numerical digits** | |
| A-09 | Header area | **No** global search; **no** avatar next to the notification bell (avatar remains lower-left) | |
| A-10 | Keep a page open; trigger a notification (e.g. secretary’s visitor pending, or hospital visit for nurse/doctor) | Bell updates within a few seconds without full page reload (**real-time polling**) | |

---

## 2.4 Names, contact numbers & capitalization

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| N-01 | Register visitor with names in lowercase (`juan`, `dela`, `cruz`) | After save, names are capitalized (e.g. Juan Dela Cruz) | |
| N-02 | Register patient with lowercase names | Same capitalization on save | |
| N-03 | Admin → Users → add user with lowercase names | Capitalized after save | |
| N-04 | Visitor / patient / user: contact with letters, spaces, or not 11 digits | Blocked; must be **exactly 11 digits** | |
| N-05 | Patient Search: search by **middle name** only | Matching patients found | |

---

## 2.5 Visitors — office transactions (Guard + Secretary)

Visits are **same day only**. Minors as **visitors** do **not** need a guardian (secretary approval decides).

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| V-01 | Guard → Register Visitor → Office. Leave **first name** empty and submit | Required / blocked | |
| V-02 | Fill first, middle, last, age, address, 11-digit contact, office **Accounting**. Purpose: use **Other** + custom text. ID: use **Other** + custom ID type | Visit **Pending approval**; pass ID assigned | |
| V-03 | Accounting Secretary → Visitor Approvals → **click the waiting visitor** | Full **visitor information card** (not just a flat list row) | |
| V-04 | Billing Secretary → Approvals | Accounting visitor **not** listed | |
| V-05 | Accounting Secretary → Approve from the card | **Approved**; QR available for guard | |
| V-06 | Guard → Give QR Pass / print or show QR | Pass shows office; scan works | |
| V-07 | Guard → Scan: entry then exit | Inside → Completed | |
| V-08 | Third scan | Refused — pass used | |
| V-09 | Register visitor age **15** (no guardian) | Allowed | |
| V-10 | Duplicate open visit (same person + office) | Blocked (409-style message) | |
| V-11 | Secretary rejects **with** a reason | Rejected; reason visible | |
| V-12 | Secretary (or guard turn-away) rejects **without** selecting a reason | Allowed — reason optional | |
| V-13 | Today's Visitors / History → **Details** | Expanded visitor information | |
| V-14 | Guard Cancel on pending/approved | Cancelled; removed from active lists | |
| V-15 | Register with vehicle | Vehicle parked under Vehicles | |
| V-16 | Unknown QR | Not recognized | |
| V-17 | Secretary menu | Only visitor-related pages (no patients/queues/beds) | |

## 2.5b Visitors — patient visits (Guard)

Demo inpatients after seed: **Juan Dela Cruz**, **Miguel Lopez**, **Elena Garcia**.

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| PV-01 | Guard → Visit an admitted patient | List shows admitted patients with location | |
| PV-02 | Filter ward / room type / name | List filters correctly | |
| PV-03 | Approve & issue QR for Juan | Approved immediately; pass shows patient + ward/bed | |
| PV-04 | Entry + exit scans | Work as office visits | |
| PV-05 | Secretaries → Approvals / History | Patient visits **do not** appear | |
| PV-06 | After OPD discharges Juan, try new patient visit | Juan no longer listed | |

---

## 2.6 Patients, hospital visits & screening (OPD / Nurse / Doctor)

There is **no doctor assignment at registration**. Patients are queued to a **clinic**. **Initial screening** is done **during registration**. There is **no print patient** action. Labeling uses **Hospital Visits** (not OPD visits).

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| P-01 | OPD → Register & Queue → new patient (first/middle/last, birthday, sex, address, 11-digit contact) | LUMC ID assigned; names capitalized | |
| P-02 | On Hospital Visit step: choose clinic (full name, e.g. **Nephrology**), reason, complete **Initial Screening**, submit | Ticket like `NEP-001`; **no doctor picker** on this form | |
| P-03 | Today's Hospital Visits | Patient listed with clinic + screened = Yes | |
| P-04 | Open patient record → **Hospital Visits** | Visit listed; headers title-cased (**Patient Information**, **Current Admission**, **Hospital Visits**) | |
| P-05 | **Click** a hospital visit row | Expands: reason, doctor (if any), screening symptoms, notes, duration, COVID flag | |
| P-06 | Edit Patient Information → change address/contact → Save | Updates; appears in Audit Logs | |
| P-07 | Register patient under 18 **without** guardian | Blocked | |
| P-08 | Minor patient: guardian name + relationship dropdown (Mother/Father/Sibling/Guardian/…) + **Other** free text + 11-digit guardian contact | Accepted | |
| P-09 | Queue same patient to same clinic again today | Blocked | |
| P-10 | Nurse → Initial Screening → update checklist for a waiting patient | Updates allowed | |
| P-11 | Patient Search by middle name / PhilHealth / LUMC ID | Found | |
| P-12 | Patient record when admitted | Shows **Current Admission** badge/details + admissions history | |
| P-13 | Look for “Print patient” / print registration | **Not present** | |
| P-14 | Nurse/Doctor menus | No Register & Queue for them | |

---

## 2.7 Clinic queues, public display & doctor availability

Queues are **per clinic**. Doctor queues / doctor schedules are **removed**. Call / Serve / Done / Skip use **confirmation**; **Undo** reverts one step without breaking live polling.

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Q-01 | Open Queue Monitor / Clinic Queues | Grouped by **clinic** full names; no “Doctor Queues” / “Doctor Schedules” nav items | |
| Q-02 | Call a waiting ticket | Confirmation modal; after confirm, status **Called**; list refreshes within a few seconds | |
| Q-03 | Serve → Done | Confirm each step; statuses update | |
| Q-04 | Undo once after Serve | Returns to previous step; further undos blocked for that ticket | |
| Q-05 | As `dr.reyes` (Internal Medicine): try Call/Serve on a **Pediatrics** ticket | Shown as view-only / API refuses — cannot interact | |
| Q-06 | As `dr.reyes`: Call/Serve on **Internal Medicine** ticket | Allowed | |
| Q-07 | As `nurse` or `opd`: act on any clinic’s tickets | Allowed | |
| Q-08 | Public Queue Display | Real clock (date + time); sections use **full clinic names**; **queue codes only** — **no patient names** | |
| Q-09 | Public display: doctor line per clinic | e.g. `Diabetology: Dr. ___ — Available/Unavailable` | |
| Q-10 | Change availability (see D-*) while display stays open | Display updates within a few seconds | |
| Q-11 | Leave Clinic Queues open while another user queues a patient | New ticket appears without manual refresh | |

### Doctor availability

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| D-01 | Availability page | Lists doctors with clinic; **OPD cannot “create” a free-text doctor** | |
| D-02 | Admin → Assign Doctor to Clinic | Pick existing **doctor user** + clinic; specialty **optional** | |
| D-03 | As `dr.reyes`: change **own** status Available ↔ Unavailable | Works; public display reflects it | |
| D-04 | As `dr.reyes`: change `dr.santos` status | Blocked | |
| D-05 | As `opd`: change any doctor’s availability | Allowed | |
| D-06 | As `nurse`: try to change availability | Not allowed (no control / 403) | |
| D-07 | All doctors in the list | Linked to system **users** (no orphan “non-user” doctors) | |

---

## 2.8 Admissions and beds

Confirm + undo for assign / transfer / discharge. Patient info viewable throughout. Darker **Patient info** control.

Layout after seed: **84 beds**, 6 wards; 3 demo occupied.

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| B-01 | OPD → Bed Overview / Wards | 6 wards, 84 beds; hover on a bed is **obvious** (ring/scale/highlight) | |
| B-02 | Admissions → Admit patient into a bed | Confirm if prompted; bed Occupied | |
| B-03 | Click **Patient info** (darker button) on admission row | Modal with patient details + **Open Full Record** → full record (visits, admissions) | |
| B-04 | Waiting for Bed → Patient info | Same modal + full record link | |
| B-05 | Occupied bed / ward list → Patient info | Same for nurse, doctor, OPD | |
| B-06 | Transfer bed | Confirmation; old bed Cleaning; Undo once works | |
| B-07 | Discharge | Confirmation; Undo discharge once (where allowed) | |
| B-08 | Nurse/Doctor | Can view beds/patients; **cannot** admit/transfer/discharge/change bed status | |
| B-09 | Duplicate admit | Blocked | |
| B-10 | Bed History | Events with actor and time | |

---

## 2.9 Parking

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| K-01 | Guard → park vehicle (plate, area) | Parked; plate normalized | |
| K-02 | Same plate while parked | Blocked | |
| K-03 | Exit vehicle | Exited | |
| K-04 | Admin parking areas add/deactivate | Affects guard dropdown | |

---

## 2.10 Users & roles (Administrator)

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| U-01 | Users list | Logins shown **masked** (not plain text) | |
| U-02 | Add secretary → **Office** dropdown required | Works; clinic field not used | |
| U-03 | Add doctor → **Clinic** dropdown required; specialty optional | Doctor user + clinic assignment | |
| U-04 | Add nurse/guard/OPD | Office/clinic defaults to **none** | |
| U-05 | Create user without password | Default password **`12345678`** works | |
| U-06 | Password letters-only or numbers-only or &lt; 8 chars | Rejected; must be ≥8 with letters **and** numbers (symbols OK) | |
| U-07 | Edit user: change login or password **without** admin password | Rejected | |
| U-08 | Edit user: change login/password **with** current admin password | Succeeds | |
| U-09 | Deactivate user → login | Refused | |
| U-10 | As admin, open pages belonging to other roles (guard register, OPD register, etc.) | Accessible (admin has all capabilities) | |

---

## 2.11 Admin reports, audit, backups, settings

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| R-01 | Daily summary | Counts match today’s activity | |
| R-02 | PDF patients / visitors / audit | Open correctly | |
| R-03 | CSV exports (patients, hospital visits/opd, admissions, census, visitors, vehicles, audit) | Download; open in Sheets | |
| R-04 | Audit Logs | Patient edits, visits, bed moves, user changes listed | |
| R-05 | Guard → Security Logs | Visitor/vehicle focused | |
| R-06 | Backup now + download | `.sql.gz` file | |
| R-07 | Settings → minor age 21; register age-19 patient without guardian | Blocked; restore to 18 after | |
| R-08 | Non-admin → Reports/Users/Backups/Settings | Not allowed + notice if URL forced | |

---

## 2.12 Real-time behavior (cross-cutting)

| ID | Steps | Expected result | Result |
| --- | --- | --- | --- |
| RT-01 | Two browsers: OPD queues a patient; other role watches Clinic Queues / Public Display | New ticket appears within a few seconds | |
| RT-02 | Doctor toggles availability; public display open | Status updates without refresh | |
| RT-03 | Guard registers visitor for Accounting; secretary keeps Approvals open | Pending card appears / notification bell updates | |
| RT-04 | Bed assign on one screen; Wards open on another | Occupancy updates shortly | |
| RT-05 | Public display clock | Shows **live** date and time | |

---

## 2.13 Freeze checklist (requirements coverage)

Use this as a final sweep; every item should already have a Pass above.

- [ ] Clinic assignment only at registration (no doctor pick)
- [ ] Hospital Visits naming; expandable visit + screening
- [ ] Public display: full clinic names, codes only, live clock, doctor availability per clinic
- [ ] Confirm + undo on queues and beds
- [ ] Patient info from beds/admissions + link to full record
- [ ] Middle name searchable; F/M/L names; auto-capitalize; login not email; 11-digit contacts
- [ ] Minor guardians for **patients** only; relationship Other option
- [ ] Visitor F/M/L required; expandable card; optional reject reason
- [ ] No print patient; no doctor queues/schedules tabs
- [ ] Doctor clinic-scoped actions; OPD/nurse all clinics
- [ ] Doctor own availability; OPD can change all; nurse cannot
- [ ] Users: office vs clinic dropdowns; masked login; admin password to change secrets; default `12345678`
- [ ] Admin all capabilities; unauthorized page → redirect + notice
- [ ] No global search; notifications real-time; no header avatar
- [ ] All doctors are system users
- [ ] System keeps updating in real time (polling)

---

## 2.14 After testing

1. Collect Pass/Fail sheets and bug reports.
2. Fix **Critical / Major** bugs only (feature freeze).
3. Re-run failed cases + `smoke-test.ps1`.
4. Run the **client demo** using [`docs/DEMO.md`](DEMO.md).
5. When the lead says go: **pre-deployment hardening** in [`docs/DEPLOY.md`](DEPLOY.md) § Pre-deployment hardening.

---

## 2.15 Bug report template

```
Bug ID:        (e.g. BUG-001)
Test ID:       (e.g. Q-05)
Tester:
Date/time:
Logged in as:  (login)
Page / URL:
Steps to reproduce:
  1.
  2.
  3.
Expected:
Actual:
Screenshot:    (attach)
Severity:      Critical / Major / Minor / Suggestion
```

Extras: F12 → Console (red errors); note `php artisan serve` output.
