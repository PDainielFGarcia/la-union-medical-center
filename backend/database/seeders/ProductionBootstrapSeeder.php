<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\PasswordRules;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Fresh hospital install: catalogs + one Administrator account.
 * No demo staff, doctors, patients, or visits.
 *
 *   php artisan migrate --force
 *   php artisan db:seed --class=ProductionBootstrapSeeder --force
 *
 * Default login: admin / 12345678 — change immediately after first sign-in.
 */
class ProductionBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CatalogSeeder::class);
        $this->seedAdministrator();
    }

    private function seedAdministrator(): void
    {
        if (User::query()->where('login', 'admin')->exists()) {
            $this->command?->warn('Administrator login "admin" already exists — skipped creating another.');

            return;
        }

        $user = new User([
            'login' => 'admin',
            'contact_number' => null,
            'password' => Hash::make(PasswordRules::default()),
            'role' => 'administrator',
            'department_id' => null,
            'status' => 'active',
        ]);
        $user->applyNormalizedNames('System', null, 'Administrator');
        $user->save();

        $this->command?->info('Created administrator: login=admin password='.PasswordRules::default().' (change this after first login).');
    }
}
