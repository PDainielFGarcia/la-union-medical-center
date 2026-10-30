<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $this->visibleTo($request)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Notification $n) => $n->toApiArray())
            ->values();

        return ApiResponse::data($items);
    }

    public function markRead(Request $request): JsonResponse
    {
        $this->visibleTo($request)->whereNull('read_at')->update(['read_at' => now()]);

        return $this->index($request);
    }

    public function markOneRead(Request $request, Notification $notification): JsonResponse
    {
        if (! $this->visibleTo($request)->whereKey($notification->id)->exists()) {
            return ApiResponse::message('Notification not found.', 404);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return ApiResponse::data($notification->fresh()->toApiArray());
    }

    private function visibleTo(Request $request): Builder
    {
        $user = $request->user();

        if ($user->role === 'administrator') {
            return Notification::query();
        }

        return Notification::query()->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere(fn ($r) => $r->whereNull('user_id')->where('role', $user->role))
                ->orWhere(fn ($r) => $r->whereNull('user_id')->whereNull('role'));
        });
    }
}
