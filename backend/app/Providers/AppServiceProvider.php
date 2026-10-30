<?php

namespace App\Providers;

use App\Models\QueueTicket;
use App\Models\User;
use App\Models\Visitor;
use App\Policies\UserPolicy;
use App\Policies\VisitorPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // MySQL utf8mb4 + older InnoDB key limit (WAMP).
        Schema::defaultStringLength(191);

        Route::bind('queue', fn (string $value) => QueueTicket::query()->findOrFail($value));
        Gate::policy(Visitor::class, VisitorPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
