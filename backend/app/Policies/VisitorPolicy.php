<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visitor;
use App\Services\VisitorService;

class VisitorPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['administrator', 'security_guard', 'department_secretary'], true);
    }

    public function view(User $user, Visitor $visitor): bool
    {
        if ($user->role === 'administrator' || $user->role === 'security_guard') {
            return true;
        }

        return $user->role === 'department_secretary'
            && $visitor->visit_type === 'office'
            && $visitor->department_id === $user->department_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['administrator', 'security_guard'], true);
    }

    public function review(User $user, Visitor $visitor): bool
    {
        return app(VisitorService::class)->canReview($user, $visitor);
    }
}
