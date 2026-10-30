<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Str;

class ActivityLogger
{
    public function audit(?User $user, string $action, string $record, string $details = '', string $status = 'Success'): void
    {
        AuditLog::query()->create([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'role' => $user?->role,
            'action' => $action,
            'record_label' => Str::limit($record, 185),
            'status' => $status,
            'details' => Str::limit($details, 250),
            'created_at' => now(),
        ]);
    }

    public function notifyUser(?int $userId, string $title, string $body, ?string $link = null): void
    {
        Notification::query()->create([
            'user_id' => $userId,
            'title' => $title,
            'body' => Str::limit($body, 250),
            'link' => $link,
        ]);
    }

    public function notifyRole(string $role, string $title, string $body, ?string $link = null): void
    {
        Notification::query()->create([
            'role' => $role,
            'title' => $title,
            'body' => Str::limit($body, 250),
            'link' => $link,
        ]);
    }
}
