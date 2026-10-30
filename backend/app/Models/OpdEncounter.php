<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OpdEncounter extends Model
{
    protected $fillable = [
        'encounter_number',
        'patient_id',
        'clinic_id',
        'registration_type',
        'chief_complaint',
        'status',
        'registered_by',
        'seen_by_doctor_at',
    ];

    protected function casts(): array
    {
        return [
            'seen_by_doctor_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function triageRecord(): HasOne
    {
        return $this->hasOne(TriageRecord::class);
    }

    public function queueTicket(): HasOne
    {
        return $this->hasOne(QueueTicket::class);
    }
}
