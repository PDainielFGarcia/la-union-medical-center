<?php

namespace Database\Seeders;

use App\Models\Bed;
use App\Models\Clinic;
use App\Models\Department;
use App\Models\ParkingArea;
use App\Models\RejectionReason;
use App\Models\Setting;
use App\Models\Ward;
use Illuminate\Database\Seeder;

/**
 * Baseline reference data only — no staff users, doctors, or patients.
 * Safe for a fresh hospital install (used by ProductionBootstrapSeeder).
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedDepartments();
        $this->seedClinics();
        $this->seedRejectionReasons();
        $this->seedWardsAndBeds();
        $this->seedParkingAreas();
        $this->seedSettings();
    }

    private function seedDepartments(): void
    {
        $offices = [
            ['CEO Office / Administrative Office', 'ADMIN'],
            ['Property & Supply', 'PSU'],
            ['Budget Office', 'BUDGET'],
            ['Human Resource', 'HR'],
            ['Accounting', 'ACCT'],
            ['Medical Records', 'MRD'],
            ['Social Service', 'MSS'],
            ['X-ray Desk', 'XRAY'],
            ['Nursing Office', 'NSO'],
            ['Pharmacy', 'PHARM'],
            ['PhilHealth', 'PHIC'],
            ['Billing', 'BILL'],
        ];

        foreach ($offices as [$name, $code]) {
            Department::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'is_active' => true]
            );
        }
    }

    private function seedClinics(): void
    {
        $clinics = [
            ['Internal Medicine', 'MED'], ['Pediatrics', 'PED'], ['Nephrology', 'NEP'], ['Pulmonology', 'PUL'],
            ['Cardiology', 'CAR'], ['Urology', 'URO'], ['Diabetology', 'DIA'], ['Surgery', 'SUR'],
            ['Orthopedics', 'ORT'], ['Obstetrics & Gynecology', 'OB'], ['Ophthalmology', 'OPH'], ['ENT', 'ENT'],
            ['Dental', 'DEN'], ['YAKAP', 'YAK'], ['ABTC', 'ABT'], ['TB DOTS', 'TBD'],
        ];

        foreach ($clinics as [$name, $code]) {
            Clinic::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'is_active' => true]
            );
        }
    }

    private function seedRejectionReasons(): void
    {
        $reasons = [
            ['invalid_id', 'Invalid ID', 'both'],
            ['expired_id', 'Expired ID', 'both'],
            ['not_approved', 'Visit not approved', 'guard_gate'],
            ['incorrect_info', 'Incorrect visitor information', 'both'],
            ['invalid_qr', 'Invalid/expired QR', 'guard_gate'],
            ['outside_hours', 'Outside visiting hours', 'both'],
            ['unauthorized_area', 'Unauthorized area', 'guard_gate'],
            ['prohibited_item', 'Prohibited item', 'guard_gate'],
            ['guardian_absent', 'Required guardian absent', 'both'],
            ['failed_screening', 'Visitor fails required screening', 'both'],
            ['person_unavailable', 'Person/office to visit unavailable', 'visitor_request'],
            ['other', 'Other', 'both', true],
        ];

        foreach ($reasons as $i => $row) {
            RejectionReason::query()->firstOrCreate(
                ['code' => $row[0]],
                [
                    'label' => $row[1],
                    'applies_to' => $row[2],
                    'allows_custom_text' => $row[3] ?? false,
                    'is_active' => true,
                    'sort_order' => $i + 1,
                ]
            );
        }
    }

    private function seedWardsAndBeds(): void
    {
        // Matches docs/DATABASE.md — 84 beds total.
        $layout = [
            ['Medical Ward No. 1', 'MW1', 8, 8, 0],
            ['Medical Ward No. 2', 'MW2', 0, 6, 6],
            ['Pavilion', 'PAV', 13, 4, 0],
            ['Pedia Ward', 'PED', 5, 5, 0],
            ['Obgyne Ward', 'OB', 4, 15, 0],
            ['ICU', 'ICU', 0, 10, 0],
        ];

        foreach ($layout as $index => [$name, $code, $private, $wardBeds, $charity]) {
            $ward = Ward::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'sort_order' => $index + 1]
            );

            for ($i = 1; $i <= $private; $i++) {
                Bed::query()->firstOrCreate(
                    ['bed_number' => sprintf('%s-PR-%02d', $code, $i)],
                    [
                        'ward_id' => $ward->id,
                        'room' => "Private Room {$i}",
                        'room_type' => 'private',
                        'status' => 'available',
                    ]
                );
            }
            for ($i = 1; $i <= $wardBeds; $i++) {
                Bed::query()->firstOrCreate(
                    ['bed_number' => sprintf('%s-W-%02d', $code, $i)],
                    [
                        'ward_id' => $ward->id,
                        'room' => 'Ward',
                        'room_type' => 'ward',
                        'status' => 'available',
                    ]
                );
            }
            for ($i = 1; $i <= $charity; $i++) {
                Bed::query()->firstOrCreate(
                    ['bed_number' => sprintf('%s-C-%02d', $code, $i)],
                    [
                        'ward_id' => $ward->id,
                        'room' => 'Charity',
                        'room_type' => 'charity',
                        'status' => 'available',
                    ]
                );
            }
        }
    }

    private function seedParkingAreas(): void
    {
        foreach ([['Main Gate Lot', 'MAIN', 40], ['ER Bay', 'ER', 10], ['Staff Lot', 'STAFF', 25]] as [$name, $code, $cap]) {
            ParkingArea::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'capacity' => $cap, 'is_active' => true]
            );
        }
    }

    private function seedSettings(): void
    {
        Setting::query()->firstOrCreate(
            ['setting_key' => 'hospital_name'],
            ['setting_value' => 'La Union Medical Center', 'updated_at' => now()]
        );
        Setting::query()->firstOrCreate(
            ['setting_key' => 'minor_age_threshold'],
            ['setting_value' => ['years' => 18], 'updated_at' => now()]
        );
        Setting::query()->firstOrCreate(
            ['setting_key' => 'backup_retention_days'],
            ['setting_value' => ['days' => 14], 'updated_at' => now()]
        );
    }
}
