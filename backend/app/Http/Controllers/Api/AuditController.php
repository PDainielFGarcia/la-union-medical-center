<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->latest('id');
        if ($request->user()->role === 'security_guard') {
            $query->where(fn ($q) => $q->where('action', 'like', 'Visitor%')->orWhere('action', 'like', 'Vehicle%'));
        }
        if ($request->filled('action') && $request->query('action') !== 'all') {
            $query->where('action', $request->query('action'));
        }
        if ($request->filled('role') && $request->query('role') !== 'all') {
            $query->where('role', $request->query('role'));
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->query('date'));
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('user_name', 'like', "%{$q}%")
                    ->orWhere('record_label', 'like', "%{$q}%")
                    ->orWhere('details', 'like', "%{$q}%")
                    ->orWhere('action', 'like', "%{$q}%");
            });
        }

        $items = $query->limit(200)->get()->map(fn (AuditLog $log) => [
            'id' => $log->id,
            'user_id' => $log->user_id,
            'user_name' => $log->user_name,
            'role' => $log->role,
            'action' => $log->action,
            'record' => $log->record_label,
            'record_label' => $log->record_label,
            'status' => $log->status,
            'details' => $log->details,
            'created_at' => $log->created_at?->toIso8601String(),
            'timestamp' => $log->created_at?->toIso8601String(),
        ]);

        return ApiResponse::data($items->values());
    }
}
