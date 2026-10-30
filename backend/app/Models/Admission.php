<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Admission extends Model
{
    protected $fillable = [
        'admission_number',
        'patient_id',
        'opd_encounter_id',
        'bed_id',
        'previous_bed_id',
        'priority',
        'reason',
        'status',
        'previous_status',
        'undo_used',
        'admitted_at',
        'discharged_at',
        'admitted_by',
        'discharged_by',
        'discharge_notes',
    ];

    protected function casts(): array
    {
        return [
            'undo_used' => 'boolean',
            'admitted_at' => 'datetime',
            'discharged_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }

    /** Mirrors the rules in AdmissionController::undo() so the UI can show the Undo button. */
    public function canUndo(): bool
    {
        if ($this->undo_used) {
            return false;
        }

        return $this->status === 'discharged'
            || ($this->status === 'admitted' && ($this->previous_bed_id || $this->previous_status === 'waiting_for_bed'));
    }

    public function toApiArray(): array
    {
        $this->loadMissing(['patient', 'bed.ward']);

        return [
            'id' => $this->id,
            'admission_number' => $this->admission_number,
            'patient_id' => $this->patient_id,
            'patient_number' => $this->patient?->patient_id,
            'patient_name' => $this->patient?->fullName(),
            'priority' => $this->priority,
            'reason' => $this->reason,
            'waiting_since' => $this->created_at?->format('g:i A'),
            'bed_id' => $this->bed_id,
            'bed_number' => $this->bed?->bed_number,
            'ward' => $this->bed?->ward?->name,
            'room' => $this->bed?->room,
            'status' => $this->status,
            'undo_used' => (bool) $this->undo_used,
            'can_undo' => $this->canUndo(),
            'admitted_at' => $this->admitted_at?->toIso8601String(),
            'discharged_at' => $this->discharged_at?->toIso8601String(),
            'discharge_notes' => $this->discharge_notes,
        ];
    }
}
