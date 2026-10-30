<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParkingArea;
use App\Services\ActivityLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ParkingAreaController extends Controller
{
    public function __construct(private ActivityLogger $log) {}

    public function index(Request $request): JsonResponse
    {
        $query = ParkingArea::query()->orderBy('name');
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return ApiResponse::data($query->get()->map->toApiArray()->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:parking_areas,name'],
            'code' => ['required', 'string', 'max:20', 'unique:parking_areas,code'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $area = ParkingArea::query()->create($data);
        $this->log->audit($request->user(), 'Parking Area Created', $area->name);

        return ApiResponse::data($area->toApiArray(), 201);
    }

    public function update(Request $request, ParkingArea $parkingArea): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80', Rule::unique('parking_areas', 'name')->ignore($parkingArea->id)],
            'code' => ['sometimes', 'string', 'max:20', Rule::unique('parking_areas', 'code')->ignore($parkingArea->id)],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $parkingArea->update($data);
        $this->log->audit($request->user(), 'Parking Area Updated', $parkingArea->name);

        return ApiResponse::data($parkingArea->fresh()->toApiArray());
    }
}
