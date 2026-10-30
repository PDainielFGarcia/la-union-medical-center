# LUMC full deployment guide (download → ready to use)

Complete beginner instructions for putting **La Union Medical Center (LUMC)** on a Windows hospital PC, from getting the files through first-day use. Includes **troubleshooting** for common problems.

| Related docs | Purpose |
| --- | --- |
| **This file** | Install and deploy (WAMP-oriented) |
| [`DEPLOY_XAMPP.md`](DEPLOY_XAMPP.md) | **Blank laptop + XAMPP** — at home, then client WiFi |
| [`USER_MANUAL.md`](USER_MANUAL.md) | How staff use each role day to day |
| [`TESTER_GUIDE.md`](TESTER_GUIDE.md) | Testing with demo data (not for live hospital DB) |

---

## What you will have when finished

- LUMC opens in a browser on the hospital computer (and optionally on other PCs on the same network)
- Empty operational data (no fake patients or demo staff)
- Baseline lists already loaded: offices, clinics, empty beds, parking areas, rejection reasons
- **One** account: Administrator (`admin`)
- You create real staff afterward under **Users & Roles**

---

## Words used in this guide

| Word | Meaning |
| --- | --- |
| **Target PC / server** | The Windows computer where LUMC will run |
| **Browser** | Chrome, Edge, or Firefox |
| **PowerShell** | Windows command window (type commands, press Enter) |
| **Database** | Storage for users, patients, queues (MySQL inside WAMP) |
| **Apache** | The program that shows the website |
| **`.env`** | Settings file for the app (edited with Notepad) |
| **Virtual host** | Tells Apache which folder is the LUMC website |

**Path used in examples:** `D:\CAPSTONE\La Union Medical Center`  
If your folder is elsewhere (e.g. `D:\LUMC`), replace that path in every command.

**PHP path used in examples:** `C:\wamp64\bin\php\php8.3.14\php.exe`  
Your WAMP may use a different PHP folder (e.g. `php8.4.0`). Open `C:\wamp64\bin\php\` and use **your** folder name everywhere.

---

# PHASE 1 — Prepare the computer

## Step 1 — Install WAMP (Apache + MySQL + PHP)

1. On the target PC, open a browser and download **WAMP** (64-bit) from the official WAMP website.
2. Run the installer. Keep the defaults unless IT tells you otherwise.
3. Start **Wampserver**.
4. Look at the system tray (bottom-right, near the clock). The WAMP icon should turn **green**.
   - Orange/red → click the icon → **Start All Services**.
5. Confirm you can open http://localhost in the browser (WAMP welcome page is fine).

WAMP gives you:

| Tool | Job |
| --- | --- |
| Apache | Serves the website |
| MySQL | Stores data |
| PHP | Runs the LUMC backend |
| phpMyAdmin | Create the database with a mouse |

## Step 2 — Install Node.js

1. Download **Node.js LTS** from https://nodejs.org  
2. Install with defaults. Check **Add to PATH** if offered.  
3. Restart the PC if the installer asks.

## Step 3 — Verify tools

1. Press the Windows key → type **PowerShell** → open **Windows PowerShell**.  
2. Run:

```powershell
node -v
npm -v
& "C:\wamp64\bin\php\php8.3.14\php.exe" -v
```

You want version numbers, not red errors. PHP should be **8.3 or newer**.

---

# PHASE 2 — Get the project onto the PC

## Step 4 — Download or copy the project

Choose how your team delivers the files:

### Option A — ZIP file (most common for beginners)

1. Copy the ZIP onto the target PC (USB, download, shared drive).  
2. Right-click the ZIP → **Extract All…**  
3. Extract to a simple location, for example:

   - `D:\CAPSTONE\La Union Medical Center`  
   - or `D:\LUMC`

4. Open the extracted folder. You should see at least:

   - `backend`  
   - `src`  
   - `package.json`  
   - `docs`  
   - `README.md`

### Option B — USB / shared folder (already unzipped)

1. Copy the **entire** project folder to `D:\` (or another fixed drive).  
2. Do not leave it only on a removable USB for daily use — copy it to the hard drive.

### Option C — Git (if your team uses Git)

```powershell
cd D:\CAPSTONE
git clone <YOUR-REPO-URL> "La Union Medical Center"
cd "La Union Medical Center"
```

Use the branch/tag your team approved for go-live.

## Step 5 — Confirm nothing important is missing

In File Explorer, check:

| Path | Should exist |
| --- | --- |
| `backend\artisan` | Yes |
| `backend\composer.json` | Yes |
| `backend\.env.example` | Yes |
| `package.json` | Yes |
| `src\` | Yes |

If `backend\vendor\` is missing or almost empty, you must install PHP packages (Step 6). If `vendor` is already large (thousands of files), you can skip Step 6.

## Step 6 — Install PHP libraries (Composer)

Open PowerShell:

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
```

**If Composer is installed on the PC:**

```powershell
composer install --no-dev --optimize-autoloader
```

**If `composer` is not recognized**, use the project’s Composer helper:

```powershell
cd "D:\CAPSTONE\La Union Medical Center"
& "C:\wamp64\bin\php\php8.3.14\php.exe" tools\composer.phar install --working-dir=backend --no-dev --optimize-autoloader
```

Wait until it finishes. A `backend\vendor` folder should appear/fill up.

---

# PHASE 3 — Create the database

## Step 7 — Open phpMyAdmin

1. WAMP icon must be **green**.  
2. Click WAMP → **phpMyAdmin**, or open http://localhost/phpmyadmin  
3. Login if asked. Typical WAMP defaults:
   - Username: `root`  
   - Password: *(blank)*

## Step 8 — Create database `lumc`

1. Click **Databases** (or **New**).  
2. Database name: `lumc`  
3. Collation: `utf8mb4_unicode_ci` (or any `utf8mb4_…`).  
4. Click **Create**.  

Leave the database **empty** (no tables yet). The next phase creates them.

---

# PHASE 4 — Configure the application

## Step 9 — Create the `.env` settings file

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
copy .env.example .env
```

## Step 10 — Edit `.env` in Notepad

1. In File Explorer open `backend`.  
2. If `.env` is hidden: **View** → enable **Hidden items** and **File name extensions**.  
3. Right-click `.env` → **Open with** → **Notepad**.

Set at least these values (first setup on the same PC):

```env
APP_NAME="LUMC"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://lumc.local
FRONTEND_URL=http://lumc.local
LOG_LEVEL=error
APP_TIMEZONE=Asia/Manila

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumc
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=lumc.local,127.0.0.1,localhost
```

**Notes**

- If MySQL `root` has a password, put it after `DB_PASSWORD=`  
- `APP_DEBUG=false` hides technical errors from staff (correct for live use)  
- You will create the name `lumc.local` in Phase 6  

**Backup path:** open `C:\wamp64\bin\mysql\`, open your MySQL version folder → `bin` → confirm `mysqldump.exe` exists, then set (use your version folder name):

```env
BACKUP_MYSQLDUMP_PATH=C:/wamp64/bin/mysql/mysql9.1.0/bin/mysqldump.exe
BACKUP_OFFSITE_PATH=
BACKUP_TIME=02:00
```

Use forward slashes `/` in that path. Save and close Notepad.

## Step 11 — Generate the application key

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan key:generate
```

You should see that the application key was set. Do this **once** per install.

---

# PHASE 5 — Build the empty live database

## Step 12 — Create tables

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan migrate --force
```

In phpMyAdmin → database `lumc`, you should now see many tables.

## Step 13 — Load catalogs + administrator only

```powershell
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan db:seed --class=ProductionBootstrapSeeder --force
```

| Loaded | Not loaded |
| --- | --- |
| 12 offices | Guard / OPD / nurse / secretaries / doctors |
| 16 clinics | Demo patients |
| 84 empty beds | Demo visits / queues |
| Parking areas | Demo filler data |
| Rejection reasons + settings | |
| User `admin` (Administrator) | |

**First login (temporary):**

| Field | Value |
| --- | --- |
| Login | `admin` |
| Password | `12345678` |

### Dangerous commands — do not use on the live hospital DB

| Command | What it does |
| --- | --- |
| `migrate:fresh --seed` | **Deletes all data** and loads demo staff + patients |
| `db:seed` (default) | Loads demo data |

---

# PHASE 6 — Build the staff screens (frontend)

## Step 14 — Install and build the React app

Open PowerShell at the **project root** (folder with `package.json`):

```powershell
cd "D:\CAPSTONE\La Union Medical Center"
npm ci
```

If `npm ci` fails, use:

```powershell
npm install
```

Then build:

```powershell
$env:VITE_API_BASE_URL="/api"
npm run build
```

Confirm this folder exists and has files:

`D:\CAPSTONE\La Union Medical Center\backend\public\spa`

## Step 15 — Cache Laravel settings

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan config:cache
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan route:cache
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan optimize
```

Whenever you change `.env` later: run `config:clear`, then these three again.

---

# PHASE 7 — Connect the website to Apache

## Step 16 — Turn on Apache rewrite

1. WAMP icon → **Apache** → **Apache modules**  
2. Ensure **rewrite_module** is checked  

## Step 17 — Map the name `lumc.local` on this PC

1. Windows key → type **Notepad** → right-click → **Run as administrator**  
2. File → Open → go to `C:\Windows\System32\drivers\etc\`  
3. Change file type to **All files** → open `hosts`  
4. Add at the bottom:

```text
127.0.0.1   lumc.local
```

5. Save and close  

## Step 18 — Point Apache at LUMC’s public folder

1. Open (version number may differ):

`C:\wamp64\bin\apache\apache2.4.xx\conf\extra\httpd-vhosts.conf`

2. Add at the bottom (fix the path if needed; keep forward slashes):

```apache
<VirtualHost *:80>
    ServerName lumc.local
    DocumentRoot "D:/CAPSTONE/La Union Medical Center/backend/public"
    <Directory "D:/CAPSTONE/La Union Medical Center/backend/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

3. Confirm `httpd.conf` includes vhosts (usually already enabled in WAMP):

`Include conf/extra/httpd-vhosts.conf`

4. WAMP icon → **Restart All Services** → wait for **green**

## Step 19 — Open the app

In Chrome or Edge go to:

**http://lumc.local**

You should see the **LUMC login page**.

---

# PHASE 8 — First login and make it usable

## Step 20 — Sign in as administrator

1. Login: `admin`  
2. Password: `12345678`  
3. Open **My Profile** and **change the password** immediately.  
4. Optionally change the login name later under **Users & Roles** (admin password confirmation may be required).

## Step 21 — Create real staff accounts

Go to **Administration → Users & Roles → Add User**.

Create only what you need for day 1, for example:

| Role | Notes |
| --- | --- |
| Security Guard | Visitors, QR, vehicles |
| OPD & Admission Staff | Patients, queues, beds |
| Nursing Staff | Screening + queues |
| Doctor | Needs clinic assignment afterward |
| Office Secretary | Must pick their **office** |

Default new password is often `12345678` — tell each person to change it on first login (**My Profile**).

### Doctors

1. Create the user with role **Doctor**.  
2. Open **Doctors → Availability → Assign Doctor to Clinic** (admin or OPD).  
3. Until assigned, the doctor can see queues but cannot act on tickets.

## Step 22 — Quick system checks

While logged in as admin (or OPD after you create one):

- [ ] **Bed Overview** shows empty beds  
- [ ] **Parking Areas** lists lots  
- [ ] **Users & Roles** lists only accounts you created (+ admin)  
- [ ] **Patient Search** has no demo patients  
- [ ] **Backups** — click to create a backup; download it once  

## Step 23 — Train staff and start using the system

Use [`USER_MANUAL.md`](USER_MANUAL.md) by role:

1. Guard: register visitor → secretary approval (office) or guard approval (patient visit) → QR in/out  
2. OPD: register patient + hospital visit → clinic queue → Call / Serve / Done  
3. OPD: admit / transfer / discharge  
4. Optional TV: open **Public Queue Display** and leave that browser on a screen  

**The system is now deployed and ready for daily use.**

---

# PHASE 9 — Optional: other PCs on the hospital network

Do this only if other computers must open LUMC (not only the server PC).

1. On the server PC, open PowerShell and run `ipconfig`. Note **IPv4 Address** (example `192.168.1.50`).  
2. Edit `backend\.env`:

```env
APP_URL=http://192.168.1.50
FRONTEND_URL=http://192.168.1.50
SANCTUM_STATEFUL_DOMAINS=192.168.1.50,lumc.local,127.0.0.1,localhost
```

3. Recache:

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan config:clear
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan config:cache
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan route:cache
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan optimize
```

4. Allow Apache through Windows Firewall (port 80) if IT requires it.  
5. On another PC’s browser open `http://192.168.1.50`  

**QR from phones:** many phones need **HTTPS**. On plain HTTP, use a USB webcam on the guard PC for scanning.

## Optional — daily backup task

Create a Windows Task Scheduler job that runs daily (e.g. 2:00 AM):

```powershell
& "C:\wamp64\bin\php\php8.3.14\php.exe" "D:\CAPSTONE\La Union Medical Center\backend\artisan" lumc:backup
```

Also keep **Administration → Backups** available for manual runs. Set `BACKUP_OFFSITE_PATH` to a USB/NAS folder if you want a second copy.

---

# Master checklist (print / tick off)

- [ ] WAMP green  
- [ ] Node.js works (`node -v`)  
- [ ] Project copied to hard drive  
- [ ] `composer install` done if needed  
- [ ] Database `lumc` created  
- [ ] `.env` created and saved  
- [ ] `key:generate` done  
- [ ] `migrate --force` done  
- [ ] `ProductionBootstrapSeeder` done  
- [ ] `npm ci` / `npm run build` done (`public\spa` exists)  
- [ ] Laravel caches built  
- [ ] hosts + Apache vhost + rewrite enabled  
- [ ] http://lumc.local shows login  
- [ ] Admin password changed  
- [ ] Real staff users created  
- [ ] One backup tested  
- [ ] Staff trained with USER_MANUAL  

---

# Troubleshooting

Work top to bottom. Most problems are WAMP, wrong path, `.env`, or caches.

## 1. WAMP icon stays orange or red

**Meaning:** Apache and/or MySQL did not start.

**Try:**

1. WAMP → **Start All Services**.  
2. Another program may be using port **80** (Skype, IIS, another Apache).  
   - WAMP → Apache → **httpd.conf** or tools → change Apache port to `8080`, then use `http://lumc.local:8080` and set `APP_URL` accordingly.  
3. Right-click WAMP → run **as administrator**.  
4. Check Windows Services for conflicting MySQL.

## 2. `php` / `node` / `npm` / `composer` “not recognized”

**Meaning:** PowerShell cannot find the program.

**Try:**

- For PHP, always use the full path:

```powershell
& "C:\wamp64\bin\php\php8.3.14\php.exe" -v
```

- For Node: reinstall Node.js LTS and **restart** the PC; open a **new** PowerShell.  
- For Composer: use `tools\composer.phar` as in Step 6.

## 3. `composer install` fails

**Try:**

- Confirm internet access (Composer downloads packages).  
- Confirm PHP version ≥ 8.3.  
- Delete `backend\vendor` and `backend\composer.lock` only if your team says it is OK, then reinstall — normally keep `composer.lock` and only delete `vendor`.  
- Run PowerShell **as administrator** once.  
- Antivirus may lock files — temporarily allow the project folder.

## 4. phpMyAdmin will not open / cannot log in

**Try:**

- WAMP must be green.  
- Use `root` and blank password.  
- If you set a MySQL root password earlier, use that same password in phpMyAdmin **and** in `.env` `DB_PASSWORD=`.

## 5. `SQLSTATE` / “Access denied” / “Unknown database lumc” during migrate

**Meaning:** Laravel cannot talk to MySQL.

**Try:**

1. Confirm database `lumc` exists in phpMyAdmin.  
2. Confirm `.env` has `DB_DATABASE=lumc`, `DB_USERNAME=root`, correct `DB_PASSWORD`.  
3. Confirm MySQL is running (WAMP green).  
4. After fixing `.env`:

```powershell
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan config:clear
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan migrate --force
```

## 6. `Could not open input file: artisan`

**Meaning:** You are not in the `backend` folder.

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
dir artisan
```

## 7. Seeder says admin already exists / migrate says tables exist

**Meaning:** You already ran setup once.

- If this is a **new** empty hospital and you need a clean start (all data lost forever):

```powershell
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan migrate:fresh --force
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan db:seed --class=ProductionBootstrapSeeder --force
```

**Warning:** `migrate:fresh` deletes **all** data in `lumc`. Never use it after real patients are entered unless you have a backup and a written go-ahead.

## 8. `npm ci` / `npm install` / `npm run build` fails

**Try:**

1. Confirm you are in the project **root** (where `package.json` is), not only in `backend`.  
2. Delete `node_modules` and retry:

```powershell
cd "D:\CAPSTONE\La Union Medical Center"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
$env:VITE_API_BASE_URL="/api"
npm run build
```

3. Confirm Node is LTS (`node -v`).  
4. Corporate proxy/firewall may block npm — ask IT.

## 9. Login page is blank / white screen / missing CSS

**Meaning:** Frontend build missing or wrong base path.

**Try:**

1. Confirm `backend\public\spa` exists and contains `index.html` / assets.  
2. Rebuild:

```powershell
cd "D:\CAPSTONE\La Union Medical Center"
$env:VITE_API_BASE_URL="/api"
npm run build
```

3. Hard refresh the browser (`Ctrl+F5`).  
4. Confirm Apache DocumentRoot is `backend/public` (not the project root, not `src`).

## 10. http://lumc.local does not open / “can’t be reached”

**Try:**

1. WAMP green?  
2. `hosts` file has `127.0.0.1 lumc.local`?  
3. Vhost DocumentRoot path correct (forward slashes, real folder)?  
4. Restart All Services after edits.  
5. Try http://127.0.0.1 — if that shows a different site, the vhost is not applied.  
6. Check Apache error log under `C:\wamp64\logs\`.  
7. If Apache uses port 8080, open http://lumc.local:8080 and update `APP_URL` / `FRONTEND_URL`.

## 11. Login page opens but Sign in fails / network error / 404 on `/api`

**Try:**

1. `.env` `APP_URL` and `FRONTEND_URL` must match the address in the browser bar (`http://lumc.local`).  
2. Recache config (Step 15).  
3. Confirm `rewrite_module` is on and `backend\public\.htaccess` exists.  
4. In browser DevTools (F12) → Network, see if `/api/login` returns 404/500.  
5. Temporarily set `APP_DEBUG=true`, reproduce once, read the error, then set `APP_DEBUG=false` again and recache.

## 12. “CSRF” / 419 / session problems after login

**Try:**

- Add your exact host to `SANCTUM_STATEFUL_DOMAINS` (no `http://`).  
- Match `APP_URL` to the browser URL.  
- Clear site cookies for `lumc.local`, then recache and retry.

## 13. Other PCs cannot open the site

**Try:**

1. Use the server’s LAN IP in the browser.  
2. Update `.env` URLs and `SANCTUM_STATEFUL_DOMAINS` to that IP; recache.  
3. Windows Firewall: allow inbound TCP port 80 for Apache.  
4. Confirm all PCs are on the same network/VLAN.  
5. Ping the server IP from the other PC.

## 14. Backup fails in the admin screen

**Try:**

1. Confirm `BACKUP_MYSQLDUMP_PATH` points to a real `mysqldump.exe`.  
2. Use forward slashes in `.env`.  
3. Recache config after changing `.env`.  
4. Run manually to see the error:

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan lumc:backup
```

## 15. Permission / “failed to open stream” / cannot write logs or backups

**Try:**

- Ensure these folders exist and are writable by Apache/PHP:

  - `backend\storage`  
  - `backend\storage\logs`  
  - `backend\storage\app`  
  - `backend\bootstrap\cache`

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
New-Item -ItemType Directory -Force storage\logs, storage\app\backups, bootstrap\cache | Out-Null
& "C:\wamp64\bin\php\php8.3.14\php.exe" artisan storage:link
```

## 16. Forgot admin password

If you still have database access (phpMyAdmin) and a teammate with PHP skills:

1. Prefer creating a new admin via a known process your team documents, **or**  
2. Re-run ProductionBootstrapSeeder only works if login `admin` does **not** already exist — so for a forgotten password you typically reset the hash with IT help, or restore from backup.

Safest operational approach: keep a printed sealed admin password with hospital IT; avoid wiping the database.

## 17. Wrong data appeared (demo patients / many demo logins)

**Cause:** Someone ran `migrate:fresh --seed` or default `db:seed`.

**If the system is not yet in real use:** wipe and bootstrap cleanly (see §7 warning).  
**If real data already exists:** do **not** wipe — disable demo users in **Users & Roles** and delete demo patients carefully, or restore the last good backup.

---

# After deployment — daily usage (short)

| Who | Main work |
| --- | --- |
| Guard | Visitors, QR scan, vehicles |
| Secretary | Approve **their office** visitors only |
| OPD | Register & queue, all clinic queues, admit/beds, doctor clinic assign, vehicles |
| Nurse | Initial Screening page, all clinic queues, view beds |
| Doctor | Queue actions in **own clinic**, own availability |
| Admin | Users, reports, backups, settings, everything else |

Full steps and limits: [`USER_MANUAL.md`](USER_MANUAL.md).

---

# Developer-only: local demo (not the hospital server)

```powershell
cd backend
php artisan migrate:fresh --seed
php artisan serve
```

Other terminal, project root: `npm run dev` → http://127.0.0.1:5173  

Demo password: `12345678`. Never use this demo seed on the live hospital database.
