<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\BedEvent;
use App\Models\Ward;
use App\Services\ActivityLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BedController extends Controller
{
    public function __construct(private ActivityLogger $log) {}

    public function index(Request $request): JsonResponse
    {
        $query = Bed::query()->with(['ward', 'currentPatient'])->orderBy('ward_id')->orderBy('id');

        if ($request->filled('ward') && $request->query('ward') !== 'all') {
            $ward = $request->query('ward');
            $query->whereHas('ward', fn ($q) => $q->where('name', $ward)->orWhere('code', $ward));
        }
        if ($request->filled('ward_id')) {
            $query->where('ward_id', $request->query('ward_id'));
        }
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('room_type') && $request->query('room_type') !== 'all') {
            $query->where('room_type', $request->query('room_type'));
        }

        return ApiResponse::data($query->get()->map->toApiArray()->values());
    }

    public function wards(): JsonResponse
    {
        $wards = Ward::query()->with(['beds.currentPatient'])->orderBy('sort_order')->get()->map(function (Ward $ward) {
            $beds = $ward->beds;
            $total = $beds->count();
            $occupied = $beds->where('status', 'occupied')->count();

            return [
                'id' => $ward->id,
                'name' => $ward->name,
                'code' => $ward->code,
                'total' => $total,
                'available' => $beds->where('status', 'available')->count(),
                'occupied' => $occupied,
                'reserved' => $beds->where('status', 'reserved')->count(),
                'unavailable' => $beds->whereIn('status', ['cleaning', 'maintenance', 'unavailable'])->count(),
                'occupancy' => $total ? (int) round(($occupied / $total) * 100) : 0,
                'by_room_type' => $beds->groupBy('room_type')->map(fn ($group, $type) => [
                    'room_type' => $type,
                    'total' => $group->count(),
                    'available' => $group->where('status', 'available')->count(),
                ])->values(),
                'beds' => $beds->map->toApiArray()->values(),
            ];
        });

        return ApiResponse::data($wards->values());
    }

    public function reserve(Request $request, Bed $bed): JsonResponse
    {
        $data = $request->validate([
            'reserved_for' => ['required', 'string', 'max:160'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        if ($bed->status !== 'available') {
            return ApiResponse::message('Bed is not available for reservation.', 422);
        }

        $bed->update(['status' => 'reserved', 'reserved_for' => $data['reserved_for']]);
        $this->event($request, $bed, 'reserve', $data['notes'] ?? "Reserved for {$data['reserved_for']}");

        return ApiResponse::data($bed->fresh()->toApiArray());
    }

    public function updateStatus(Request $request, Bed $bed): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:available,cleaning,maintenance,unavailable'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        if ($bed->status === 'occupied') {
            return ApiResponse::message('Occupied beds are released by discharging or transferring the patient.', 422);
        }

        $bed->update(['status' => $data['status'], 'reserved_for' => null, 'current_patient_id' => null]);
        $this->event($request, $bed, $data['status'], $data['notes'] ?? null);

        return ApiResponse::data($bed->fresh()->toApiArray());
    }

    public function events(Request $request): JsonResponse
    {
        $query = BedEvent::query()->with(['bed.ward', 'patient', 'performer'])->latest('id');
        if ($request->filled('bed_id')) {
            $query->where('bed_id', $request->query('bed_id'));
        }
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->query('patient_id'));
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->query('date'));
        }

        return ApiResponse::data($query->limit(300)->get()->map->toApiArray()->values());
    }

    private function event(Request $request, Bed $bed, string $type, ?string $notes): void
    {
        BedEvent::query()->create([
            'bed_id' => $bed->id,
            'event_type' => $type,
            'performed_by' => $request->user()->id,
            'notes' => $notes,
        ]);
        $this->log->audit($request->user(), 'Bed '.ucfirst($type), $bed->bed_number, $notes ?? '');
    }
}
