<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueTicket extends Model
{
    protected $table = 'queues';

    protected $fillable = [
        'queue_number',
        'queue_date',
        'opd_encounter_id',
        'clinic_id',
        'patient_id',
        'doctor_id',
        'patient_name',
        'status',
        'previous_status',
        'undo_used',
        'called_at',
        'served_at',
        'completed_at',
        'wait_seconds',
    ];

    protected function casts(): array
    {
        return [
            'queue_date' => 'date',
            'undo_used' => 'boolean',
            'called_at' => 'datetime',
            'served_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function encounter(): BelongsTo
    {
        return $this->belongsTo(OpdEncounter::class, 'opd_encounter_id');
    }
}
