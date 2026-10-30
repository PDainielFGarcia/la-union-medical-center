# Manual screenshots

Drop PNG (or JPG) files here using the **exact filenames** listed below.  
The user manual ([`../USER_MANUAL.md`](../USER_MANUAL.md)) embeds them with those names.

## How to capture

1. Use a seeded demo DB (`php artisan migrate:fresh --seed`) so names/queues look realistic.
2. Prefer **1920×1080** or a clear laptop window; crop out the browser chrome if it looks messy.
3. Blur or avoid real hospital data — use demo accounts only.
4. Match the **“What to capture”** note in the checklist so the screenshot matches the step in the manual.

## Checklist (filename → what to capture)

| # | Filename | What to capture |
| --- | --- | --- |
| 01 | `01-login.png` | Login page (brand + login form). Optional: show demo account buttons. |
| 02 | `02-sidebar-guard.png` | Guard logged in — full left sidebar (Visitors section visible). |
| 03 | `03-profile.png` | My Profile page with name / login / contact fields. |
| 04 | `04-notifications.png` | Header bell open with at least one unread notification. |
| 05 | `05-access-denied.png` | Banner: “You aren't allowed…” after opening a forbidden URL. |
| 06 | `06-register-visitor-office.png` | Register Visitor — Office transaction form (first/last name, office dropdown). |
| 07 | `07-register-visitor-patient.png` | Register Visitor — Visit admitted patient (patient list / filters). |
| 08 | `08-visitor-approvals-list.png` | Secretary Visitor Approvals — pending queue cards. |
| 09 | `09-visitor-card.png` | Open visitor details modal/card (full info). |
| 10 | `10-visitor-qr-pass.png` | Visitor QR pass screen (pass ID + QR). |
| 11 | `11-scan-qr.png` | Scan QR Pass page (camera or manual entry area). |
| 12 | `12-todays-visitors.png` | Today's Visitors table with statuses. |
| 13 | `13-register-patient.png` | Patient Registration — Patient Information form. |
| 14 | `14-hospital-visit-screening.png` | Hospital Visit step with clinic + Initial Screening checkboxes. |
| 15 | `15-queue-ticket-done.png` | After queue — large queue number (e.g. MED-001). |
| 16 | `16-todays-hospital-visits.png` | Today's Hospital Visits list. |
| 17 | `17-patient-record.png` | Patient record — Patient Information + Current Admission badge. |
| 18 | `18-hospital-visit-expanded.png` | Hospital Visits row expanded showing screening results. |
| 19 | `19-patient-edit.png` | Edit Patient Information modal. |
| 20 | `20-screening-nurse.png` | Initial Screening page (nurse) with pending/screened patients. |
| 21 | `21-clinic-queues.png` | Clinic Queues — one clinic section with waiting/called/serving. |
| 22 | `22-queue-confirm.png` | Confirmation modal for Call or Serve. |
| 23 | `23-queue-view-only.png` | Doctor viewing another clinic — “View only” (no action buttons). |
| 24 | `24-public-display.png` | Public Queue Display — full clinic name, queue **codes only**, live clock, doctor availability. |
| 25 | `25-doctor-availability.png` | Doctor Availability with Available/Unavailable toggles (+ Assign button for OPD). |
| 25b | `25b-assign-doctor-clinic.png` | Assign Doctor to Clinic modal (doctor account + clinic). |
| 26 | `26-bed-overview.png` | Bed Overview — beds with clear hover/selection highlight on one bed. |
| 27 | `27-admissions.png` | Admissions list with dark **Patient info** button visible. |
| 28 | `28-patient-info-modal.png` | Patient Information modal from beds/admissions + **Open Full Record**. |
| 29 | `29-waiting-for-bed.png` | Waiting for Bed page. |
| 30 | `30-admit-confirm.png` | Confirm modal for assign/transfer/discharge (any one). |
| 31 | `31-vehicles.png` | Vehicles page — Record Vehicle modal showing Belongs to (Visitor/Patient/Employee/Other). |
| 32 | `32-users-roles.png` | Users & Roles — masked logins, Add User open (role + office or clinic). |
| 33 | `33-reports.png` | Reports & Exports page. |
| 34 | `34-audit-logs.png` | Audit Logs page with sample rows. |
| 35 | `35-backups.png` | Backups page. |
| 36 | `36-settings.png` | Settings page (e.g. minor age). |

## After adding files

Open [`../USER_MANUAL.md`](../USER_MANUAL.md) in a Markdown previewer (VS Code / GitHub). Every `![...](manual-screenshots/…)` should show an image instead of a broken icon.
