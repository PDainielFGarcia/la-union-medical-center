# 

# **Patient and Visitor Management System**

# **Workflow, User Guide, and Setup Manual**

Prepared by:   
Abluyon, Justin Russel M.  
Figuracion, Jacob Ezekiel V.  
Francisco, Prince Alfonso C.  
Garcia, Paul Dainiel F.  
Montoya, Karl Justin R.  
Ramos, Paul Benedict  
Sebastian, Ken Adrian  
Supang, John Carlos M.

Prepared For:  
La Union Medical Center (LUMC)

Date:  
Nov 2026

# **TABLE OF CONTENTS**

| Patient and Bed Management System............................................................................ | 1 |
| :---- | ----: |
| **Workflow, User Guide, and Setup Manual.....................................................................** | **1** |
| **TABLE OF CONTENTS.................................................................................................** | **2** |
| **1\. Introduction................................................................................................................** | **5** |
| **2\. System Objectives.......................................................................................................** | **5** |
| **3\. SYSTEM USERS AND ROLES................................................................................** | **5** |
|    • **STAFF USERS...........................................................................................................** | **5** |
|       1\. Security Guard....................................................................................................... | 5 |
|       2\. Office Secretary..................................................................................................... | 6 |
|       3\. OPD and Admission Staff...................................................................................... | 6 |
|       4\. Nursing Staff.......................................................................................................... | 6 |
|       5\. Doctor..................................................................................................................... | 6 |
|       6\. Administrator.......................................................................................................... | 6 |
| **4\. SYSTEM WORKFLOW OVERVIEW.......................................................................** | **6** |
|    General Patient Workflow............................................................................................... | 6 |
|       Step 1 — Patient Registration and Hospital Visit...................................................... | 6 |
|       Step 2 — Initial Screening.......................................................................................... | 7 |
|       Step 3 — Clinic Queue............................................................................................... | 7 |
|       Step 4 — Serve and Done........................................................................................... | 7 |
|       Step 5 — Admission and Bed Assignment.................................................................. | 7 |
|       Step 6 — Transfer or Discharge................................................................................. | 7 |
|    General Visitor Workflow............................................................................................... | 7 |
|       Step 1 — Visitor Registration..................................................................................... | 7 |
|       Step 2 — Approval..................................................................................................... | 7 |
|       Step 3 — QR Pass....................................................................................................... | 8 |
|       Step 4 — Entry and Exit............................................................................................. | 8 |
| **5\. LANDING PAGE OVERVIEW..................................................................................** | **8** |
|    Sign In............................................................................................................................. | 8 |
|    After Login...................................................................................................................... | 8 |
|    Sign Out.......................................................................................................................... | 8 |
|    Common Features (All Roles)......................................................................................... | 8 |
|    My Profile....................................................................................................................... | 9 |
|    Notifications.................................................................................................................... | 9 |
| **6\. USER GUIDE PER ROLE..........................................................................................** | **9** |
| **A. SECURITY GUARD MODULE................................................................................** | **9** |
|    What You Can Do........................................................................................................... | 9 |
|    What You Cannot Do...................................................................................................... | 10 |
|    Workflow......................................................................................................................... | 10 |
|       Step 1 — Register an Office Visitor........................................................................... | 10 |
|       Step 2 — Register a Patient Visitor............................................................................ | 10 |
|       Step 3 — QR Pass and Scanning................................................................................. | 10 |
|       Step 4 — Today's Visitors........................................................................................... | 10 |
|       Step 5 — Vehicles....................................................................................................... | 11 |
| **B. OFFICE SECRETARY MODULE.............................................................................** | **11** |
|    What You Can Do........................................................................................................... | 11 |
|    What You Cannot Do...................................................................................................... | 11 |
|    Workflow......................................................................................................................... | 11 |
|       Step 1 — Approve or Reject a Visitor......................................................................... | 11 |
|       Step 2 — Check Visitor History.................................................................................. | 11 |
| **C. OPD AND ADMISSION STAFF MODULE...............................................................** | **12** |
|    What You Can Do............................................................................................................. | 12 |
|    What You Cannot Do........................................................................................................ | 12 |
|    Workflow........................................................................................................................... | 12 |
|       Step 1 — Register a Patient and Hospital Visit........................................................... | 12 |
|       Step 2 — Check Today's Hospital Visits and Patient Records................................. | 13 |
|       Step 3 — Manage Clinic Queues.............................................................................. | 13 |
|       Step 4 — Open the Public Queue Display................................................................ | 13 |
|       Step 5 — Set Doctor Availability.............................................................................. | 13 |
|       Step 6 — Admit, Transfer, or Discharge a Patient.................................................... | 14 |
|       Step 7 — Check Bed Overview................................................................................. | 14 |
| **D. NURSING STAFF MODULE...................................................................................** | **14** |
|    What You Can Do......................................................................................................... | 14 |
|    What You Cannot Do.................................................................................................... | 14 |
|    Workflow....................................................................................................................... | 14 |
|       Step 1 — Complete Initial Screening........................................................................ | 14 |
|       Step 2 — View Visits and Patient Records............................................................... | 15 |
|       Step 3 — Work the Clinic Queues............................................................................ | 15 |
|       Step 4 — View Beds and Admissions....................................................................... | 15 |
| **E. DOCTOR MODULE.................................................................................................** | **15** |
|    What You Can Do......................................................................................................... | 15 |
|    What You Cannot Do.................................................................................................... | 15 |
|    Workflow....................................................................................................................... | 15 |
|       Step 1 — View Clinic Queues and the Doctor Directory.......................................... | 15 |
|       Step 2 — Act on Tickets in Your Clinic................................................................... | 16 |
|       Step 3 — Set Your Availability................................................................................. | 16 |
|       Step 4 — View Records and Beds............................................................................. | 16 |
| **F. ADMINISTRATOR MODULE..................................................................................** | **16** |
|    What You Can Do......................................................................................................... | 16 |
|    What You Cannot Do / Limits...................................................................................... | 16 |
|    Workflow....................................................................................................................... | 16 |
|       Step 1 — Manage Users and Roles........................................................................... | 16 |
|       Step 2 — Reports and Exports.................................................................................. | 17 |
|       Step 3 — Audit Logs................................................................................................. | 17 |
|       Step 4 — Backups..................................................................................................... | 17 |
|       Step 5 — Parking Areas and Settings....................................................................... | 17 |
| **7\. DASHBOARD STATUS GUIDE..............................................................................** | **17** |
|    PENDING APPROVAL................................................................................................. | 17 |
|    APPROVED................................................................................................................... | 17 |
|    WAITING..................................................................................................................... | 17 |
|    CALLED....................................................................................................................... | 17 |
|    AVAILABLE / UNAVAILABLE.................................................................................. | 17 |
|    BED STATUSES........................................................................................................... | 18 |
| **8\. KEY SYSTEM FEATURES.......................................................................................** | **18** |
|    1\. Role-Based Access Control....................................................................................... | 18 |
|    2\. Visitor Registration and QR Passes........................................................................... | 18 |
|    3\. Clinic Queue Management........................................................................................ | 18 |
|    4\. Public Queue Display................................................................................................ | 18 |
|    5\. Admissions and Bed Management.............................................................................. | 18 |
|    6\. Notifications.............................................................................................................. | 18 |
|    7\. Audit Logs, Reports, and Backups............................................................................. | 18 |
| **9\. SAMPLE PATIENT FLOW.......................................................................................** | **19** |
|    Simplified Workflow Example...................................................................................... | 19 |
| **10\. QUICK REFERENCE: WHO CAN DO WHAT......................................................** | **19** |
| **11\. IMPORTANT NOTES AND REMINDERS............................................................** | **23** |
| **12\. DOCUMENT CONTROL........................................................................................** | **23** |
| **13\. CONCLUSION.........................................................................................................** | **23** |

# 1\. Introduction 

The **LUMC Patient Management** web-application is an administrative hospital system for same-day visitors, hospital visits and clinic queues, admissions and beds, parking, and administration.

This system is not a clinical electronic medical record. It does not store diagnoses, prescriptions, or iHOMIS data. 

The system uses role-based access, so each user only sees the pages and actions that belong to their job. 

This manual serves as a guide for: 

* Understanding how the system works day to day   
* Identifying user roles and what each role can and cannot do   
* Using each role's module properly   
* Following the correct rules for data entry and access 

# 2\. System Objectives 

The LUMC Patient Management system aims to: 

* Register same-day visitors and control entry and exit with QR passes   
* Manage hospital visits and clinic queues in an organized way   
* Track admissions, bed availability, transfers, and discharges   
* Record vehicles and parking use   
* Keep an audit trail of staff actions 

# 3\. SYSTEM USERS AND ROLES 

* ## **STAFF USERS** 

### **1\. Security Guard** 

Registers same-day visitors, approves patient visitors, issues and scans QR passes, and records vehicles. 

### **2\. Office Secretary** 

Approves or rejects office visitors for their own office. 

### **3\. OPD and Admission Staff** 

Registers patients and hospital visits, manages clinic queues and doctor availability, and handles admissions and beds. This one role covers both OPD registration and admissions. 

### **4\. Nursing Staff** 

Completes initial screening for waiting patients, works the clinic queues, and views beds and admissions. 

### 

### **5\. Doctor** 

Handles queue tickets in their assigned clinic, sets their own availability, and views patient records and beds. 

### 

### **6\. Administrator** 

Manages users and roles, reports, audit logs, backups, parking areas, and settings. 

# 

# 4\. SYSTEM WORKFLOW OVERVIEW 

## **General Patient Workflow** 

### **Step 1: Patient Registration and Hospital Visit** 

OPD and Admission Staff search for an existing patient or register a new one. The patient is queued to a clinic, not to a named doctor. 

### 

### **Step 2: Initial Screening** 

Initial screening is captured at registration. Nursing Staff can also screen or update the symptom checklist for waiting patients. 

### **Step 3: Clinic Queue** 

The patient receives a queue number, such as MED-001. Staff call the ticket from the Clinic Queues page. 

### **Step 4: Serve and Done**

The ticket moves from Call to Serve to Done. Each step asks for confirmation, and Undo reverts one step. 

### **Step 5: Admission and Bed Assignment** 

If the patient needs to stay, OPD and Admission Staff admit the patient and assign a bed, or leave the patient on the Waiting for Bed list. 

### 

### **Step 6: Transfer or Discharge** 

OPD and Admission Staff transfer or discharge the patient. The bed is then marked for cleaning. 

## **General Visitor Workflow** 

### **Step 1: Visitor Registration** 

The Security Guard registers a same-day visitor for an office transaction or to visit an admitted patient. 

## **Step 2: Approval** 

Office visits go to the office secretary for approval. Patient visits are approved by the guard right away. 

### **Step 3: QR Pass** 

After approval, the guard gives the visitor a QR pass that is valid for that day only. 

### **Step 4: Entry and Exit** 

The guard scans the pass when the visitor enters and again when the visitor leaves. 

# 

# 5\. LANDING PAGE OVERVIEW 

The Landing Page is the main entry point of the LUMC Patient & Bed Management System. 

## **Sign In** 

1\. Open the LUMC website (hospital URL, or http\://127.0.0.1:5173 for local testing).   
2\. Enter your login (not an email) and password.   
3\. Click Sign in. 

## 

## **After Login** 

\-You land on a home page that depends on your role (for example Guard Dashboard, Visitor Approvals, or Dashboard).   
\-The left sidebar only shows pages your role is allowed to use.   
\-Opening a forbidden page redirects you home and shows a notice that you are not allowed. 

## **Sign Out** 

Use Logout in the lower-left sidebar, near your name and avatar. 

## **Common Features (All Roles)** 

Every account can use My Profile, notifications, and Logout. Everything else depends on the role. See each module's "What You Can Do" and "What You Cannot Do" lists, and the quick reference table in Section 10\. 

### **My Profile** 

Go to Sidebar → My Profile. 

You may update:   
\- First name, middle name (optional), and last name   
\- Contact number (optional; if filled, it must be exactly 11 digits)   
\- Login and password 

You cannot change your role, office, clinic, or account status here. 

### **Notifications** 

\- The bell in the top bar shows the unread count.   
\- The list refreshes every few seconds.   
\- Click a notification to mark it as read and to open the related page (for example Visitor Approvals, Clinic Queues, or Waiting for Bed).   
\- Mark all read clears the unread badge. 

# 

# 6\. USER GUIDE PER ROLE 

## **A. SECURITY GUARD MODULE** 

Typical login: guard  
Home: Guard Dashboard / Security 

### **What You Can Do** 

\- Use Front Desk Routing to send people to the right desk   
\- Register same-day visitors (office or admitted patient)   
\- Approve patient visitors yourself (the patient must already be in a bed)   
\- Issue and scan QR passes (entry and exit); turn away, cancel, or do manual entry and exit on Today's Visitors   
\- Record vehicles (visitor, patient, employee, or other) and mark exit   
\- View Security Logs (visitor and vehicle related) 

### **What You Cannot Do** 

\- Approve or reject office visitors (that is the office secretary's job)   
\- See or manage patients, hospital visits, clinic queues, doctors, or beds   
\- Open administration pages (users, reports, backups, settings, parking areas setup)   
\- Change your own role or another user's account 

### **Workflow** 

#### **Step 1: Register an Office Visitor** 

1\. Go to Visitors → Register Visitor.   
2\. Choose either Office transaction or Visit an admitted patient. Here, choose Office transaction.   
3\. Enter First name and Last name (required). Middle name and contact are optional.   
4\. Enter contact number  
5\. Choose the office, the purpose (or Other and type the purpose), and the ID type if needed.   
6\. Optionally add a vehicle.   
7\. Click Register and Send for Approval. The status becomes Pending approval for that office's secretary. 

#### **Step 2: Register a Patient Visitor** 

1\. Choose Visit an admitted patient.   
2\. Filter by ward, room type, or name, and select the patient.   
3\. Fill in the visitor details, then click Approve Visit and Issue QR. The guard approves immediately.   
4\. Secretaries do not see patient visits. 

#### **Step 3: QR Pass and Scanning** 

1\. After approval (office) or immediate approval (patient), open Give QR Pass / Visitor Pass.   
2\. Print or show the QR to the visitor.   
3\. Open Scan QR Pass. Scan on entry, then again on exit.   
4\. A third scan is refused because the pass is already used. 

#### 

#### **Step 4: Today's Visitors** 

1\. Go to Visitors → Today's Visitors.   
2\. See the waiting, approved, inside, and exited counts.   
3\. Open Details for the full visitor card.   
4\. Use Turn Away (rejection reason optional), Cancel, or manual entry and exit when needed. 

#### **Step 5: Vehicles** 

1\. Go to Parking → Vehicles → Record Vehicle.   
2\. Choose who the vehicle belongs to: Visitor, Patient, Employee, or Other.   
3\. Plate number and parking area are required. 

## **B. OFFICE SECRETARY MODULE** 

Typical logins: secretary.accounting, secretary.billing, and others   
Home: Visitor Approvals 

## 

### **What You Can Do** 

\- See and act on office visitors for your office only (the office linked to your user account)   
\- Approve and issue QR, or Reject (rejection reason optional)   
\- Open the full visitor card before deciding   
\- Browse Visitor History for your office's past visits 

### 

### **What You Cannot Do** 

\- Approve visitors for other offices   
\- See or approve patient visitors (guards handle those)   
\- Register visitors, scan QR, or manage today's gate list   
\- Work with patients, queues, doctors, beds, vehicles, or admin tools 

### **Workflow** 

#### **Step 1: Approve or Reject a Visitor** 

1\. Open Visitor Approvals.   
2\. Click a pending visitor card to open the full visitor information, not just a short list row.   
3\. Click Approve and Issue QR so the guard can print or show the pass. Or click Reject. The reason is optional. 

#### **Step 2: Check Visitor History** 

1\. Open Visitor History to search and filter past office visits. Use Details to expand the information. 

## **C. OPD AND ADMISSION STAFF MODULE** 

Typical login: opd   
Home: Dashboard 

This one role covers both OPD registration and admissions. 

### **What You Can Do** 

\- Use Front Desk Routing; register patients and hospital visits (queued to a clinic, not a named doctor)   
\- Capture initial screening at registration; edit patient information (audited)   
\- View Today's Hospital Visits, Patient Search / Records, Queue Monitor, Clinic Queues, and Queue History   
\- Do queue actions on all clinics: Call, Serve, Done, Skip, Undo, and Cancel   
\- Open the Public Queue Display   
\- Admit, assign a bed, transfer, or discharge; change bed status; view Waiting for Bed and Bed History   
\- View the Doctor List; set any doctor's availability; assign or reassign doctors to clinics   
\- Record vehicles (same as the guard) 

### **What You Cannot Do** 

\- Create doctor user accounts (the administrator does that under Users and Roles; you only assign existing doctor users to clinics)   
\- Approve office or patient visitors, or use guard QR tools   
\- Open administration pages: Users, Reports, Audit Logs, Backups, Parking Areas setup, Settings 

### **Workflow** 

#### **Step 1: Register a Patient and Hospital Visit** 

1\. Go to Patients and Visits → Register and Queue.   
2\. Search for an existing patient, or register a new one. First and last name are required. Middle name and contact are optional.   
3\. Minors need a guardian (relationship dropdown plus Other, and an 11-digit guardian contact).   
4\. On Hospital Visit:   
  \- Select the clinic (full name, for example Nephrology).   
  \- Complete Initial Screening.   
  \- Optionally record a vehicle.   
5\. Submit, then note the queue number (for example MED-001). There is no "print patient" step. 

#### **Step 2: Check Today's Hospital Visits and Patient Records** 

1\. Today's Hospital Visits shows who arrived today, the clinic, whether they were screened (yes or no), and the status.   
2\. Patient Records / Search lets you open a patient to see:   
  \- Current Admission (if any)   
  \- Patient Information (editable)   
  \- Hospital Visits (click a row to expand screening and visit details)   
  \- Admissions History 

#### **Step 3: Manage Clinic Queues ‘**

1\. Go to Queue → Clinic Queues or Queue Monitor.   
2\. Find the patient under their clinic.   
3\. Click Call, then Serve, then Done. Each step asks for confirmation.   
4\. Undo reverts one step (once per ticket), without stopping live updates.   
5\. You may act on all clinics. 

#### **Step 4: Open the Public Queue Display** 

Go to Queue → Public Queue Display (often shown on a TV).   
  \- Live date and time   
  \- Full clinic names  
  \- Queue codes only, with no patient names   
  \- Doctor availability per clinic 

#### **Step 5: Set Doctor Availability** 

1\. Go to Doctors → Availability.   
2\. Toggle Available or Unavailable for any doctor.   
3\. Use Assign Doctor to Clinic to link an unassigned doctor account to a clinic, or reassign one who already has a clinic (specialty optional).   
4\. Doctor accounts are created under Users and Roles (administrator). You do not create free-text doctors here. 

#### **Step 6: Admit, Transfer, or Discharge a Patient** 

1\. Go to Admissions → Admit Patient. Choose a bed now or leave the patient waiting.   
2\. Confirm the assign, transfer, or discharge action. Use Undo once when available.   
3\. The dark Patient info button opens a window. Open Full Record goes to the full patient page.   
4\. Patients without a bed appear under Waiting for Bed. Use Assign Bed when one is free.   
5\. When you discharge a patient, you can add administrative discharge notes. \\

**Step 7: Check Bed Overview**   
1\. Go to Beds and Admissions → Bed Overview.   
2\. Hover over a bed. The highlight should be obvious.   
3\. Nurses and doctors can view beds. Only OPD and the administrator change beds. 

## **D. NURSING STAFF MODULE** 

Typical login: nurse 

### **What You Can Do** 

\- Use the Initial Screening page to screen or update the symptom checklist for waiting patients   
\- View Today's Hospital Visits, Patient Search, and Records   
\- Use Clinic Queues / Queue Monitor: Call, Serve, Done, Skip, Undo on all clinics   
\- View wards, bed overview, admissions, Waiting for Bed, and Bed History (view only) 

### 

### **What You Cannot Do** 

\- Register new patients or create hospital visits   
\- Cancel queue tickets (OPD does that)   
\- Admit, transfer, discharge, or change bed status   
\- Change any doctor's availability or assign doctors to clinics   
\- Use visitor, vehicle, public display, or administration pages 

### **Workflow** 

#### **Step 1: Complete Initial Screening** 

Open Initial Screening, then screen or update the symptom checklist for waiting patients. 

#### **Step 2: View Visits and Patient Records** 

Open Today's Hospital Visits, Patient Search, or Patient Records. 

#### **Step 3: Work the Clinic Queues** 

Open Clinic Queues or Queue Monitor, then use Call, Serve, Done, Skip, and Undo on any clinic. 

#### **Step 4: View Beds and Admissions** 

Open Wards and Patients, Bed Overview, Admissions, Waiting for Bed, or Bed History. These pages are view only. 

## **E. DOCTOR MODULE** 

Typical logins: dr.reyes (Internal Medicine), dr.santos (Pediatrics), and others 

Your account must be assigned to a clinic (by OPD or the administrator) before you can act on queue tickets. 

### **What You Can Do** 

\- View all clinic queues and the doctor directory   
\- Call, Serve, Done, Skip, and Undo only in your assigned clinic   
\- Change only your own Available or Unavailable status   
\- View patient search and records, wards, beds, and admissions (view only) 

### **What You Cannot Do** 

\- Act on tickets in other clinics (the screen shows View only, and the system also blocks it)   
\- Change another doctor's availability or reassign clinics   
\- Register patients, edit patient demographics, or run screening   
\- Admit, transfer, discharge, or change beds   
\- Open public display, vehicles, visitors, or administration 

### **Workflow** 

#### 

#### **Step 1: View Clinic Queues and the Doctor Directory** 

Open Clinic Queues to see all clinics, and the Doctor List to see the directory. 

#### **Step 2: Act on Tickets in Your Clinic** 

Use Call, Serve, Done, Skip, and Undo on tickets in your assigned clinic only. 

#### **Step 3: Set Your Availability** 

Go to Doctors → Availability and set your own status to Available or Unavailable. You can only change your own status. 

#### **Step 4: View Records and Beds** 

Open Patient Search / Records, Wards, Beds, or Admissions. These pages are view only. 

## **F. ADMINISTRATOR MODULE** 

Typical login: admin 

### **What You Can Do** 

\- Everything every other role can do (the sidebar shows all modules)   
\- Users and Roles: create and edit users. A secretary must have an office. A doctor must have a clinic. Logins stay masked. Changing a login or password needs the admin password. The default new password is 12345678\.   
\- Reports and Exports, Audit Logs, Backups, Parking Areas (add and edit lots), and Settings (for example minor age) 

### 

### **What You Cannot Do / Limits** 

\- There is no "higher" role, so you are not blocked from staff pages.   
\- You still follow the same data rules as everyone else: 11-digit contacts when filled, minors need guardians on patients, queues stay clinic-based, and the public display shows codes only.   
\- Prefer creating real role accounts for daily work. Use the admin account mainly for setup, users, and audits. 

### **Workflow** 

#### **Step 1: Manage Users and Roles** 

Open Users and Roles to create or edit users. Remember the office rule for secretaries and the clinic rule for doctors. 

#### **Step 2: Reports and Exports** 

Open Reports and Exports and choose a report date to view the daily patient, visitor, and audit log reports. 

#### **Step 3: Audit Logs** 

Open Audit Logs to see who did what, and when. 

#### **Step 4: Backups** 

Open Backups to review database backups or create one. 

#### **Step 5: Parking Areas and Settings** 

Use Parking Areas to add and edit lots. Use Settings for system values such as minor age. 

# 7\. DASHBOARD STATUS GUIDE

## **PENDING APPROVAL**

Shown on an office visitor who is waiting for the office secretary's decision.

## **APPROVED**

Shown on a visitor whose pass can be issued and scanned.

## **WAITING**

Shown on a hospital visit or queue ticket that has not been called yet.

## **CALLED**

Shown on a queue ticket that has been called and is ready to be served.

## **AVAILABLE / UNAVAILABLE**

Shown on a doctor to say whether the doctor is on duty.

## **BED STATUSES**

Beds on the Bed Overview page appear as Available, Occupied, Reserved, Cleaning, Maintenance, or Unavailable.

# 

# 8\. KEY SYSTEM FEATURES

## **1\. Role-Based Access Control**

Each user only sees and uses the pages that belong to their role. Forbidden pages show a notice and return you to your home page.

## **2\. Visitor Registration and QR Passes**

Same-day visitors are registered, approved, and given a QR pass that is scanned on entry and exit.

## **3\. Clinic Queue Management**

Queues are per clinic. Staff move each ticket through Call, Serve, and Done, with Skip, Undo, and Cancel when needed.

## **4\. Public Queue Display**

A live display shows queue codes only, with no patient names, to protect privacy.

## **5\. Admissions and Bed Management**

Staff admit, transfer, and discharge patients, and track bed availability across wards.

## **6\. Notifications**

A bell in the top bar shows unread items and links to the related page.

## **7\. Audit Logs, Reports, and Backups**

The administrator can review who did what, export daily reports, and keep database backups.

# 

# 9\. SAMPLE PATIENT FLOW

## **Simplified Workflow Example**

1. OPD and Admission Staff register the patient and queue them to a clinic  
2. The patient gets a queue number and initial screening is recorded  
3. Nursing Staff screen or update the symptom checklist if needed  
4. Staff call the ticket, then serve it, then mark it done  
5. If the patient needs to stay, OPD and Admission Staff admit the patient and assign a bed  
6. When the patient is ready to leave, OPD and Admission Staff discharge the patient  
7. The bed is set for cleaning

# 

# 10\. QUICK REFERENCE: WHO CAN DO WHAT

Legend: Yes \= allowed, blank \= not allowed, Own \= limited to own office, clinic, or self

| Task | Guard | Secretary | OPD | Nurse | Doctor | Admin |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Front Desk Routing | Yes |  | Yes |  |  | Yes |
| Register visitors / scan QR / today's visitors | Yes |  |  |  |  | Yes |
| Approve office visitors |  | Own |  |  |  | Yes |
| Approve patient visitors | Yes |  |  |  |  | Yes |
| Visitor history | Yes | Own |  |  |  | Yes |
| Register patient \+ hospital visit (+ screening at registration) |  |  | Yes |  |  | Yes |
| Edit patient information |  |  | Yes |  |  | Yes |
| Initial Screening page (nurse) |  |  |  | Yes |  | Yes |
| View visits / patient search and records |  |  | Yes | Yes | Yes | Yes |
| Queue actions, all clinics |  |  | Yes | Yes |  | Yes |
| Queue actions, own clinic only |  |  |  |  | Own | Yes |
| Cancel queue ticket |  |  | Yes |  |  | Yes |
| Queue history |  |  | Yes |  |  | Yes |
| Public Queue Display |  |  | Yes |  |  | Yes |
| Doctor list |  |  | Yes |  | Yes | Yes |
| Change any doctor availability |  |  | Yes |  |  | Yes |
| Change own availability only |  |  |  |  | Own | Yes |
| Assign / reassign doctor to clinic |  |  | Yes |  |  | Yes |
| Create doctor user account |  |  |  |  |  | Yes |
| Admit / transfer / discharge / bed status |  |  | Yes |  |  | Yes |
| View beds / wards / admissions |  |  | Yes | Yes | Yes | Yes |
| Vehicles | Yes |  | Yes |  |  | Yes |
| Security logs | Yes |  |  |  |  | Yes |
| Users / reports / audit / backups / parking areas / settings |  |  |  |  |  | Yes |

Hard limits (all non-admin roles): the sidebar hides pages you cannot use. Opening a forbidden URL shows a notice and sends you home. Doctors without a clinic assignment cannot run queue actions until OPD or the administrator assigns them.

**Step-by-Step Setup** 

### **Step 1 — Download and Install WampServer**

Download WampServer from:

[https\://www\.wampserver.com/en/](https://www.wampserver.com/en/?utm_source=chatgpt.com)

* Download the 64-bit version.  
* Make sure PHP version **8.3.14 or higher** is installed.  
* Install WampServer.  
* Use the default installation directory:

```
C:\wamp64
```

### **Step 2 — Download and Install Node.js**

Download Node.js from:

[https\://nodejs.org/](https://nodejs.org/?utm_source=chatgpt.com)

* Download the LTS version.  
* Run the installer.  
* Complete the installation.

### **Step 3 — Install Git and Visual Studio Code**

Download and install:

* Git: [https\://git-scm.com/downloads](https://git-scm.com/downloads?utm_source=chatgpt.com)  
* Visual Studio Code: [https\://code.visualstudio.com/](https://code.visualstudio.com/?utm_source=chatgpt.com)

### **Step 4 — Create the Project Folder**

Create a folder where you will store the project:

```
C:\La Union Medical Center
```

Open the folder using Visual Studio Code.

Open the PowerShell terminal:

**Terminal → New Terminal**

### **Step 5 — Clone the GitHub Repository**

Execute:

```
git clone YOUR_GITHUB_REPOSITORY_URL
```

Replace YOUR\_GITHUB\_REPOSITORY\_URL with your group's GitHub repository link.

### **Step 6 — Check PHP Version**

Execute:

```
php -v
```

If PHP is not recognized, locate php.exe inside:

```
C:\wamp64\bin\php\php8.3.xx
```

Execute using the full PHP path:

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" -v
```

### **Step 7 — Check Node.js Version**

Execute:

```
node -v
```

Check npm:

```
npm -v
```

If PowerShell blocks npm, use npm.cmd instead.

### **Step 8 — Navigate to the Backend Directory**

```
cd la-union-medical-center

cd backend
```

### **Step 9 — Install Backend Dependencies**

Execute:

```
composer install --no-dev --optimize-autoloader
```

If Composer encounters an error, navigate back to the project root:

```
cd ..
```

Execute:

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" tools/composer.phar install --working-dir=backend --no-dev --optimize-autoloader
```

### **Step 10 — Create the Database**

Open phpMyAdmin:

```
http://localhost/phpmyadmin
```

Create a new database named:

```
lumc
```

### **Step 11 — Configure the Backend Environment File**

Navigate to the backend directory:

```
cd backend
```

Copy the environment file:

```
copy .env.example .env
```

Open backend/.env in Visual Studio Code.

### **Step 12 — Get the Computer's IPv4 Address**

Open Windows Command Prompt (CMD).

Execute:

```
ipconfig
```

Find the IPv4 Address of your active network connection.

Example:

```
192.168.1.100
```

### **Step 13 — Configure the Backend Environment Variables**

Inside backend/.env, update the following:

**Application URL:**

```
APP_URL=http://YOUR_IPV4_ADDRESS
```

**Frontend URL:**

```
FRONTEND_URL=http://YOUR_IPV4_ADDRESS
```

**Sanctum Domain:**

```
SANCTUM_STATEFUL_DOMAINS=YOUR_IPV4_ADDRESS
```

**Database Configuration:**

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumc
DB_USERNAME=root
DB_PASSWORD=
```

**Optional — Backup Directory:**

If you want to store backups in a preferred location:

```
BACKUP_OFFSITE_PATH="YOUR_PREFERRED_FILE_PATH"
```

Example:

```
BACKUP_OFFSITE_PATH="D:/LUMC_Backups"
```

Save the .env file.

### **Step 14 — Generate the Application Key**

Make sure you are inside the backend directory.

Execute:

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" artisan key:generate
```

### **Step 15 — Run Database Migrations**

Execute:

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" artisan migrate --force
```

### **Step 16 — Run the Production Database Seeder**

Execute:

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" artisan db:seed --class=ProductionBootstrapSeeder --force
```

### **Step 17 — Navigate Back to the Project Root**

Execute:

```
cd ..
```

### **Step 18 — Install Frontend Dependencies**

Execute:

```
npm install
```

If PowerShell blocks npm:

```
npm.cmd install
```

Wait until the installation is completed.

### **Step 19 — Configure the Frontend API URL**

Open or create the root .env file in the main project directory.

Add:

```
VITE_API_BASE_URL=http://YOUR_IPV4_ADDRESS/api
VITE_USE_MOCK=false
```

Replace YOUR\_IPV4\_ADDRESS with your actual IPv4 address.

Save the file.

### **Step 20 — Build the Frontend**

Execute:

```
npm run build
```

If necessary:

```
npm.cmd run build
```

Double-check that the following folder has been created:

```
backend/public/spa
```

### **Step 21 — Configure Apache Virtual Host**

Navigate to the Apache configuration directory:

```
C:\wamp64\bin\apache
```

Open the installed Apache version folder.

Navigate to:

```
conf\extra\httpd-vhosts.conf
```

Add the following configuration at the bottom:

```
<VirtualHost *:80>

    ServerName YOUR_IPV4_ADDRESS

    DocumentRoot "YOUR_PROJECT_FILEPATH/backend/public"

    <Directory "YOUR_PROJECT_FILEPATH/backend/public">

        AllowOverride All

        Require all granted

    </Directory>

</VirtualHost>
```

Replace:

* YOUR\_IPV4\_ADDRESS with your computer's IPv4 address.  
* YOUR\_PROJECT\_FILEPATH with the complete project directory path.

Save the file.

### **Step 22 — Enable Apache Rewrite Module**

Open the WampServer tray menu.

Navigate to:

**Apache → Apache modules → rewrite\_module**

Make sure rewrite\_module is enabled.

### **Step 23 — Restart WampServer**

1. Right-click the WampServer tray icon.  
2. Select **Restart All Services**.  
3. Wait until the WampServer icon turns green.

### **Step 24 — Generate Laravel Production Caches**

Return to Visual Studio Code.

Navigate to the backend directory:

```
cd backend
```

Execute the following commands one at a time:

**Configuration Cache:**

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" artisan config:cache
```

**Route Cache:**

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" artisan route:cache
```

**Application Optimization:**

```
& "C:\wamp64\bin\php\php8.3.xx\php.exe" artisan optimize
```

Wait until all commands finish successfully.

### **Step 25 — Open the LUMC System**

Open your browser.

Enter your computer's IPv4 address:

```
http://YOUR_IPV4_ADDRESS
```

Example:

```
http://192.168.1.100
```

The LUMC login page should now appear.

**Initial Administrator Account:**

```
Username: admin
Password: 12345678
```

# 11\. IMPORTANT NOTES AND REMINDERS

* Login uses a login name, not an email.  
* Contact numbers are optional. If provided, they must be 11 numerical digits.  
* Middle name is optional for patients, visitors, and users.  
* Visitors are the same day only. Visitor minors do not need a guardian.  
* Patients who are minors need a guardian (relationship list plus Other).  
* Queues are per clinic. The public display shows codes only, for privacy.  
* Secretary \= own office only. Doctor \= own clinic for actions. Nurse \= queues yes, beds view only. OPD \= operational staff, not system admin.  
* Screens refresh often. Leave Clinic Queues and the Public Queue Display open for live updates.  
* Forbidden pages show an on-screen notice and return you to your home page.

# 12\. DOCUMENT CONTROL

Product: La Union Medical Center (LUMC) Operations System  
Audience: Hospital staff (all roles)  
Version note: Align with the current feature-freeze build. Update screenshots after major UI changes.

# 13\. CONCLUSION

The LUMC Portal helps hospital staff handle visitors, clinic queues, admissions, beds, and parking in one place, with each user limited to the pages and actions of their role.

By following the workflow for each role and the data rules in this manual, staff can keep queues organized, beds up to date, and records accurate.

