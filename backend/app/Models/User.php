<?php

namespace App\Models;

use App\Support\NameNormalizer;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'first_name',
    'middle_name',
    'last_name',
    'name',
    'login',
    'contact_number',
    'email',
    'password',
    'role',
    'department_id',
    'status',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLES = [
        'administrator',
        'security_guard',
        'opd_staff',
        'department_secretary',
        'nursing_staff',
        'doctor',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    public static function composeName(string $first, ?string $middle, string $last): string
    {
        return NameNormalizer::fullName($first, $middle, $last);
    }

    public function applyNormalizedNames(string $first, ?string $middle, string $last): void
    {
        $this->first_name = NameNormalizer::personName($first);
        $this->middle_name = $middle !== null && trim($middle) !== ''
            ? NameNormalizer::personName($middle)
            : null;
        $this->last_name = NameNormalizer::personName($last);
        $this->name = self::composeName($this->first_name, $this->middle_name, $this->last_name);
    }

    public function toApiArray(bool $includeLogin = false): array
    {
        $this->loadMissing(['department', 'doctor.primaryClinic']);

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'name' => $this->name,
            'login' => $includeLogin ? $this->login : null,
            'login_masked' => '••••••••',
            'contact_number' => $this->contact_number,
            'role' => $this->role,
            'department_id' => $this->department_id,
            'department' => $this->department?->name,
            'doctor_id' => $this->doctor?->id,
            'clinic_id' => $this->doctor?->primary_clinic_id,
            'clinic' => $this->doctor?->primaryClinic?->name,
            'specialty' => $this->doctor?->specialty,
            'status' => $this->status,
        ];
    }
}
