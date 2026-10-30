<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Bed;
use App\Models\BedEvent;
use App\Models\Clinic;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Guardian;
use App\Models\Patient;
use App\Models\User;
use App\Support\NameNormalizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Full demo database for local UAT / client demos.
 * For a live hospital with no demo data, use ProductionBootstrapSeeder instead.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CatalogSeeder::class);
        $this->seedDemoUsers();
        $this->seedDemoDoctors();
        $this->seedDemoInpatients();
        $this->call(DemoFillerSeeder::class);
    }

    private function seedDemoUsers(): void
    {
        $password = Hash::make('12345678');

        $offices = [
            ['CEO Office / Administrative Office', 'ADMIN', 'secretary.admin'],
            ['Property & Supply', 'PSU', 'secretary.property'],
            ['Budget Office', 'BUDGET', 'secretary.budget'],
            ['Human Resource', 'HR', 'secretary.hr'],
            ['Accounting', 'ACCT', 'secretary.accounting'],
            ['Medical Records', 'MRD', 'secretary.records'],
            ['Social Service', 'MSS', 'secretary.social'],
            ['X-ray Desk', 'XRAY', 'secretary.xray'],
            ['Nursing Office', 'NSO', 'secretary.nursing'],
            ['Pharmacy', 'PHARM', 'secretary.pharmacy'],
            ['PhilHealth', 'PHIC', 'secretary.philhealth'],
            ['Billing', 'BILL', 'secretary.billing'],
        ];

        $departments = Department::query()->get()->keyBy('code');

        // first, middle, last, login, role, dept, contact
        $users = [
            ['System', null, 'Administrator', 'admin', 'administrator', null, '09170000001'],
            ['Security', null, 'Guard', 'guard', 'security_guard', null, '09170000002'],
            ['Opd', 'Admission', 'Staff', 'opd', 'opd_staff', null, '09170000003'],
            ['Nursing', null, 'Staff', 'nurse', 'nursing_staff', null, '09170000004'],
            ['Ana', null, 'Reyes', 'dr.reyes', 'doctor', null, '09170000005'],
            ['Carlo', null, 'Santos', 'dr.santos', 'doctor', null, '09170000099'],
        ];
        $secContact = 6;
        foreach ($offices as [$name, $code, $login]) {
            $users[] = [explode(' ', $name)[0], 'Office', 'Secretary', $login, 'department_secretary', $code, '0917'.str_pad((string) ($secContact++), 7, '0', STR_PAD_LEFT)];
        }

        foreach ($users as [$first, $middle, $last, $login, $role, $deptCode, $contact]) {
            if (User::query()->where('login', $login)->exists()) {
                continue;
            }

            $user = new User([
                'login' => $login,
                'contact_number' => $contact,
                'password' => $password,
                'role' => $role,
                'department_id' => $deptCode ? $departments[$deptCode]->id : null,
                'status' => 'active',
            ]);
            $user->applyNormalizedNames($first, $middle, $last);
            $user->save();

            if ($role === 'department_secretary' && $deptCode) {
                $departments[$deptCode]->update(['secretary_user_id' => $user->id]);
            }
        }
    }

    private function seedDemoDoctors(): void
    {
        $weekdays = ['mon' => true, 'tue' => true, 'wed' => true, 'thu' => true, 'fri' => true, 'sat' => false, 'sun' => false];

        $pairs = [
            ['dr.reyes', 'Dr. Ana Reyes', 'Internal Medicine', 'MED', 'Mon–Fri 8:00–12:00'],
            ['dr.santos', 'Dr. Carlo Santos', 'Pediatrics', 'PED', 'Mon–Fri 13:00–17:00'],
        ];

        foreach ($pairs as [$login, $name, $specialty, $clinicCode, $schedule]) {
            $userId = User::query()->where('login', $login)->value('id');
            if (! $userId || Doctor::query()->where('user_id', $userId)->exists()) {
                continue;
            }

            Doctor::query()->create([
                'user_id' => $userId,
                'name' => $name,
                'specialty' => $specialty,
                'primary_clinic_id' => Clinic::query()->where('code', $clinicCode)->value('id'),
                'schedule' => $schedule,
                'status' => 'available',
                'is_on_duty' => true,
                'weekly_json' => $weekdays,
            ]);
        }
    }

    /** A few admitted patients so patient visits can be tested right away. */
    private function seedDemoInpatients(): void
    {
        if (Patient::query()->where('patient_id', 'LUMC-0001')->exists()) {
            return;
        }

        $admittedBy = User::query()->where('login', 'opd')->value('id');
        $demo = [
            ['LUMC-0001', 'Dela Cruz', 'Juan', 'Santos', '1990-05-12', 'Male', 'San Fernando City, La Union', '09171234501', 'MW1-PR-01', null],
            ['LUMC-0002', 'Lopez', 'Miguel', 'Reyes', '2019-08-03', 'Male', 'Bauang, La Union', '09171234502', 'PED-W-02', [
                'full_name' => 'Rosa Lopez', 'relationship' => 'Mother', 'contact_number' => '09181234502',
            ]],
            ['LUMC-0003', 'Garcia', 'Elena', 'Cruz', '1996-11-20', 'Female', 'Agoo, La Union', '09171234503', 'OB-W-03', null],
        ];

        foreach ($demo as $i => [$pid, $last, $first, $middle, $birthday, $sex, $address, $contact, $bedNumber, $guardian]) {
            $patient = Patient::query()->create([
                'patient_id' => $pid,
                'last_name' => NameNormalizer::personName($last),
                'first_name' => NameNormalizer::personName($first),
                'middle_name' => NameNormalizer::personName($middle),
                'birthday' => $birthday,
                'sex' => $sex,
                'complete_address' => $address,
                'contact_number' => $contact,
                'nationality' => 'Filipino',
                'status' => 'active',
            ]);

            if ($guardian) {
                $g = Guardian::query()->create([
                    'full_name' => NameNormalizer::personName($guardian['full_name']),
                    'relationship' => $guardian['relationship'],
                    'contact_number' => $guardian['contact_number'],
                ]);
                $g->link('patient', $patient->id);
            }

            $bed = Bed::query()->where('bed_number', $bedNumber)->firstOrFail();
            $admission = Admission::query()->create([
                'admission_number' => 'ADM'.now()->format('ymd').'-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                'patient_id' => $patient->id,
                'bed_id' => $bed->id,
                'priority' => 'Normal',
                'reason' => 'Demo admission',
                'status' => 'admitted',
                'admitted_at' => now(),
                'admitted_by' => $admittedBy,
            ]);
            $bed->update(['status' => 'occupied', 'current_patient_id' => $patient->id]);
            BedEvent::query()->create([
                'bed_id' => $bed->id,
                'event_type' => 'assign',
                'patient_id' => $patient->id,
                'admission_id' => $admission->id,
                'performed_by' => $admittedBy,
                'notes' => 'Demo admission',
            ]);
        }
    }
}
