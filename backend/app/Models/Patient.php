<?php

namespace App\Models;

use App\Support\NameNormalizer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Patient extends Model
{
    protected $fillable = [
        'patient_id',
        'last_name',
        'first_name',
        'middle_name',
        'birthday',
        'sex',
        'complete_address',
        'contact_number',
        'civil_status',
        'nationality',
        'religion',
        'philhealth_number',
        'spouse_name',
        'father_name',
        'mother_name',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'birthday' => 'date',
        ];
    }

    public function fullName(): string
    {
        return NameNormalizer::fullName($this->first_name, $this->middle_name, $this->last_name);
    }

    public function guardians()
    {
        return Guardian::query()
            ->join('guardianables', 'guardianables.guardian_id', '=', 'guardians.id')
            ->where('guardianables.guardianable_type', 'patient')
            ->where('guardianables.guardianable_id', $this->id)
            ->select('guardians.*', 'guardianables.is_primary')
            ->get();
    }

    public function hasGuardian(): bool
    {
        return DB::table('guardianables')
            ->where('guardianable_type', 'patient')
            ->where('guardianable_id', $this->id)
            ->exists();
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'patient_number' => $this->patient_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'middle_name' => $this->middle_name,
            'full_name' => $this->fullName(),
            'birthday' => $this->birthday?->toDateString(),
            'date_of_birth' => $this->birthday?->toDateString(),
            'age' => $this->birthday?->age,
            'sex' => $this->sex,
            'gender' => $this->sex,
            'complete_address' => $this->complete_address,
            'address' => $this->complete_address,
            'contact_number' => $this->contact_number,
            'civil_status' => $this->civil_status,
            'nationality' => $this->nationality,
            'religion' => $this->religion,
            'philhealth_number' => $this->philhealth_number,
            'spouse_name' => $this->spouse_name,
            'father_name' => $this->father_name,
            'mother_name' => $this->mother_name,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
