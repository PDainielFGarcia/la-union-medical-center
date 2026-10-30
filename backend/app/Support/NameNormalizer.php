<?php

namespace App\Support;

final class NameNormalizer
{
    /** Capitalize the first letter of each whitespace-separated word. */
    public static function personName(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim(preg_replace('/\s+/', ' ', $value) ?? '');
        if ($trimmed === '') {
            return '';
        }

        return collect(explode(' ', mb_strtolower($trimmed)))
            ->map(fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)).mb_substr($part, 1))
            ->implode(' ');
    }

    public static function fullName(string $first, ?string $middle, string $last): string
    {
        $parts = array_filter([
            self::personName($first),
            self::personName($middle),
            self::personName($last),
        ], fn ($p) => $p !== null && $p !== '');

        return implode(' ', $parts);
    }
}
