# LUMC — Client Demo Script

Use this **after UAT** (see [`TESTER_GUIDE.md`](TESTER_GUIDE.md)). Reset demo data first so the story is clean.

```powershell
cd backend
php artisan migrate:fresh --seed
# Start API + Vite (or production build) as usual
```

**Demo password for all accounts:** `12345678`  
**Tip:** two browsers (or normal + Incognito) so you can switch roles without logging out constantly.

Suggested total time: **25–35 minutes**.

---

## Before you start (2 min)

1. Open **Public Queue Display** on a second monitor/TV tab (OPD login → Public Queue Display). Leave it visible for the whole demo.
2. Confirm the clock is live and clinic names are full names (e.g. Internal Medicine, Pediatrics).
3. Have Incognito ready for Guard / Secretary / Doctor switches.

---

## Act 1 — Identity, security & real-time shell (3 min)

| Speak | Do |
| --- | --- |
| Staff sign in with a **login** (not email) and role-based menus. | Log in as `admin`. Show Users & Roles briefly: masked logins, office vs clinic when adding users. |
| Wrong pages are blocked with a clear message. | Paste `/users` while logged in as… (or log in as `nurse` and open `/users`) → redirected + “not allowed” banner. |
| Notifications update live; no cluttered global search. | Point at the bell (no avatar beside it). |

---

## Act 2 — Visitors: office path (5 min)

| Speak | Do |
| --- | --- |
| Same-day visitor registration with first, middle, last name and 11-digit contact. | `guard` → Register Visitor → Office → Accounting. Show Other purpose / Other ID if useful. |
| Minors as visitors do **not** need a guardian — the office decides. | Optionally register age 15 quickly, or just state it. |
| Secretary reviews a full **visitor card**, not a vague list. | `secretary.accounting` → Approvals → open card → Approve. |
| Rejection reason is optional. | (Optional) second visitor → Reject without reason. |
| QR for entry and exit. | Guard → QR pass → Scan entry → Scan exit. |
| Notifications reach the right people. | Mention / show bell on secretary or guard. |

---

## Act 3 — Visitors: patient visit (2 min)

| Speak | Do |
| --- | --- |
| Visiting an admitted patient is approved by the **guard**, not the secretary. | Guard → Visit admitted patient → pick Juan Dela Cruz → Approve & QR. |
| Location shows on the pass. | Open pass; show ward/bed. |

---

## Act 4 — Patient registration & hospital visit (6 min)

| Speak | Do |
| --- | --- |
| Patients are registered with structured names; contacts are strictly 11 digits. | `opd` → Register & Queue → new adult patient. |
| Minors need a guardian with relationship dropdown + Other. | (Optional short) register a minor with Mother. |
| Visit is to a **clinic**, not a named doctor; screening happens **at registration**. | Hospital Visit step: choose **Internal Medicine**, tick screening, queue. |
| Show ticket code (e.g. MED-00x). | Done screen. |
| Patient record: past hospital visits, admissions, current admission. | Patient Records → open patient → expand a **Hospital Visit** for screening. |
| Records are editable and audited. | Edit address → Save → (optional) Audit Logs later. |
| No print-patient step. | Note it is intentionally omitted. |

Point at the **public display**: new code appears under Internal Medicine; **no patient name** — privacy.

---

## Act 5 — Clinic queues & doctor scope (5 min)

| Speak | Do |
| --- | --- |
| Work is organized by **clinic queues**, not doctor queues. Schedules tab removed. | Clinic Queues / Queue Monitor. |
| Every action is confirmed; one-step **Undo** is available. | Call → confirm → Serve → Undo once → Serve again. |
| Doctors only **act** in their assigned clinic; they can still **see** others. | `dr.santos` → try to act on Internal Medicine ticket → view only / blocked. |
| OPD and nurses can manage all clinics. | `nurse` or stay as `opd` → act on a ticket. |
| Availability is per doctor, shown per clinic on the board. | `dr.reyes` → Availability → set Unavailable → public display updates. Then set Available again. |
| OPD can adjust any doctor; nurses cannot; doctors only themselves. | Brief mention + optional `opd` toggle. |

---

## Act 6 — Beds & admissions (5 min)

| Speak | Do |
| --- | --- |
| Admit with confirmation; beds highlight clearly on hover. | Admissions → Admit patient into a free bed. Hover beds on overview. |
| Patient info is always one click away, with link to the full record. | Darker **Patient info** → Open Full Record. |
| Transfer / discharge with confirm + undo. | Transfer → Undo → Discharge (as time allows). |
| Nurses/doctors see occupancy but do not move beds. | Optional: `nurse` → Wards (view only). |

---

## Act 7 — Admin wrap-up (3 min)

| Speak | Do |
| --- | --- |
| Daily reports, CSV for Sheets, PDFs, audit trail, backups. | `admin` → Reports (glance), Audit Logs, Backups → Back up now. |
| Parking for visitor/patient vehicles. | Optional 30s on Vehicles. |
| Ready for hospital install when UAT is signed off. | Point to deployment plan (single Apache origin, no demo seed on live DB). |

---

## Closing lines (1 min)

- Administrative system only (visitors, hospital visits/queues, beds, parking, reports) — not a clinical EMR.
- Real-time updates via continuous refresh of queues, display, notifications, and bed views.
- Next step after client feedback: **pre-deployment hardening** (see [`DEPLOY.md`](DEPLOY.md)), then go-live when you give the green light.

---

## Demo day checklist

- [ ] `migrate:fresh --seed` completed morning of demo
- [ ] Public display on second screen
- [ ] Password `12345678` known to presenters
- [ ] Webcam or paste QR for scan demo
- [ ] Incognito window ready
- [ ] Bug list from UAT closed or acknowledged
- [ ] No production `.env` / real patient data on the demo machine
