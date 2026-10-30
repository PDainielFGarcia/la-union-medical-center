<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    protected $fillable = [
        'vehicle_number',
        'plate_number',
        'type',
        'color',
        'owner',
        'owner_type',
        'visitor_id',
        'patient_id',
        'parking_area_id',
        'slot_number',
        'entry_time',
        'exit_time',
        'status',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'entry_time' => 'datetime',
            'exit_time' => 'datetime',
        ];
    }

    public function parkingArea(): BelongsTo
    {
        return $this->belongsTo(ParkingArea::class);
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function toApiArray(): array
    {
        $this->loadMissing(['parkingArea', 'visitor', 'patient']);

        return [
            'id' => $this->id,
            'vehicle_number' => $this->vehicle_number,
            'plate_number' => $this->plate_number,
            'type' => $this->type,
            'color' => $this->color,
            'owner' => $this->owner,
            'owner_type' => $this->owner_type,
            'visitor_id' => $this->visitor_id,
            'visitor_pass_id' => $this->visitor?->pass_id,
            'patient_id' => $this->patient_id,
            'patient_number' => $this->patient?->patient_id,
            'parking_area_id' => $this->parking_area_id,
            'parking_area' => $this->parkingArea?->name,
            'slot_number' => $this->slot_number,
            'entry_time' => $this->entry_time?->format('g:i A'),
            'exit_time' => $this->exit_time?->format('g:i A'),
            'entry_at' => $this->entry_time?->toIso8601String(),
            'exit_at' => $this->exit_time?->toIso8601String(),
            'status' => $this->status,
        ];
    }
}
