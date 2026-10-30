<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Bed;
use App\Models\BedEvent;
use App\Models\Clinic;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Guardian;
use App\Models\Notification;
use App\Models\OpdEncounter;
use App\Models\Patient;
use App\Models\QueueTicket;
use App\Models\RejectionReason;
use App\Models\TriageRecord;
use App\Models\User;
use App\Models\Visitor;
use App\Support\NameNormalizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Extra demo volume for presentations: users, patients, queues, visitors in mixed states.
 * Password for every filler account: 12345678
 */
class DemoFillerSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('12345678');
        $opdId = User::query()->where('login', 'opd')->value('id');
        $nurseId = User::query()->where('login', 'nurse')->value('id');
        $guardId = User::query()->where('login', 'guard')->value('id');
        $weekdays = ['mon' => true, 'tue' => true, 'wed' => true, 'thu' => true, 'fri' => true, 'sat' => false, 'sun' => false];

        // --- Extra staff / doctors (all are system users) ---
        $extraUsers = [
            ['Liza', 'Mae', 'Cruz', 'opd2', 'opd_staff', null, '09170001001', null, null],
            ['Mark', 'Anthony', 'Villanueva', 'nurse2', 'nursing_staff', null, '09170001002', null, null],
            ['Paolo', null, 'Mendoza', 'guard2', 'security_guard', null, '09170001003', null, null],
            ['Diana', 'Rose', 'Torres', 'dr.torres', 'doctor', null, '09170001004', 'NEP', 'Nephrology'],
            ['Eric', null, 'Navarro', 'dr.navarro', 'doctor', null, '09170001005', 'CAR', 'Cardiology'],
            ['Grace', 'Ann', 'Flores', 'dr.flores', 'doctor', null, '09170001006', 'DIA', 'Diabetology'],
            ['Hugo', null, 'Ramos', 'dr.ramos', 'doctor', null, '09170001007', 'OB', 'Obstetrics & Gynecology'],
        ];

        foreach ($extraUsers as [$first, $middle, $last, $login, $role, $deptCode, $contact, $clinicCode, $specialty]) {
            if (User::query()->where('login', $login)->exists()) {
                continue;
            }
            $user = new User([
                'login' => $login,
                'contact_number' => $contact,
                'password' => $password,
                'role' => $role,
                'department_id' => $deptCode ? Department::query()->where('code', $deptCode)->value('id') : null,
                'status' => 'active',
            ]);
            $user->applyNormalizedNames($first, $middle, $last);
            $user->save();

            if ($role === 'doctor' && $clinicCode) {
                $clinicId = Clinic::query()->where('code', $clinicCode)->value('id');
                Doctor::query()->create([
                    'user_id' => $user->id,
                    'name' => 'Dr. '.$user->name,
                    'specialty' => $specialty ?? '',
                    'primary_clinic_id' => $clinicId,
                    'schedule' => 'Mon–Fri 8:00–17:00',
                    'status' => in_array($login, ['dr.navarro'], true) ? 'unavailable' : 'available',
                    'is_on_duty' => ! in_array($login, ['dr.navarro'], true),
                    'weekly_json' => $weekdays,
                ]);
            }
        }

        $doctorsByClinic = Doctor::query()->with('primaryClinic')->get()->keyBy(fn (Doctor $d) => $d->primaryClinic?->code);

        // --- Outpatient / mixed patients ---
        $patientRows = [
            ['LUMC-0010', 'Santos', 'Maria', 'Clara', '1988-03-14', 'Female', 'San Fernando City', '09171110001', false],
            ['LUMC-0011', 'Reyes', 'Jose', 'Antonio', '1975-07-22', 'Male', 'Bauang', '09171110002', false],
            ['LUMC-0012', 'Cruz', 'Ana', 'Marie', '1992-01-09', 'Female', 'Agoo', '09171110003', false],
            ['LUMC-0013', 'Bautista', 'Pedro', 'Luis', '1968-11-30', 'Male', 'Naguilian', '09171110004', false],
            ['LUMC-0014', 'Lim', 'Sofia', 'Grace', '2001-05-18', 'Female', 'Rosario', '09171110005', false],
            ['LUMC-0015', 'Tan', 'Kevin', 'James', '2014-09-02', 'Male', 'San Juan', '09171110006', true], // minor
            ['LUMC-0016', 'Ocampo', 'Liza', 'Joy', '1983-12-25', 'Female', 'Tubao', '09171110007', false],
            ['LUMC-0017', 'Fernandez', 'Marco', 'Paul', '1995-04-11', 'Male', 'Caba', '09171110008', false],
            ['LUMC-0018', 'Gutierrez', 'Irene', 'Mae', '1979-08-07', 'Female', 'Aringay', '09171110009', false],
            ['LUMC-0019', 'Villanueva', 'Carlo', 'Miguel', '1990-02-28', 'Male', 'Santo Tomas', '09171110010', false],
            ['LUMC-0020', 'Domingo', 'Patricia', 'Ann', '1986-06-15', 'Female', 'Bangar', '09171110011', false],
            ['LUMC-0021', 'Aquino', 'Ramon', 'Jose', '1959-10-03', 'Male', 'Luna', '09171110012', false],
            ['LUMC-0022', 'Mercado', 'Helena', 'Rose', '1998-07-19', 'Female', 'Burgos', '09171110013', false],
            ['LUMC-0023', 'Santiago', 'Diego', 'Rafael', '2016-01-21', 'Male', 'Bagulin', '09171110014', true], // minor
            ['LUMC-0024', 'Castillo', 'Bea', 'Nicole', '1993-09-08', 'Female', 'Sudipen', '09171110015', false],
        ];

        $patients = [];
        foreach ($patientRows as $row) {
            [$pid, $last, $first, $middle, $birthday, $sex, $address, $contact, $isMinor] = $row;
            if (Patient::query()->where('patient_id', $pid)->exists()) {
                $patients[$pid] = Patient::query()->where('patient_id', $pid)->first();
                continue;
            }
            $patient = Patient::query()->create([
                'patient_id' => $pid,
                'last_name' => NameNormalizer::personName($last),
                'first_name' => NameNormalizer::personName($first),
                'middle_name' => NameNormalizer::personName($middle),
                'birthday' => $birthday,
                'sex' => $sex,
                'complete_address' => $address.', La Union',
                'contact_number' => $contact,
                'civil_status' => $sex === 'Female' ? 'Married' : 'Single',
                'nationality' => 'Filipino',
                'philhealth_number' => '12-'.substr($contact, -9).'-1',
                'status' => 'active',
            ]);
            if ($isMinor) {
                $g = Guardian::query()->create([
                    'full_name' => NameNormalizer::personName($last === 'Tan' ? 'Carmen Tan' : 'Rosa Santiago'),
                    'relationship' => 'Mother',
                    'contact_number' => '0918'.substr($contact, -7),
                ]);
                $g->link('patient', $patient->id);
            }
            $patients[$pid] = $patient;
        }

        // --- Today's hospital visits / queues across clinics ---
        $queuePlan = [
            // clinic code, patient id, status, reason, screening positives
            ['MED', 'LUMC-0010', 'waiting', 'Hypertension follow-up', ['cough' => false, 'fever' => false, 'body_aches' => true]],
            ['MED', 'LUMC-0011', 'called', 'Diabetes check', ['fever' => false, 'cough' => true]],
            ['MED', 'LUMC-0012', 'serving', 'Chest discomfort', ['difficulty_breathing' => true, 'body_aches' => true]],
            ['MED', 'LUMC-0013', 'completed', 'Lab results review', []],
            ['PED', 'LUMC-0015', 'waiting', 'Fever and cough', ['fever' => true, 'cough' => true, 'runny_nose' => true]],
            ['PED', 'LUMC-0023', 'called', 'Well-child visit', []],
            ['NEP', 'LUMC-0016', 'waiting', 'Kidney follow-up', ['body_aches' => true]],
            ['NEP', 'LUMC-0017', 'serving', 'Creatinine check', []],
            ['CAR', 'LUMC-0018', 'waiting', 'ECG follow-up', []],
            ['DIA', 'LUMC-0019', 'waiting', 'Blood sugar monitoring', []],
            ['DIA', 'LUMC-0020', 'completed', 'Diet counseling', []],
            ['OB', 'LUMC-0022', 'waiting', 'Prenatal checkup', []],
            ['ENT', 'LUMC-0024', 'called', 'Ear pain', ['sore_throat' => true]],
            ['SUR', 'LUMC-0021', 'waiting', 'Wound follow-up', []],
        ];

        $clinicCounters = [];
        foreach ($queuePlan as $i => [$clinicCode, $patientId, $status, $reason, $symptoms]) {
            $clinic = Clinic::query()->where('code', $clinicCode)->first();
            $patient = $patients[$patientId] ?? Patient::query()->where('patient_id', $patientId)->first();
            if (! $clinic || ! $patient) {
                continue;
            }

            $clinicCounters[$clinicCode] = ($clinicCounters[$clinicCode] ?? 0) + 1;
            $n = $clinicCounters[$clinicCode];
            $queueNumber = $clinicCode.'-'.str_pad((string) $n, 3, '0', STR_PAD_LEFT);

            $encounter = OpdEncounter::query()->create([
                'encounter_number' => 'ENC-'.now()->format('Ymd').'-'.str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'patient_id' => $patient->id,
                'clinic_id' => $clinic->id,
                'registration_type' => 'existing',
                'chief_complaint' => $reason,
                'status' => in_array($status, ['serving', 'completed'], true) ? ($status === 'completed' ? 'completed' : 'with_doctor') : 'triaged',
                'registered_by' => $opdId,
                'seen_by_doctor_at' => in_array($status, ['serving', 'completed'], true) ? now()->subMinutes(20 - $i) : null,
            ]);

            $symptomPayload = collect(TriageRecord::SYMPTOMS)->mapWithKeys(fn ($s) => [$s => (bool) ($symptoms[$s] ?? false)])->all();
            TriageRecord::query()->create($symptomPayload + [
                'opd_encounter_id' => $encounter->id,
                'nurse_user_id' => $nurseId,
                'symptom_duration' => ! empty($symptoms) ? '2 days' : null,
                'covid_exposure' => false,
                'notes' => 'Demo screening for '.$reason,
                'screened_at' => now()->subMinutes(40 - $i),
            ]);

            $doctor = $doctorsByClinic->get($clinicCode);
            QueueTicket::query()->create([
                'queue_number' => $queueNumber,
                'queue_date' => today(),
                'opd_encounter_id' => $encounter->id,
                'clinic_id' => $clinic->id,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor?->id,
                'patient_name' => $patient->fullName(),
                'status' => $status,
                'called_at' => in_array($status, ['called', 'serving', 'completed'], true) ? now()->subMinutes(15) : null,
                'served_at' => in_array($status, ['serving', 'completed'], true) ? now()->subMinutes(8) : null,
                'completed_at' => $status === 'completed' ? now()->subMinutes(3) : null,
                'created_at' => now()->subMinutes(50 - $i),
                'updated_at' => now(),
            ]);
        }

        // Past (yesterday) completed visit for history on a record
        $pastClinic = Clinic::query()->where('code', 'MED')->first();
        $pastPatient = $patients['LUMC-0010'];
        if ($pastClinic && $pastPatient && ! OpdEncounter::query()->where('encounter_number', 'ENC-PAST-0010')->exists()) {
            $pastEnc = OpdEncounter::query()->create([
                'encounter_number' => 'ENC-PAST-0010',
                'patient_id' => $pastPatient->id,
                'clinic_id' => $pastClinic->id,
                'registration_type' => 'existing',
                'chief_complaint' => 'Previous check-up',
                'status' => 'completed',
                'registered_by' => $opdId,
                'seen_by_doctor_at' => now()->subDay(),
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ]);
            TriageRecord::query()->create([
                'opd_encounter_id' => $pastEnc->id,
                'nurse_user_id' => $nurseId,
                'cough' => true,
                'notes' => 'Prior visit screening',
                'screened_at' => now()->subDay(),
            ]);
            QueueTicket::query()->create([
                'queue_number' => 'MED-901',
                'queue_date' => today()->subDay(),
                'opd_encounter_id' => $pastEnc->id,
                'clinic_id' => $pastClinic->id,
                'patient_id' => $pastPatient->id,
                'patient_name' => $pastPatient->fullName(),
                'status' => 'completed',
                'completed_at' => now()->subDay(),
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ]);
        }

        // --- Extra admissions: waiting for bed + one more occupied ---
        $waitPatient = $patients['LUMC-0014'];
        if ($waitPatient && ! Admission::query()->where('patient_id', $waitPatient->id)->whereIn('status', ['admitted', 'waiting_for_bed'])->exists()) {
            Admission::query()->create([
                'admission_number' => 'ADM'.now()->format('ymd').'-010',
                'patient_id' => $waitPatient->id,
                'bed_id' => null,
                'priority' => 'High',
                'reason' => 'Awaiting ward bed',
                'status' => 'waiting_for_bed',
                'admitted_at' => now()->subHour(),
                'admitted_by' => $opdId,
            ]);
        }

        $extraBed = Bed::query()->where('bed_number', 'MW1-W-01')->where('status', 'available')->first();
        $admitPatient = $patients['LUMC-0020'];
        if ($extraBed && $admitPatient && ! Admission::query()->where('patient_id', $admitPatient->id)->where('status', 'admitted')->exists()) {
            $admission = Admission::query()->create([
                'admission_number' => 'ADM'.now()->format('ymd').'-011',
                'patient_id' => $admitPatient->id,
                'bed_id' => $extraBed->id,
                'priority' => 'Normal',
                'reason' => 'Observation',
                'status' => 'admitted',
                'admitted_at' => now()->subHours(2),
                'admitted_by' => $opdId,
            ]);
            $extraBed->update(['status' => 'occupied', 'current_patient_id' => $admitPatient->id]);
            BedEvent::query()->create([
                'bed_id' => $extraBed->id,
                'event_type' => 'assign',
                'patient_id' => $admitPatient->id,
                'admission_id' => $admission->id,
                'performed_by' => $opdId,
                'notes' => 'Demo filler admission',
            ]);
        }

        // One bed in cleaning for realism
        Bed::query()->where('bed_number', 'MW2-W-01')->where('status', 'available')
            ->update(['status' => 'cleaning']);

        // --- Visitors in various states ---
        $acct = Department::query()->where('code', 'ACCT')->first();
        $bill = Department::query()->where('code', 'BILL')->first();
        $hr = Department::query()->where('code', 'HR')->first();
        $pharm = Department::query()->where('code', 'PHARM')->first();
        $rejectReason = RejectionReason::query()->where('code', 'incorrect_info')->first();
        $secAcct = User::query()->where('login', 'secretary.accounting')->first();
        $secBill = User::query()->where('login', 'secretary.billing')->first();

        $visitorDefs = [
            // first, middle, last, age, dept, purpose, status, reviewer, person
            ['Lara', 'Mae', 'Villar', 28, $acct, 'Billing inquiry', 'pending_approval', null, 'Juan Dela Cruz'],
            ['Ben', 'Jose', 'Ortega', 34, $acct, 'Official Business', 'pending_approval', null, 'Accounting staff'],
            ['Cathy', 'Ann', 'Perez', 41, $bill, 'Payment arrangement', 'approved', $secBill, 'Cashier'],
            ['Dan', null, 'Rivera', 22, $hr, 'Job inquiry', 'inside', User::query()->where('login', 'secretary.hr')->first(), 'HR Desk'],
            ['Eva', 'Marie', 'Soriano', 55, $pharm, 'Medicine pickup', 'completed', User::query()->where('login', 'secretary.pharmacy')->first(), 'Pharmacist'],
            ['Frank', 'Luis', 'Nolasco', 30, $bill, 'Claim follow-up', 'rejected', $secBill, 'Billing clerk'],
            ['Gina', 'Rose', 'Alonzo', 19, $acct, 'Document request', 'cancelled', null, 'Records liaison'],
        ];

        $pass = 0;
        foreach ($visitorDefs as $def) {
            [$first, $middle, $last, $age, $dept, $purpose, $status, $reviewer, $person] = $def;
            if (! $dept) {
                continue;
            }
            $pass++;
            $passId = 'V'.now()->format('ymd').'-'.str_pad((string) (100 + $pass), 3, '0', STR_PAD_LEFT);
            if (Visitor::query()->where('pass_id', $passId)->exists()) {
                continue;
            }
            $full = NameNormalizer::fullName(
                NameNormalizer::personName($first),
                $middle ? NameNormalizer::personName($middle) : null,
                NameNormalizer::personName($last),
            );
            $data = [
                'pass_id' => $passId,
                'first_name' => NameNormalizer::personName($first),
                'middle_name' => $middle ? NameNormalizer::personName($middle) : NameNormalizer::personName('N'),
                'last_name' => NameNormalizer::personName($last),
                'full_name' => $full,
                'age' => $age,
                'address' => 'San Fernando City, La Union',
                'contact_number' => '09172'.str_pad((string) (10000 + $pass), 6, '0', STR_PAD_LEFT),
                'id_type' => 'National ID',
                'id_number' => 'ID-'.str_pad((string) $pass, 6, '0', STR_PAD_LEFT),
                'purpose' => $purpose,
                'visit_type' => 'office',
                'department_id' => $dept->id,
                'person_to_visit' => $person,
                'visit_date' => today(),
                'status' => $status,
                'registered_by' => $guardId,
            ];

            if (in_array($status, ['approved', 'inside', 'completed', 'rejected'], true) && $reviewer) {
                $data['reviewed_by'] = $reviewer->id;
                $data['reviewed_at'] = now()->subMinutes(30);
            }
            if ($status === 'rejected') {
                $data['rejection_reason_id'] = $rejectReason?->id;
                $data['rejection_notes'] = 'Demo rejection — incomplete documents';
            }
            if (in_array($status, ['approved', 'inside', 'completed'], true)) {
                $data['qr_token'] = bin2hex(random_bytes(24));
                $data['qr_generated_at'] = now()->subMinutes(25);
                $data['qr_expires_at'] = now()->endOfDay();
            }
            if (in_array($status, ['inside', 'completed'], true)) {
                $data['entry_scanned_at'] = now()->subMinutes(20);
            }
            if ($status === 'completed') {
                $data['exit_scanned_at'] = now()->subMinutes(5);
            }

            Visitor::query()->create($data);
        }

        // Patient visit — pending/approved style for admitted Juan
        $juan = Patient::query()->where('patient_id', 'LUMC-0001')->first();
        $juanAdmission = $juan
            ? Admission::query()->with('bed')->where('patient_id', $juan->id)->where('status', 'admitted')->first()
            : null;
        if ($juanAdmission) {
            $passId = 'V'.now()->format('ymd').'-201';
            if (! Visitor::query()->where('pass_id', $passId)->exists()) {
                Visitor::query()->create([
                    'pass_id' => $passId,
                    'first_name' => 'Nora',
                    'middle_name' => 'Cruz',
                    'last_name' => 'Dela Cruz',
                    'full_name' => 'Nora Cruz Dela Cruz',
                    'age' => 45,
                    'address' => 'San Fernando City, La Union',
                    'contact_number' => '09172345678',
                    'id_type' => 'Driver\'s License',
                    'id_number' => 'N04-12-345678',
                    'purpose' => 'Visit relative',
                    'visit_type' => 'patient',
                    'department_id' => null,
                    'person_to_visit' => $juan->fullName(),
                    'admission_id' => $juanAdmission->id,
                    'patient_id' => $juan->id,
                    'ward_id' => $juanAdmission->bed?->ward_id,
                    'visit_location' => 'Medical Ward No. 1 · Private Room 1 · MW1-PR-01',
                    'visit_date' => today(),
                    'status' => 'inside',
                    'registered_by' => $guardId,
                    'reviewed_by' => $guardId,
                    'reviewed_at' => now()->subHour(),
                    'qr_token' => bin2hex(random_bytes(24)),
                    'qr_generated_at' => now()->subHour(),
                    'qr_expires_at' => now()->endOfDay(),
                    'entry_scanned_at' => now()->subMinutes(40),
                ]);
            }
        }

        // Sample notifications for the demo
        Notification::query()->create([
            'role' => 'department_secretary',
            'title' => 'Visitor waiting for approval',
            'body' => 'Lara Mae Villar is pending at Accounting.',
            'link' => '/visitor-approvals',
        ]);
        Notification::query()->create([
            'role' => 'nursing_staff',
            'title' => 'New hospital visit',
            'body' => 'MED-001 and other clinic queues have waiting patients today.',
            'link' => '/screening',
        ]);
        Notification::query()->create([
            'role' => 'doctor',
            'title' => 'Clinic queue activity',
            'body' => 'Patients are waiting in Internal Medicine and Pediatrics.',
            'link' => '/clinic-queues',
        ]);
        Notification::query()->create([
            'user_id' => $opdId,
            'title' => 'Waiting for bed',
            'body' => 'Sofia Grace Lim is waiting for a ward bed.',
            'link' => '/bed-assignment',
        ]);
    }
}
