# La Union Medical Center (LUMC) — User Manual

**Administrative hospital system** for same-day visitors, hospital visits & clinic queues, admissions & beds, parking, and administration.  
This is **not** a clinical electronic medical record (no diagnoses, prescriptions, or iHOMIS).

| Related docs | Purpose |
| --- | --- |
| This manual | Day-to-day staff use |
| [`TESTER_GUIDE.md`](TESTER_GUIDE.md) | Acceptance testing |
| [`DEMO.md`](DEMO.md) | Client demonstration script |
| [`DEPLOY.md`](DEPLOY.md) | Hospital installation |

---

## How to use this document (for the documentation team)

- Place screenshot files in **`docs/manual-screenshots/`** using the filenames in each **Screenshot** block.
- Full capture checklist: [`manual-screenshots/README.md`](manual-screenshots/README.md).
- Until a file exists, Markdown preview will show a broken image — that is expected.

**Screenshot block format used below:**

> **Screenshot `NN-name.png`** — short note on what to capture.

Then the image is embedded as:

```markdown
![Short description](manual-screenshots/NN-name.png)
```

---

## Table of contents

1. [Getting started](#1-getting-started)
2. [Common features (all roles)](#2-common-features-all-roles)
3. [Security Guard](#3-security-guard)
4. [Office Secretary](#4-office-secretary)
5. [OPD & Admission Staff](#5-opd--admission-staff)
6. [Nursing Staff](#6-nursing-staff)
7. [Doctor](#7-doctor)
8. [Administrator](#8-administrator)
9. [Quick reference — who can do what](#9-quick-reference--who-can-do-what)
10. [Tips & rules](#10-tips--rules)

---

## 1. Getting started

### 1.1 Sign in

1. Open the LUMC website (hospital URL or `http://127.0.0.1:5173` for local testing).
2. Enter your **login** (not an email) and password.
3. Click **Sign in**.

> **Screenshot `01-login.png`** — Full login page with branding and sign-in form.

![Login page](manual-screenshots/01-login.png)

### 1.2 After login

- You land on a **home page** that depends on your role (e.g. Guard Dashboard, Visitor Approvals, or Dashboard).
- The **left sidebar** only shows pages your role is allowed to use.
- Opening a forbidden page redirects you home and shows a notice that you are not allowed.

> **Screenshot `02-sidebar-guard.png`** — Guard session with Visitors menu items visible.

![Guard sidebar](manual-screenshots/02-sidebar-guard.png)

> **Screenshot `05-access-denied.png`** — Yellow/amber banner: not allowed to take that action.

![Access denied notice](manual-screenshots/05-access-denied.png)

### 1.3 Sign out

Use **Logout** in the lower-left sidebar (near your name/avatar).

---

## 2. Common features (all roles)

Every account can use **My Profile**, **notifications**, and **Logout**. Everything else depends on **role** — see each chapter’s **What you can do** / **What you cannot do**, and the [quick reference table](#9-quick-reference--who-can-do-what).

### 2.1 My Profile

**Sidebar → My Profile**

You may update:

- First name, middle name (optional), last name  
- Contact number (optional; if filled, must be **exactly 11 digits**)  
- Login and password  

You **cannot** change role, office, clinic, or account status here.

> **Screenshot `03-profile.png`** — Profile form with name, login, contact fields.

![My Profile](manual-screenshots/03-profile.png)

### 2.2 Notifications

- The **bell** in the top bar shows unread count.
- The list refreshes every few seconds.
- **Click a notification** to:
  1. Mark it as read (count decreases), and  
  2. Open the related page (e.g. Visitor Approvals, Clinic Queues, Waiting for Bed).
- **Mark all read** clears the unread badge.

> **Screenshot `04-notifications.png`** — Bell dropdown open with unread items and “Open related page”.

![Notifications](manual-screenshots/04-notifications.png)

---

## 3. Security Guard

**Typical login:** `guard`  
**Home:** Guard Dashboard / Security

### 3.1 What you can do

- Use **Front Desk Routing** to send people to the right desk
- Register same-day visitors (office **or** admitted patient)
- **Approve patient visitors** yourself (patient must already be in a bed)
- Issue and scan QR passes (entry / exit); turn away, cancel, or manual entry/exit on **Today's Visitors**
- Record vehicles (visitor / patient / **employee** / other) and mark exit
- View **Security Logs** (visitor/vehicle-related)

### 3.2 What you cannot do

- Approve or reject **office** visitors (that is the office secretary’s job)
- See or manage patients, hospital visits, clinic queues, doctors, or beds
- Open administration pages (users, reports, backups, settings, parking areas setup)
- Change your own role or another user’s account

### 3.3 Register an office visitor

1. **Visitors → Register Visitor**.
2. Choose **Office transaction**.
3. Enter **First name** and **Last name** (required). Middle name and contact are optional.
4. If you enter a contact number, use **exactly 11 digits**.
5. Choose the **office**, purpose (or Other + text), ID type if needed.
6. Optionally add a vehicle.
7. Submit → status becomes **Pending approval** for that office’s secretary.

> **Screenshot `06-register-visitor-office.png`** — Office visitor form with office dropdown.

![Register office visitor](manual-screenshots/06-register-visitor-office.png)

### 3.4 Register a patient visitor

1. Choose **Visit an admitted patient**.
2. Filter by ward / room type / name and select the patient.
3. Fill visitor details → **Approve Visit & Issue QR** (guard approves immediately).
4. Secretaries do **not** see patient visits.

> **Screenshot `07-register-visitor-patient.png`** — Admitted patient picker with location.

![Register patient visitor](manual-screenshots/07-register-visitor-patient.png)

### 3.5 QR pass and scanning

1. After approval (office) or immediate approve (patient), open **Give QR Pass** / Visitor Pass.
2. Print or show the QR to the visitor.
3. **Scan QR Pass** — scan on entry, then again on exit.
4. A third scan is refused (pass already used).

> **Screenshot `10-visitor-qr-pass.png`** — Pass with QR code and pass ID.

![Visitor QR pass](manual-screenshots/10-visitor-qr-pass.png)

> **Screenshot `11-scan-qr.png`** — Scanner page.

![Scan QR](manual-screenshots/11-scan-qr.png)

### 3.6 Today’s Visitors

**Visitors → Today's Visitors**

- See waiting, approved, inside, and exited counts.
- Open **Details** for the full visitor card.
- **Turn Away** (rejection reason optional), **Cancel**, or manual entry/exit when needed.

> **Screenshot `12-todays-visitors.png`** — Table with statuses and action buttons.

![Today's Visitors](manual-screenshots/12-todays-visitors.png)

### 3.7 Vehicles

**Parking → Vehicles → Record Vehicle**

- Belongs to: **Visitor**, **Patient**, **Employee**, or **Other**.
- Plate + parking area required.

> **Screenshot `31-vehicles.png`** — Record Vehicle modal including Employee option.

![Vehicles](manual-screenshots/31-vehicles.png)

---

## 4. Office Secretary

**Typical logins:** `secretary.accounting`, `secretary.billing`, …  
**Home:** Visitor Approvals  

### 4.1 What you can do

- See and act on **office visitors for your office only** (the office linked to your user account)
- **Approve & issue QR** or **Reject** (rejection reason optional)
- Open the full visitor card before deciding
- Browse **Visitor History** for your office’s past visits

### 4.2 What you cannot do

- Approve visitors for **other offices**
- See or approve **patient visitors** (guards handle those)
- Register visitors, scan QR, or manage today’s gate list
- Work with patients, queues, doctors, beds, vehicles, or admin tools

### 4.3 Approve or reject a visitor

1. Open **Visitor Approvals**.
2. Click a pending visitor card to open the **full visitor information** (not just a short list row).
3. **Approve & issue QR** — guard can then print/show the pass.  
   **Reject** — reason is **optional**.

> **Screenshot `08-visitor-approvals-list.png`** — Pending visitors waiting for approval.

![Visitor Approvals list](manual-screenshots/08-visitor-approvals-list.png)

> **Screenshot `09-visitor-card.png`** — Full visitor details with Approve / Reject.

![Visitor information card](manual-screenshots/09-visitor-card.png)

### 4.4 History

**Visitor History** — search/filter past office visits. Use **Details** to expand information.

---

## 5. OPD & Admission Staff

**Typical login:** `opd`  
**Home:** Dashboard  
**Note:** This one role covers both OPD registration and admissions.

### 5.1 What you can do

- **Front Desk Routing**; register patients and **hospital visits** (queued to a **clinic**, not a named doctor)
- Capture **initial screening at registration**; edit patient information (audited)
- **Today's Hospital Visits**, Patient Search / Records, Queue Monitor, **Clinic Queues**, Queue History
- Queue actions on **all clinics**: Call / Serve / Done / Skip / Undo / Cancel
- Open **Public Queue Display**
- Admit / assign bed / transfer / discharge; change bed status; Waiting for Bed; Bed History
- Doctor List; set **any** doctor’s availability; **assign or reassign** doctors to clinics
- Record vehicles (same as guard)

### 5.2 What you cannot do

- Create doctor **user accounts** (admin does that under Users & Roles — you only assign existing doctor users to clinics)
- Approve office or patient visitors, or use guard QR tools
- Open administration: Users, Reports, Audit Logs, Backups, Parking Areas setup, Settings
- Change another staff member’s role or password without being an administrator

### 5.3 Register a patient and hospital visit

1. **Patients & Visits → Register & Queue**.
2. Search for an existing patient, or register a new one (first & last name required; middle name and contact optional).
3. **Minors** need a guardian (relationship dropdown + Other, 11-digit guardian contact).
4. On **Hospital Visit**:
   - Select **clinic** (full name, e.g. Nephrology).
   - Complete **Initial Screening**.
   - Optionally record a vehicle.
5. Submit → note the **queue number** (e.g. `MED-001`). There is no “print patient” step.

> **Screenshot `13-register-patient.png`** — New patient form.

![Register patient](manual-screenshots/13-register-patient.png)

> **Screenshot `14-hospital-visit-screening.png`** — Clinic + screening checklist.

![Hospital visit screening](manual-screenshots/14-hospital-visit-screening.png)

> **Screenshot `15-queue-ticket-done.png`** — Large queue number confirmation.

![Queue number](manual-screenshots/15-queue-ticket-done.png)

### 5.4 Today’s Hospital Visits & patient records

- **Today's Hospital Visits** — who arrived today, clinic, screened yes/no, status.
- **Patient Records / Search** — open a patient to see:
  - **Current Admission** (if any)
  - **Patient Information** (editable)
  - **Hospital Visits** — click a row to expand screening and visit details
  - **Admissions History**

> **Screenshot `16-todays-hospital-visits.png`** — Today's list with SCREENED column.

![Today's Hospital Visits](manual-screenshots/16-todays-hospital-visits.png)

> **Screenshot `17-patient-record.png`** — Patient Information + admission badge.

![Patient record](manual-screenshots/17-patient-record.png)

> **Screenshot `18-hospital-visit-expanded.png`** — Expanded visit with screening results.

![Expanded hospital visit](manual-screenshots/18-hospital-visit-expanded.png)

> **Screenshot `19-patient-edit.png`** — Edit Patient Information modal.

![Edit patient](manual-screenshots/19-patient-edit.png)

### 5.5 Clinic queues

**Queue → Clinic Queues** or **Queue Monitor**

1. Find the patient under their **clinic**.
2. **Call → Serve → Done** (each step asks for confirmation).
3. **Undo** reverts one step (once per ticket), without stopping live updates.
4. You may act on **all clinics**.

> **Screenshot `21-clinic-queues.png`** — Clinic section with tickets and actions.

![Clinic Queues](manual-screenshots/21-clinic-queues.png)

> **Screenshot `22-queue-confirm.png`** — Confirmation dialog before Call/Serve.

![Queue confirmation](manual-screenshots/22-queue-confirm.png)

### 5.6 Public Queue Display

**Queue → Public Queue Display** (often on a TV)

- Live date and time  
- Full clinic names (e.g. Nephrology)  
- **Queue codes only** — no patient names  
- Doctor availability per clinic  

> **Screenshot `24-public-display.png`** — Dark display board with codes and doctor status.

![Public Queue Display](manual-screenshots/24-public-display.png)

### 5.7 Doctor availability

**Doctors → Availability**

- Toggle Available / Unavailable for **any** doctor.
- **Assign Doctor to Clinic** — link an unassigned doctor account to a clinic, or **reassign** one who already has a clinic (specialty optional). Doctor accounts are created under Users & Roles (admin); you do not create free-text doctors here.

> **Screenshot `25-doctor-availability.png`** — Availability toggles and Assign Doctor to Clinic.

![Doctor Availability](manual-screenshots/25-doctor-availability.png)

> **Screenshot `25b-assign-doctor-clinic.png`** — Assign modal: doctor account + clinic selected.

![Assign Doctor to Clinic](manual-screenshots/25b-assign-doctor-clinic.png)

### 5.8 Admissions and beds

1. **Admissions → Admit Patient** (choose bed now or leave waiting).
2. Confirm assign / transfer / discharge; use **Undo** once when available.
3. Dark **Patient info** button opens a modal; **Open Full Record** goes to the full patient page.
4. Hover a bed on **Bed Overview** — highlight should be obvious.
5. Nurses/doctors can view; only OPD/admin change beds.

> **Screenshot `26-bed-overview.png`** — Beds with one clearly hovered/selected.

![Bed Overview](manual-screenshots/26-bed-overview.png)

> **Screenshot `27-admissions.png`** — Admissions list with dark Patient info button.

![Admissions](manual-screenshots/27-admissions.png)

> **Screenshot `28-patient-info-modal.png`** — Modal with Open Full Record.

![Patient info modal](manual-screenshots/28-patient-info-modal.png)

> **Screenshot `29-waiting-for-bed.png`** — Waiting for Bed list.

![Waiting for Bed](manual-screenshots/29-waiting-for-bed.png)

> **Screenshot `30-admit-confirm.png`** — Confirm transfer or discharge.

![Confirm bed action](manual-screenshots/30-admit-confirm.png)

---

## 6. Nursing Staff

**Typical login:** `nurse`

### 6.1 What you can do

- **Initial Screening** page — Screen / Update symptom checklist for waiting patients  
- View **Today's Hospital Visits**, Patient Search & Records  
- **Clinic Queues / Queue Monitor** — Call / Serve / Done / Skip / Undo on **all clinics**  
- View wards, bed overview, admissions, waiting for bed, bed history (**view only**)

### 6.2 What you cannot do

- Register new patients or create hospital visits  
- Cancel queue tickets (OPD does that)  
- Admit, transfer, discharge, or change bed status  
- Change any doctor’s availability or assign doctors to clinics  
- Use visitor, vehicle, public display, or administration pages  

> **Screenshot `20-screening-nurse.png`** — Initial Screening table with Screen / Update.

![Initial Screening](manual-screenshots/20-screening-nurse.png)

---

## 7. Doctor

**Typical logins:** `dr.reyes` (Internal Medicine), `dr.santos` (Pediatrics), …  
Your account must be **assigned to a clinic** (by OPD or admin) before you can act on queue tickets.

### 7.1 What you can do

- View **all** clinic queues and the doctor directory  
- Call / Serve / Done / Skip / Undo **only in your assigned clinic**  
- Change **only your own** Available / Unavailable status  
- View patient search/records, wards, beds, admissions (**view only**)

### 7.2 What you cannot do

- Act on tickets in **other** clinics (UI shows **View only**; API also blocks it)  
- Change another doctor’s availability or reassign clinics  
- Register patients, edit patient demographics, or run screening  
- Admit / transfer / discharge or change beds  
- Open public display, vehicles, visitors, or administration  

> **Screenshot `23-queue-view-only.png`** — Other clinic ticket with “View only”.

![Doctor view only](manual-screenshots/23-queue-view-only.png)

(Also use screenshots `21`, `22`, and `25` when documenting your own clinic and availability.)

---

## 8. Administrator

**Typical login:** `admin`  

### 8.1 What you can do

- **Everything** every other role can do (sidebar shows all modules)
- **Users & Roles** — create/edit users; secretary must have an **office**; doctor must have a **clinic**; logins stay masked; changing login/password needs the **admin password**; default new password is `12345678`
- **Reports & Exports**, **Audit Logs**, **Backups**, **Parking Areas** (add/edit lots), **Settings** (e.g. minor age)

### 8.2 What you cannot do / limits

- There is no “higher” role — you are not blocked from staff pages  
- You still follow the same **data rules** as everyone else (11-digit contacts when filled, minors need guardians on patients, queues stay clinic-based, public display shows codes only)  
- Prefer creating real role accounts for daily work; use admin mainly for setup, users, and audits  

> **Screenshot `32-users-roles.png`** — Users table (masked login) and/or Add User with role + office/clinic.

![Users & Roles](manual-screenshots/32-users-roles.png)

> **Screenshot `33-reports.png`** — Reports & Exports.

![Reports](manual-screenshots/33-reports.png)

> **Screenshot `34-audit-logs.png`** — Audit log entries.

![Audit Logs](manual-screenshots/34-audit-logs.png)

> **Screenshot `35-backups.png`** — Backup list / Back up now.

![Backups](manual-screenshots/35-backups.png)

> **Screenshot `36-settings.png`** — Settings (e.g. minor age threshold).

![Settings](manual-screenshots/36-settings.png)

---

## 9. Quick reference — who can do what

✓ = allowed · blank = not allowed · **Own** = limited to own office/clinic/self

| Task | Guard | Secretary | OPD | Nurse | Doctor | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Front Desk Routing | ✓ | | ✓ | | | ✓ |
| Register visitors / scan QR / today's visitors | ✓ | | | | | ✓ |
| Approve **office** visitors | | **Own** | | | | ✓ |
| Approve **patient** visitors | ✓ | | | | | ✓ |
| Visitor history | ✓ | **Own** | | | | ✓ |
| Register patient + hospital visit (+ screening at reg.) | | | ✓ | | | ✓ |
| Edit patient information | | | ✓ | | | ✓ |
| Initial Screening page (nurse) | | | | ✓ | | ✓ |
| View visits / patient search & records | | | ✓ | ✓ | ✓ | ✓ |
| Queue actions — **all** clinics | | | ✓ | ✓ | | ✓ |
| Queue actions — **own clinic only** | | | | | **Own** | ✓ |
| Cancel queue ticket | | | ✓ | | | ✓ |
| Queue history | | | ✓ | | | ✓ |
| Public Queue Display | | | ✓ | | | ✓ |
| Doctor list | | | ✓ | | ✓ | ✓ |
| Change **any** doctor availability | | | ✓ | | | ✓ |
| Change **own** availability only | | | | | **Own** | ✓ |
| Assign / reassign doctor → clinic | | | ✓ | | | ✓ |
| Create doctor **user** account | | | | | | ✓ |
| Admit / transfer / discharge / bed status | | | ✓ | | | ✓ |
| View beds / wards / admissions | | | ✓ | ✓ | ✓ | ✓ |
| Vehicles | ✓ | | ✓ | | | ✓ |
| Security logs | ✓ | | | | | ✓ |
| Users / reports / audit / backups / parking areas / settings | | | | | | ✓ |

**Hard limits (all non-admin roles):** the sidebar hides pages you cannot use; opening a forbidden URL shows a notice and sends you home. Doctors without a clinic assignment cannot run queue actions until OPD/admin assigns them.

---

## 10. Tips & rules

- **Login**, not email.  
- **Contact numbers:** optional; if provided, must be **11 numerical digits**.  
- **Middle name:** optional for patients, visitors, and users.  
- **Visitors:** same day only; visitor minors do **not** need a guardian.  
- **Patients who are minors:** guardian required (relationship list + Other).  
- **Queues** are per **clinic**; public display shows **codes only** (privacy).  
- **Secretary** = own office only · **Doctor** = own clinic for actions · **Nurse** = queues yes, beds view-only · **OPD** = operational staff, not system admin.  
- Screens refresh often — leave Clinic Queues / Public Display open for live updates.  
- Forbidden pages show an on-screen notice and return you to your home page.

---

## Document control

| Item | Value |
| --- | --- |
| Product | La Union Medical Center (LUMC) Operations System |
| Audience | Hospital staff (all roles) |
| Screenshots folder | `docs/manual-screenshots/` |
| Capture checklist | `docs/manual-screenshots/README.md` |
| Version note | Align with current feature-freeze build; update screenshots after major UI changes |
