<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

/*
| Production SPA: Vite builds into public/spa.
| Dev: use Vite on :5173 and artisan serve for /api.
*/
Route::get('/{any?}', function (?string $any = null) {
    $spa = public_path('spa/index.html');
    if (File::exists($spa)) {
        return response()->file($spa);
    }

    return response(
        'LUMC API is running. For local development open the Vite app (http://127.0.0.1:5173). '.
        'For production, build the frontend into public/spa (see docs/DEPLOY.md).',
        200,
        ['Content-Type' => 'text/plain; charset=UTF-8']
    );
})->where('any', '^(?!api).*$');
