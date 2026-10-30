# LUMC on a blank laptop with XAMPP

Use this when the laptop has **only the project files** (no WAMP, no Node yet).  
Split into **At home** then **At the client WiFi**.

**PHP requirement:** LUMC needs **PHP 8.3 or newer**. When downloading XAMPP, pick a build whose PHP is **8.3+** (not 7.x or 8.0/8.1).

**Default paths in this guide**

| Item | Path |
| --- | --- |
| Project | `D:\CAPSTONE\La Union Medical Center` |
| XAMPP | `C:\xampp` |
| PHP | `C:\xampp\php\php.exe` |
| mysqldump | `C:\xampp\mysql\bin\mysqldump.exe` |

If your project folder is different, replace the path in every command.

---

# PART 1 — At home (do all of this first)

## 1. Install XAMPP (PHP 8.3+)

1. Open a browser → go to the official **Apache Friends / XAMPP** download page.  
2. Download **XAMPP for Windows** with **PHP 8.3** (or newer).  
3. Run the installer.
   - Install to `C:\xampp` (default).  
   - If Windows asks about firewall, allow Apache.  
   - You can skip Bitnami extras if offered.  
4. Open **XAMPP Control Panel**.  
5. Click **Start** next to **Apache**.  
6. Click **Start** next to **MySQL**.  
7. Both should show a green **Running** background.

**Check PHP version**

1. Press Windows key → type **PowerShell** → open it.  
2. Run:

```powershell
& "C:\xampp\php\php.exe" -v
```

You must see **PHP 8.3** or **8.4** (etc.).  
If you see 7.3 or 8.0/8.1/8.2 only and Composer later complains about `^8.3`, uninstall and install a newer XAMPP with PHP 8.3+.

## 2. Install Node.js

1. Download **Node.js LTS** from https://nodejs.org  
2. Install with defaults (include PATH).  
3. **Close and reopen** PowerShell.  
4. Check:

```powershell
node -v
npm -v
```

Both should print version numbers.

## 3. Confirm the project folder is on the hard drive

1. Put/copy the LUMC folder on the laptop, e.g.:

`D:\CAPSTONE\La Union Medical Center`

2. Open it. You should see `backend`, `src`, `package.json`, `docs`.  
3. Do **not** run the app only from a USB stick for the demo — copy it to `D:\` or `C:\`.

## 4. Install PHP packages (Composer)

```powershell
cd "D:\CAPSTONE\La Union Medical Center"
```

If the folder `backend\vendor` is missing or empty:

```powershell
& "C:\xampp\php\php.exe" tools\composer.phar install --working-dir=backend --no-dev --optimize-autoloader
```

Wait until it finishes. If `tools\composer.phar` is missing, install Composer from https://getcomposer.org and run `composer install` inside `backend` instead.

## 5. Create the database in phpMyAdmin

1. In XAMPP Control Panel, Apache + MySQL must be **Running**.  
2. Click **Admin** next to MySQL (opens phpMyAdmin), or open http://localhost/phpmyadmin  
3. Login if asked: user `root`, password **blank** (XAMPP default).  
4. Click **Databases** / **New**.  
5. Name: `lumc`  
6. Collation: `utf8mb4_unicode_ci` (or any utf8mb4).  
7. Click **Create**.

## 6. Create and edit `.env`

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
copy .env.example .env
```

Open `backend\.env` with Notepad. Set:

```env
APP_NAME="LUMC"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://127.0.0.1
FRONTEND_URL=http://127.0.0.1
LOG_LEVEL=error
APP_TIMEZONE=Asia/Manila

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumc
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=127.0.0.1,localhost

BACKUP_MYSQLDUMP_PATH=C:/xampp/mysql/bin/mysqldump.exe
BACKUP_OFFSITE_PATH=
BACKUP_TIME=02:00
```

Save the file.

**If you set a MySQL root password in XAMPP**, put it in `DB_PASSWORD=`.

## 7. Generate key, create tables, create admin only

Still in PowerShell:

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\xampp\php\php.exe" artisan key:generate
& "C:\xampp\php\php.exe" artisan migrate --force
& "C:\xampp\php\php.exe" artisan db:seed --class=ProductionBootstrapSeeder --force
```

**Do not run** `migrate:fresh --seed` (that loads demo staff/patients).

Temporary login after this: **`admin` / `12345678`**

## 8. Build the website screens

```powershell
cd "D:\CAPSTONE\La Union Medical Center"
npm ci
```

If that fails:

```powershell
npm install
```

Then:

```powershell
$env:VITE_API_BASE_URL="/api"
npm run build
```

Check that this folder has files:

`D:\CAPSTONE\La Union Medical Center\backend\public\spa`

## 9. Point XAMPP Apache at LUMC

### 9a. Enable rewrite

1. Open `C:\xampp\apache\conf\httpd.conf` in Notepad.  
2. Find this line (search for `rewrite`):

```apache
#LoadModule rewrite_module modules/mod_rewrite.so
```

3. Remove the `#` at the start so it becomes:

```apache
LoadModule rewrite_module modules/mod_rewrite.so
```

4. Save.

### 9b. Add a virtual host

1. Open `C:\xampp\apache\conf\extra\httpd-vhosts.conf` in Notepad.  
2. Add at the bottom:

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

Use **forward slashes** `/`. Change the path if your project is elsewhere.

3. In `httpd.conf`, make sure this line is **not** commented:

```apache
Include conf/extra/httpd-vhosts.conf
```

### 9c. Windows hosts file

1. Notepad → **Run as administrator**.  
2. Open `C:\Windows\System32\drivers\etc\hosts` (All files).  
3. Add:

```text
127.0.0.1   lumc.local
```

4. Save.

### 9d. Match `.env` to lumc.local

Edit `backend\.env`:

```env
APP_URL=http://lumc.local
FRONTEND_URL=http://lumc.local
SANCTUM_STATEFUL_DOMAINS=lumc.local,127.0.0.1,localhost
```

### 9e. Restart Apache and cache Laravel

1. XAMPP Control Panel → **Stop** Apache → **Start** Apache.  
2. Then:

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\xampp\php\php.exe" artisan config:clear
& "C:\xampp\php\php.exe" artisan config:cache
& "C:\xampp\php\php.exe" artisan route:cache
& "C:\xampp\php\php.exe" artisan optimize
```

## 10. Test on the laptop

1. Browser → **http://lumc.local**  
2. Login: `admin` / `12345678`  
3. Change the admin password (**My Profile**).  
4. Confirm you see dashboard / beds / empty patients.  

**Home setup is done.** Leave XAMPP + project on the laptop. Bring charger. You do **not** need the client WiFi for Part 1.

### Home checklist

- [ ] XAMPP Apache + MySQL running  
- [ ] PHP 8.3+ (`C:\xampp\php\php.exe -v`)  
- [ ] Node works  
- [ ] Database `lumc` created  
- [ ] migrate + ProductionBootstrapSeeder done  
- [ ] `npm run build` done  
- [ ] http://lumc.local login works  
- [ ] Admin password changed  

---

# PART 2 — At the client (their WiFi)

Do this only after Part 1 works at home.

## 11. Connect and keep the laptop awake

1. Connect to the **client WiFi**.  
2. Plug in power.  
3. Windows **Settings → System → Power** → set sleep to **Never** (while plugged in).  
4. Open **XAMPP Control Panel** → Start **Apache** + **MySQL** (green/Running).

## 12. Get this laptop’s IP on their WiFi

PowerShell:

```powershell
ipconfig
```

Under the WiFi adapter, copy **IPv4 Address**, e.g. `192.168.1.45`.

## 13. Point the app at that IP

Edit `backend\.env`:

```env
APP_URL=http://192.168.1.45
FRONTEND_URL=http://192.168.1.45
SANCTUM_STATEFUL_DOMAINS=192.168.1.45,lumc.local,127.0.0.1,localhost
```

(Use **your** IP, not the example.)

Recache:

```powershell
cd "D:\CAPSTONE\La Union Medical Center\backend"
& "C:\xampp\php\php.exe" artisan config:clear
& "C:\xampp\php\php.exe" artisan config:cache
& "C:\xampp\php\php.exe" artisan route:cache
& "C:\xampp\php\php.exe" artisan optimize
```

## 14. Allow firewall access

1. Windows Security → Firewall → Allow an app.  
2. Allow **Apache HTTP Server** / `httpd.exe` on **Private** networks  
   (path often `C:\xampp\apache\bin\httpd.exe`),  
   **or** allow inbound **TCP port 80**.

## 15. Test

1. On the **laptop**: open `http://192.168.1.45` → login works.  
2. On **another PC** (same WiFi): open `http://192.168.1.45` → login works.  
3. Give them the admin login you set (or create staff users first).

### Client checklist

- [ ] On client WiFi; sleep off; XAMPP running  
- [ ] IP noted and put in `.env`  
- [ ] Caches rebuilt  
- [ ] Firewall allows Apache / port 80  
- [ ] Other PC can open `http://YOUR-IP`  

---

# XAMPP troubleshooting (quick)

| Problem | What to try |
| --- | --- |
| Apache won’t start (port 80 busy) | Stop Skype/IIS, or in `httpd.conf` change `Listen 80` to `Listen 8080`, then use `http://lumc.local:8080` and put `:8080` in `APP_URL` |
| MySQL won’t start | Another MySQL/WAMP may be running — stop it |
| PHP too old | Reinstall XAMPP with PHP 8.3+ |
| `lumc.local` won’t open | hosts file + vhost + Apache restart |
| Other PCs can’t connect | Same WiFi? Guest network isolation? Firewall? IP changed after reconnect? |
| Login API errors after changing IP | `.env` URLs must match browser address; recache config |

More detail: [`DEPLOY.md`](DEPLOY.md) troubleshooting section (same ideas; swap WAMP paths for `C:\xampp\...`).

---

# Commands you must not run on a live/demo DB you want to keep

```powershell
php artisan migrate:fresh --seed
php artisan db:seed
```

Those load **demo** users and patients.  
Empty + admin only:

```powershell
& "C:\xampp\php\php.exe" artisan migrate --force
& "C:\xampp\php\php.exe" artisan db:seed --class=ProductionBootstrapSeeder --force
```
