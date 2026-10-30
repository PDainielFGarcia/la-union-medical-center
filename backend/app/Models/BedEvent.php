<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BedEvent extends Model
{
    protected $fillable = [
        'bed_id',
        'event_type',
        'patient_id',
        'admission_id',
        'performed_by',
        'notes',
    ];

    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function toApiArray(): array
    {
        $this->loadMissing(['bed.ward', 'patient', 'performer']);

        return [
            'id' => $this->id,
            'bed_id' => $this->bed_id,
            'bed_number' => $this->bed?->bed_number,
            'ward' => $this->bed?->ward?->name,
            'event_type' => $this->event_type,
            'patient_name' => $this->patient?->fullName(),
            'performed_by' => $this->performer?->name,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
