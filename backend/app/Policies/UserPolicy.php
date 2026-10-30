<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'administrator';
    }

    public function create(User $user): bool
    {
        return $user->role === 'administrator';
    }

    public function update(User $user, User $model): bool
    {
        return $user->role === 'administrator' || $user->id === $model->id;
    }
}
