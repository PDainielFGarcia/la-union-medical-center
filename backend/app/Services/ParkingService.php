<?php

namespace App\Services;

use App\Models\User;
use App\Models\Vehicle;

class ParkingService
{
    public const RULES = [
        'vehicle.plate_number' => ['nullable', 'string', 'max:30'],
        'vehicle.type' => ['nullable', 'string', 'max:40'],
        'vehicle.color' => ['nullable', 'string', 'max:40'],
        'vehicle.parking_area_id' => ['nullable', 'exists:parking_areas,id'],
        'vehicle.slot_number' => ['nullable', 'string', 'max:20'],
    ];

    public function park(array $data, string $ownerType, ?string $owner, ?User $recordedBy, ?int $visitorId = null, ?int $patientId = null): Vehicle
    {
        $prefix = 'VEH'.now()->format('ymd').'-';
        $count = Vehicle::query()->where('vehicle_number', 'like', $prefix.'%')->count() + 1;

        return Vehicle::query()->create([
            'vehicle_number' => $prefix.str_pad((string) $count, 3, '0', STR_PAD_LEFT),
            'plate_number' => strtoupper(trim($data['plate_number'])),
            'type' => $data['type'] ?? null,
            'color' => $data['color'] ?? null,
            'owner' => $owner,
            'owner_type' => $ownerType,
            'visitor_id' => $visitorId,
            'patient_id' => $patientId,
            'parking_area_id' => $data['parking_area_id'] ?? null,
            'slot_number' => $data['slot_number'] ?? null,
            'entry_time' => now(),
            'status' => 'parked',
            'recorded_by' => $recordedBy?->id,
        ]);
    }
}
