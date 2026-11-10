# LUMC System — Tester Guide (Feature Freeze)

This guide prepares the team for **UAT (user acceptance testing)** before the **client demo**, then **pre-deployment hardening** (when the lead gives the go-ahead).

| Phase | Document |
| :---- | :---- |
| Setup \+ test cases (this file) | [`docs/TESTER_GUIDE.md`](http://TESTER_GUIDE.md) |
| Client demo script | [`docs/DEMO.md`](http://DEMO.md) |
| Hospital deployment | [`docs/DEPLOY.md`](http://DEPLOY.md) |

> **For the team member preparing the zip:** zip the project folder but **leave out** `node_modules\`, `backend\vendor\`, `backend\.env`, `.env`, `dist\` / `backend\public\spa\assets\` (optional — can rebuild), and `backend\storage\app\backups\`. Testers recreate dependencies in Part 1\.

---

# Part 1 — Setup on a fresh PC

## 1.1 What you need

| Software | Why | Download |
| :---- | :---- | :---- |
| **WampServer 3.3+** (64-bit) with **PHP 8.3** and **MySQL** | Database and PHP | [https\://wampserver.aviatechno.net/](https://wampserver.aviatechno.net/) |
| **Node.js LTS** (v20 or newer) | Frontend | [https\://nodejs.org/](https://nodejs.org/) |
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

1. Open [http\://localhost/phpmyadmin](http://localhost/phpmyadmin) (`root`, empty password).  
2. Create database `lumc`, collation `utf8mb4_unicode_ci`.

## 1.5 Set up the backend

```
cd C:\LUMC\backend
php ..\tools\composer.phar install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
```

Check `BACKUP_MYSQLDUMP_PATH` in `backend\.env` points at a real `mysqldump.exe` under `C:\wamp64\bin\mysql\...` (forward slashes, no quotes).

## 1.6 Set up the frontend

```
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
4. Open [**http\://localhost:5173**](http://localhost:5173)

Optional API smoke test (API must be running, DB freshly seeded):

```
powershell -ExecutionPolicy Bypass -File C:\LUMC\backend\scripts\smoke-test.ps1
```

## 1.8 Reset demo data

```
cd C:\LUMC\backend
php artisan migrate:fresh --seed
```

**Never** run this on a live hospital database.

## 1.9 Troubleshooting

| Problem | Fix |
| :---- | :---- |
| `php` not recognized | Redo 1.3; reopen PowerShell |
| DB connection refused | Start WAMP (green icon) |
| Unknown database `lumc` | Redo 1.4 |
| Network / login fails | Ensure `php artisan serve` is running |
| Port in use | Close other apps or reboot |
| Backup fails | Fix `BACKUP_MYSQLDUMP_PATH` |
| Camera / QR on phone | Prefer localhost \+ webcam; phones often need HTTPS |

---

# Part 2 — Acceptance test script

Mark each case **Pass / Fail / Blocked**. File bugs with the template in §2.15.

## 2.1 Demo accounts

Password for **all** demo accounts: **`12345678`**  
(Login page quick-fill buttons use the same password.)

| Role | Login | Notes |
| :---- | :---- | :---- |
| Administrator | `admin` | Full access to every role’s capabilities |
| Security Guard | `guard` | Visitors, QR, parking |
| OPD & Admission Staff | `opd` | Patients, hospital visits, queues, beds |
| Nursing Staff | `nurse` | Screening, view wards/queues; no admit/bed edits |
| Doctor (Internal Medicine) | `dr.reyes` | Clinic queues for **Internal Medicine** only (actions) |
| Doctor (Pediatrics) | `dr.santos` | Clinic queues for **Pediatrics** only (actions) |

**Office secretaries** (see only their office’s visitors):

| Office | Login |
| :---- | :---- |
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

**Tip:** use a normal window \+ Incognito for two roles at once.

## 2.2 How to record results

| Column | Meaning |
| :---- | :---- |
| Result | Pass / Fail / Blocked |
| Notes | Optional; required on Fail |

---

## 2.3 Login, identity, access & profile

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| A-01 | Log in with each demo account using **login** (not email) and password `12345678` | Each lands on its role home | pass |  |
| A-02 | Wrong password | Error; not logged in | pass |  |
| A-03 | Inspect left menu per role | Only allowed pages; no “Doctor Schedules” / “Doctor Queues” tabs | pass |  |
| A-04 | As nurse, open `/users` in the address bar | Redirected to home **and** on-screen notice: not allowed to take that action | pass |  |
| A-05 | As secretary, open `/patient-registration` | Same redirect \+ notice | pass |  |
| A-06 | Log out; use browser Back | Login page; protected content not shown | pass |  |
| A-07 | Open **Profile** (sidebar) as any user | Can edit first / middle / last name, contact number, login, password; **cannot** change role, office/clinic, or status | pass |  |
| A-08 | Profile: set contact to fewer/more than 11 digits or letters | Rejected — contact must be **exactly 11 numerical digits** | pass |  |
| A-09 | Header area | **No** global search; **no** avatar next to the notification bell (avatar remains lower-left) | pass |  |
| A-10 | Keep a page open; trigger a notification (e.g. secretary’s visitor pending, or hospital visit for nurse/doctor) | Bell updates within a few seconds without full page reload (**real-time polling**) | pass |  |

---

## 2.4 Names, contact numbers & capitalization

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| N-01 | Register visitor with names in lowercase (`juan`, `dela`, `cruz`) | After save, names are capitalized (e.g. Juan Dela Cruz) | pass |  |
| N-02 | Register patient with lowercase names | Same capitalization on save | pass | can have numbers on the name |
| N-03 | Admin → Users → add user with lowercase names | Capitalized after save | pass |  |
| N-04 | Visitor / patient / user: contact with letters, spaces, or not 11 digits | Blocked; must be **exactly 11 digits** | pass |  |
| N-05 | Patient Search: search by **middle name** only | Matching patients found | pass |  |

---

## 2.5 Visitors — office transactions (Guard \+ Secretary)

Visits are **same day only**. Minors as **visitors** do **not** need a guardian (secretary approval decides).

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| V-01 | Guard → Register Visitor → Office. Leave **first name** empty and submit | Required / blocked | pass |  |
| V-02 | Fill first, middle, last, age, address, 11-digit contact, office **Accounting**. Purpose: use **Other** \+ custom text. ID: use **Other** \+ custom ID type | Visit **Pending approval**; pass ID assigned | pass |  |
| V-03 | Accounting Secretary → Visitor Approvals → **click the waiting visitor** | Full **visitor information card** (not just a flat list row) | pass |  |
| V-04 | Billing Secretary → Approvals | Accounting visitor **not** listed | pass |  |
| V-05 | Accounting Secretary → Approve from the card | **Approved**; QR available for guard |  |  |
| V-06 | Guard → Give QR Pass / print or show QR | Pass shows office; scan works | pass |  |
| V-07 | Guard → Scan: entry then exit | Inside → Completed | pass |  |
| V-08 | Third scan | Refused — pass used | pass |  |
| V-09 | Register visitor age **15** (no guardian) | Allowed | pass |  |
| V-10 | Duplicate open visit (same person \+ office) | Blocked (409-style message) | pass |  |
| V-11 | Secretary rejects **with** a reason | Rejected; reason visible | pass  |  |
| V-12 | Secretary (or guard turn-away) rejects **without** selecting a reason | Allowed — reason optional | pass |  |
| V-13 | Today's Visitors / History → **Details** | Expanded visitor information | pass |  |
| V-14 | Guard Cancel on pending/approved | Cancelled; removed from active lists | pass |  |
| V-15 | Register with vehicle | Vehicle parked under Vehicles | pass |  |
| V-16 | Unknown QR | Not recognized | pass |  |
| V-17 | Secretary menu | Only visitor-related pages (no patients/queues/beds) | pass |  |

## 2.5b Visitors — patient visits (Guard)

Demo inpatients after seed: **Juan Dela Cruz**, **Miguel Lopez**, **Elena Garcia**.

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| PV-01 | Guard → Visit an admitted patient | List shows admitted patients with location | pass |  |
| PV-02 | Filter ward / room type / name | List filters correctly | pass |  |
| PV-03 | Approve & issue QR for Juan | Approved immediately; pass shows patient \+ ward/bed | pass |  |
| PV-04 | Entry \+ exit scans | Work as office visits | pass |  |
| PV-05 | Secretaries → Approvals / History | Patient visits **do not** appear | pass |  |
| PV-06 | After OPD discharges Juan, try new patient visit | Juan no longer listed | pass |  |

---

## 2.6 Patients, hospital visits & screening (OPD / Nurse / Doctor)

There is **no doctor assignment at registration**. Patients are queued to a **clinic**. **Initial screening** is done **during registration**. There is **no print patient** action. Labeling uses **Hospital Visits** (not OPD visits).

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| P-01 | OPD → Register & Queue → new patient (first/middle/last, birthday, sex, address, 11-digit contact) | LUMC ID assigned; names capitalized | Passed |  |
| P-02 | On Hospital Visit step: choose clinic (full name, e.g. **Nephrology**), reason, complete **Initial Screening**, submit | Ticket like `NEP-001`; **no doctor picker** on this form | Passed |  |
| P-03 | Today's Hospital Visits | Patient listed with clinic \+ screened \= Yes | Passed |  |
| P-04 | Open patient record → **Hospital Visits** | Visit listed; headers title-cased (**Patient Information**, **Current Admission**, **Hospital Visits**) | Passed |  |
| P-05 | **Click** a hospital visit row | Expands: reason, doctor (if any), screening symptoms, notes, duration, COVID flag | Passed |  |
| P-06 | Edit Patient Information → change address/contact → Save | Updates; appears in Audit Logs | Passed |  |
| P-07 | Register patient under 18 **without** guardian | Blocked | Passed |  |
| P-08 | Minor patient: guardian name \+ relationship dropdown (Mother/Father/Sibling/Guardian/…) \+ **Other** free text \+ 11-digit guardian contact | Accepted | Passed |  |
| P-09 | Queue same patient to same clinic again today | Blocked | Passed |  |
| P-10 | Nurse → Initial Screening → update checklist for a waiting patient | Updates allowed | Passed |  |
| P-11 | Patient Search by middle name / PhilHealth / LUMC ID | Found | Passed |  |
| P-12 | Patient record when admitted | Shows **Current Admission** badge/details \+ admissions history | Passed |  |
| P-13 | Look for “Print patient” / print registration | **Not present** | Passed |  |
| P-14 | Nurse/Doctor menus | No Register & Queue for them | Passed |  |

---

## 2.7 Clinic queues, public display & doctor availability

Queues are **per clinic**. Doctor queues / doctor schedules are **removed**. Call / Serve / Done / Skip use **confirmation**; **Undo** reverts one step without breaking live polling.

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| Q-01 | Open Queue Monitor / Clinic Queues | Grouped by **clinic** full names; no “Doctor Queues” / “Doctor Schedules” nav items | Passed |  |
| Q-02 | Call a waiting ticket | Confirmation modal; after confirm, status **Called**; list refreshes within a few seconds | Passed |  |
| Q-03 | Serve → Done | Confirm each step; statuses update | Passed |  |
| Q-04 | Undo once after Serve | Returns to previous step; further undos blocked for that ticket | Passed |  |
| Q-05 | As `dr.reyes` (Internal Medicine): try Call/Serve on a **Pediatrics** ticket | Shown as view-only / API refuses — cannot interact | Passed |  |
| Q-06 | As `dr.reyes`: Call/Serve on **Internal Medicine** ticket | Allowed | Passed |  |
| Q-07 | As `nurse` or `opd`: act on any clinic’s tickets | Allowed | Passed |  |
| Q-08 | Public Queue Display | Real clock (date \+ time); sections use **full clinic names**; **queue codes only** — **no patient names** | Passed |  |
| Q-09 | Public display: doctor line per clinic | e.g. `Diabetology: Dr. ___ — Available/Unavailable` | Passed |  |
| Q-10 | Change availability (see D-\*) while display stays open | Display updates within a few seconds | Passed |  |
| Q-11 | Leave Clinic Queues open while another user queues a patient | New ticket appears without manual refresh | Passed |  |

### Doctor availability

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| D-01 | Availability page | Lists doctors with clinic; **OPD cannot “create” a free-text doctor** | Passed |  |
| D-02 | Admin → Assign Doctor to Clinic | Pick existing **doctor user** \+ clinic; specialty **optional** | Passed |  |
| D-03 | As `dr.reyes`: change **own** status Available ↔ Unavailable | Works; public display reflects it | Passed |  |
| D-04 | As `dr.reyes`: change `dr.santos` status | Blocked | Passed |  |
| D-05 | As `opd`: change any doctor’s availability | Allowed | Passed |  |
| D-06 | As `nurse`: try to change availability | Not allowed (no control / 403\) | Passed |  |
| D-07 | All doctors in the list | Linked to system **users** (no orphan “non-user” doctors) | Passed |  |

---

## 2.8 Admissions and beds

Confirm \+ undo for assign / transfer / discharge. Patient info viewable throughout. Darker **Patient info** control.

Layout after seed: **84 beds**, 6 wards; 3 demo occupied.

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| B-01 | OPD → Bed Overview / Wards | 6 wards, 84 beds; hover on a bed is **obvious** (ring/scale/highlight) | Passed |  |
| B-02 | Admissions → Admit patient into a bed | Confirm if prompted; bed Occupied | Passed |  |
| B-03 | Click **Patient info** (darker button) on admission row | Modal with patient details \+ **Open Full Record** → full record (visits, admissions) | Passed |  |
| B-04 | Waiting for Bed → Patient info | Same modal \+ full record link | Passed |  |
| B-05 | Occupied bed / ward list → Patient info | Same for nurse, doctor, OPD | Passed |  |
| B-06 | Transfer bed | Confirmation; old bed Cleaning; Undo once works | Passed |  |
| B-07 | Discharge | Confirmation; Undo discharge once (where allowed) | Passed |  |
| B-08 | Nurse/Doctor | Can view beds/patients; **cannot** admit/transfer/discharge/change bed status | Passed |  |
| B-09 | Duplicate admit | Blocked | Passed |  |
| B-10 | Bed History | Events with actor and time | Passed |  |

---

## 2.9 Parking

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| K-01 | Guard → park vehicle (plate, area) | Parked; plate normalized | pass |  |
| K-02 | Same plate while parked | Blocked | pass |  |
| K-03 | Exit vehicle | Exited | pass |  |
| K-04 | Admin parking areas add/deactivate | Affects guard dropdown | Not tested |  |

---

## 2.10 Users & roles (Administrator)

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| U-01 | Users list | Logins shown **masked** (not plain text) | pass | Include search or filtering |
| U-02 | Add secretary → **Office** dropdown required | Works; clinic field not used | pass |  |
| U-03 | Add doctor → **Clinic** dropdown required; specialty optional | Doctor user \+ clinic assignment | pass |  |
| U-04 | Add nurse/guard/OPD | Office/clinic defaults to **none** | pass |  |
| U-05 | Create user without password | Default password **`12345678`** works | pass |  |
| U-06 | Password letters-only or numbers-only or \< 8 chars | Rejected; must be ≥8 with letters **and** numbers (symbols OK) | pass |  |
| U-07 | Edit user: change login or password **without** admin password | Rejected | pass |  |
| U-08 | Edit user: change login/password **with** current admin password | Succeeds | pass |  |
| U-09 | Deactivate user → login | Refused | Not tested |  |
| U-10 | As admin, open pages belonging to other roles (guard register, OPD register, etc.) | Accessible (admin has all capabilities) | pass |  |

---

## 2.11 Admin reports, audit, backups, settings

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| R-01 | Daily summary | Counts match today’s activity | passed |  |
| R-02 | PDF patients / visitors / audit | Open correctly | passed |  |
| R-03 | CSV exports (patients, hospital visits/opd, admissions, census, visitors, vehicles, audit) | Download; open in Sheets | passed |  |
| R-04 | Audit Logs | Patient edits, visits, bed moves, user changes listed | passed |  |
| R-05 | Guard → Security Logs | Visitor/vehicle focused | passed |  |
| R-06 | Backup now \+ download | `.sql.gz` file |  |  |
| R-07 | Settings → minor age 21; register age-19 patient without guardian | Blocked; restore to 18 after | passed |  |
| R-08 | Non-admin → Reports/Users/Backups/Settings | Not allowed \+ notice if URL forced | passed |  |

---

## 2.12 Real-time behavior (cross-cutting)

| ID | Steps | Expected result | Result | Remarks |
| :---- | :---- | :---- | :---- | :---- |
| RT-01 | Two browsers: OPD queues a patient; other role watches Clinic Queues / Public Display | New ticket appears within a few seconds | passed |  |
| RT-02 | Doctor toggles availability; public display open | Status updates without refresh | passed |  |
| RT-03 | Guard registers visitor for Accounting; secretary keeps Approvals open | Pending card appears / notification bell updates | passed |  |
| RT-04 | Bed assign on one screen; Wards open on another | Occupancy updates shortly | Passed |  |
| RT-05 | Public display clock | Shows **live** date and time | passed |  |

---

## 2.13 Freeze checklist (requirements coverage)

Use this as a final sweep; every item should already have a Pass above.

- [x] Clinic assignment only at registration (no doctor pick)  
- [x] Hospital Visits naming; expandable visit \+ screening  
- [x] Public display: full clinic names, codes only, live clock, doctor availability per clinic  
- [x] Confirm \+ undo on queues and beds  
- [x] Patient info from beds/admissions \+ link to full record  
- [x] Middle name searchable; F/M/L names; auto-capitalize; login not email; 11-digit contacts  
- [x] Minor guardians for **patients** only; relationship Other option  
- [x] Visitor F/M/L required; expandable card; optional reject reason  
- [x] No print patient; no doctor queues/schedules tabs  
- [x] Doctor clinic-scoped actions; OPD/nurse all clinics  
- [x] Doctor own availability; OPD can change all; nurse cannot  
- [x] Users: office vs clinic dropdowns; masked login; admin password to change secrets; default `12345678`  
- [x] Admin all capabilities; unauthorized page → redirect \+ notice  
- [x] No global search; notifications real-time; no header avatar  
- [x] All doctors are system users  
- [x] System keeps updating in real time (polling)

---

## 2.14 After testing

1. Collect Pass/Fail sheets and bug reports.  
2. Fix **Critical / Major** bugs only (feature freeze).  
3. Re-run failed cases \+ `smoke-test.ps1`.  
4. Run the **client demo** using [`docs/DEMO.md`](http://DEMO.md).  
5. When the lead says go: **pre-deployment hardening** in [`docs/DEPLOY.md`](http://DEPLOY.md) § Pre-deployment hardening.

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