<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

final class PasswordRules
{
    /** At least 8 chars, must include letters and numbers; symbols allowed. */
    public static function required(): array
    {
        return ['required', 'string', Password::min(8)->letters()->numbers()];
    }

    public static function optional(): array
    {
        return ['nullable', 'string', Password::min(8)->letters()->numbers()];
    }

    public static function default(): string
    {
        return '12345678';
    }
}
