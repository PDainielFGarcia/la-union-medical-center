<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Department;
use App\Models\RejectionReason;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function departments(): JsonResponse
    {
        return ApiResponse::data(Department::query()->where('is_active', true)->orderBy('name')->get());
    }

    public function clinics(): JsonResponse
    {
        return ApiResponse::data(Clinic::query()->where('is_active', true)->orderBy('name')->get());
    }

    public function rejectionReasons(Request $request): JsonResponse
    {
        $query = RejectionReason::query()->where('is_active', true)->orderBy('sort_order');
        if ($request->filled('applies_to') && $request->query('applies_to') !== 'both') {
            $applies = $request->query('applies_to');
            $query->where(function ($q) use ($applies) {
                $q->where('applies_to', $applies)->orWhere('applies_to', 'both');
            });
        }

        return ApiResponse::data($query->get());
    }
}
