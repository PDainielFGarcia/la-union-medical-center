<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Vehicle;
use App\Models\Visitor;
use App\Services\ActivityLogger;
use App\Services\ParkingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function __construct(private ParkingService $parking, private ActivityLogger $log) {}

    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::query()->with(['parkingArea', 'visitor', 'patient'])->latest('id');
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('parking_area_id')) {
            $query->where('parking_area_id', $request->query('parking_area_id'));
        }
        if ($request->filled('date')) {
            $query->whereDate('entry_time', $request->query('date'));
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('plate_number', 'like', "%{$q}%")
                    ->orWhere('owner', 'like', "%{$q}%")
                    ->orWhere('vehicle_number', 'like', "%{$q}%");
            });
        }

        return ApiResponse::data($query->limit(500)->get()->map->toApiArray()->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plate_number' => ['required', 'string', 'max:30'],
            'type' => ['nullable', 'string', 'max:40'],
            'color' => ['nullable', 'string', 'max:40'],
            'owner' => ['nullable', 'string', 'max:160'],
            'owner_type' => ['required', 'in:visitor,patient,employee,other'],
            'visitor_id' => ['nullable', 'exists:visitors,id'],
            'patient_id' => ['nullable', 'exists:patients,id'],
            'parking_area_id' => ['required', 'exists:parking_areas,id'],
            'slot_number' => ['nullable', 'string', 'max:20'],
        ]);

        $plate = strtoupper(trim($data['plate_number']));
        if (Vehicle::query()->where('plate_number', $plate)->where('status', 'parked')->exists()) {
            return ApiResponse::message("{$plate} is already recorded as parked.", 409);
        }

        $owner = $data['owner'] ?? null;
        if (! $owner && ! empty($data['visitor_id'])) {
            $owner = Visitor::query()->find($data['visitor_id'])?->full_name;
        }
        if (! $owner && ! empty($data['patient_id'])) {
            $owner = Patient::query()->find($data['patient_id'])?->fullName();
        }

        $vehicle = $this->parking->park(
            $data,
            $data['owner_type'],
            $owner,
            $request->user(),
            $data['visitor_id'] ?? null,
            $data['patient_id'] ?? null,
        );
        $this->log->audit($request->user(), 'Vehicle Parked', "{$vehicle->plate_number}", $vehicle->parkingArea?->name ?? '');

        return ApiResponse::data($vehicle->fresh()->toApiArray(), 201);
    }

    public function exit(Request $request, Vehicle $vehicle): JsonResponse
    {
        if ($vehicle->status !== 'parked') {
            return ApiResponse::message('Vehicle already exited.', 422);
        }

        $vehicle->update(['status' => 'exited', 'exit_time' => now()]);
        $this->log->audit($request->user(), 'Vehicle Exited', $vehicle->plate_number);

        return ApiResponse::data($vehicle->fresh()->toApiArray());
    }
}
