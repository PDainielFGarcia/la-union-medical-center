<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bed extends Model
{
    protected $fillable = [
        'bed_number',
        'ward_id',
        'room',
        'room_type',
        'status',
        'current_patient_id',
        'reserved_for',
    ];

    public function ward(): BelongsTo
    {
        return $this->belongsTo(Ward::class);
    }

    public function currentPatient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'current_patient_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(BedEvent::class);
    }

    public function toApiArray(): array
    {
        $this->loadMissing(['ward', 'currentPatient']);

        return [
            'id' => $this->id,
            'bed_number' => $this->bed_number,
            'ward_id' => $this->ward_id,
            'ward' => $this->ward?->name,
            'room' => $this->room,
            'room_type' => $this->room_type,
            'type' => ucfirst($this->room_type),
            'status' => $this->status,
            'current_patient_id' => $this->current_patient_id,
            'patient_name' => $this->currentPatient?->fullName(),
            'patient_number' => $this->currentPatient?->patient_id,
            'reserved_for' => $this->reserved_for,
        ];
    }
}
