# La Union Medical Center (LUMC)

Hospital operations system: **React (Vite) frontend** + **Laravel 13 REST API** + **MySQL (`lumc`)**.

Covers administrative data only: same-day visitor approval with QR entry/exit, patient registration and OPD queues, admissions and bed availability, vehicle parking, daily PDF reports, CSV exports for Google Sheets, audit logs and database backups. No medical records, no iHOMIS integration.

## Folder structure

```
La Union Medical Center/
├── backend/                  # Laravel API
│   └── scripts/smoke-test.ps1  # End-to-end API test
├── database/schema.sql       # Structure dump (generated from migrations)
├── docs/API.md               # Endpoints and roles
├── docs/DATABASE.md          # Tables and seeded bed layout
├── src/                      # React frontend
└── tools/composer.phar
```

## Prerequisites

- Node.js + npm
- PHP 8.3+ (WAMP: `C:\wamp64\bin\php\php8.3.14\php.exe`)

- MySQL running on port 3306 (start WAMP, or run `mysqld.exe`)

**Docs:** staff [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) (screenshots in `docs/manual-screenshots/`) · UAT [`docs/TESTER_GUIDE.md`](docs/TESTER_GUIDE.md) · demo [`docs/DEMO.md`](docs/DEMO.md) · deploy [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Run it

Backend (first time):

```powershell
cd backend
copy .env.example .env        # DB_DATABASE=lumc, DB_USERNAME=root, DB_PASSWORD=
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve             # http://127.0.0.1:8000
```

Frontend:

```powershell
npm install
copy .env.example .env        # VITE_API_BASE_URL=http://localhost:8000/api, VITE_USE_MOCK=false
npm run dev                   # http://localhost:5173
```

Smoke test (needs a freshly seeded database and the API running):

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\smoke-test.ps1
```

## Demo accounts

Sign in with **login** (not email). Password for all: **`12345678`**

| Role | Login | Lands on |
| --- | --- | --- |
| Administrator | `admin` | Dashboard (all modules) |
| Security Guard | `guard` | Security (visitors, QR, parking) |
| OPD & Admission Staff | `opd` | Patients, hospital visits, clinic queues, admit/beds |
| Nursing Staff | `nurse` | Screening, clinic queues (all clinics), wards (view) |
| Doctor (Internal Medicine) | `dr.reyes` | Clinic queues (act in own clinic), availability (self) |
| Doctor (Pediatrics) | `dr.santos` | Same for Pediatrics |
| Office Secretary (×12) | `secretary.{office}` | Visitor approvals for their office only |

Office secretary logins: `secretary.admin`, `secretary.property`, `secretary.budget`, `secretary.hr`, `secretary.accounting`, `secretary.records`, `secretary.social`, `secretary.xray`, `secretary.nursing`, `secretary.pharmacy`, `secretary.philhealth`, `secretary.billing`.

The seed also admits three demo patients (MW1-PR-01, PED-W-02, OB-W-03) so patient visits can be tested right away.

**Hospital deployment:** [`docs/DEPLOY.md`](docs/DEPLOY.md) · **blank laptop + XAMPP (home then client WiFi):** [`docs/DEPLOY_XAMPP.md`](docs/DEPLOY_XAMPP.md) — use `ProductionBootstrapSeeder`, not `migrate:fresh --seed`.

## Main workflows

**Visitors (same day only)** — two kinds:

*Office transaction*
1. Guard registers the visitor (first / middle / last name) and picks one of the 12 offices (vehicle optional). Minors do not need a guardian for visits — the secretary decides.
2. That office's secretary opens the visitor card and approves or rejects (with a reason) on **Visitor Approvals**.
3. On approval a one-day QR pass is issued; the guard can print or show it.

*Patient visit*
1. Guard picks **Visit an admitted patient** and finds the patient by ward, room type (private / ward / charity) or name. Only patients currently admitted to a bed are listed.
2. If the patient is listed, the **guard approves** and the QR is issued right away. If not listed, the visit cannot be approved.
3. Visiting hours and the number of visitors per patient are at the guard's discretion; the system does not enforce them. The guard can see who is inside and which patient/ward they went to on **Today's Visitors**.

For both: the guard scans the QR on **Scan QR Pass** at entry, and again at exit. A camera or a USB handheld scanner both work.

**Patients & hospital visits**
OPD & Admission staff register or find the patient and queue them to a **clinic** (not a specific doctor). **Initial screening** is captured at registration and stored on the hospital visit. Minor **patients** require a guardian (relationship dropdown + Other); visitors do not. Staff use **Clinic Queues** (Call / Serve / Done / Skip with confirm + one-step undo). Doctors only act in their assigned clinic; OPD and nurses act on all clinics. Public display shows **queue codes only** (no patient names), full clinic names, live date/time, and doctor availability per clinic.

**Admissions and beds**
OPD & Admission staff admit (directly into a bed or to the waiting list), transfer and discharge — each with confirmation and one-step undo. Nurses and doctors can view wards/beds and open patient info, but cannot change beds.

Seeded layout: **84 beds** across MW1 (8 private + 8 ward), MW2 (6 ward + 6 charity), Pavilion (13 private + 4 ward), Pedia (5 private + 5 ward), OB-Gyne (4 private + 15 ward) and ICU (10). Labels look like `MW1-PR-01`, `MW1-W-01`, `MW2-C-01`.

**Parking**
Guard (or OPD) records plate number, parking area and optional slot; marks exit when the vehicle leaves. Admins manage parking areas.

## Reports and Google Sheets

Admin → **Reports**:
- Daily PDF reports: **Patients**, **Visitors**, **Audit log** for any date.
- CSV exports for a date range: patients, hospital visits, admissions, bed census, visitors, vehicles, audit log.

The scheduler also saves the previous day's three PDFs to `backend/storage/app/reports/{date}/` every night.

To open a CSV in Google Sheets: **File → Import → Upload**, choose the file, then *Replace spreadsheet* or *Insert new sheet*. Excel opens the same files directly. (Export is one-way; nothing is synced back.)

## Backups

**What it does:** `php artisan lumc:backup` runs `mysqldump` and saves a gzipped file to `backend/storage/app/backups/lumc-YYYYMMDD-HHMMSS.sql.gz`. Files older than `backup_retention_days` (Settings, default 30) are deleted. If `BACKUP_OFFSITE_PATH` is set, each backup is also copied there — point it at a USB drive, a NAS share, or a Google Drive / OneDrive synced folder so a copy lives off the server.

Admins can also run and download backups from **Backups** in the app.

Relevant `backend/.env` keys:

```
BACKUP_MYSQLDUMP_PATH=C:/wamp64/bin/mysql/mysql9.1.0/bin/mysqldump.exe
BACKUP_OFFSITE_PATH=
BACKUP_TIME=02:00
```

**Turn on the nightly schedule (Windows).** Laravel's scheduler runs backups at `BACKUP_TIME`, daily PDFs at 00:15 and visit expiry at 00:05, but only if something calls it every minute. Create a Task Scheduler task:

- Trigger: daily, repeat every 1 minute, indefinitely
- Action: `C:\wamp64\bin\php\php8.3.14\php.exe`
- Arguments: `artisan schedule:run`
- Start in: `D:\CAPSTONE\La Union Medical Center\backend`
- Run whether the user is logged on or not

Or from an admin PowerShell:

```powershell
schtasks /Create /TN "LUMC Scheduler" /SC MINUTE /MO 1 /RU SYSTEM `
  /TR "cmd /c cd /d \"D:\CAPSTONE\La Union Medical Center\backend\" && C:\wamp64\bin\php\php8.3.14\php.exe artisan schedule:run"
```

**Restore** (this overwrites the current data):

```powershell
# 1. Unzip, e.g. with 7-Zip:  7z x lumc-20261006-020000.sql.gz
# 2. Load into MySQL
C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe -u root lumc < lumc-20261006-020000.sql
```

Test a restore into a scratch database (`CREATE DATABASE lumc_test;` then load into `lumc_test`) once in a while to make sure backups are usable.

## Other commands

```powershell
php artisan lumc:daily-reports 2026-10-05   # save PDFs for a date
php artisan lumc:expire-visits              # expire past-day visits
```

## Mock mode

`VITE_USE_MOCK=true` routes the frontend to an old in-browser mock (`src/services/mock/`). It predates the current workflow and is out of date; use the Laravel API.
