<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'setting_key';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = ['setting_key', 'setting_value', 'updated_at'];

    protected function casts(): array
    {
        return [
            'setting_value' => 'json',
            'updated_at' => 'datetime',
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::query()->where('setting_key', $key)->value('setting_value') ?? $default;
    }

    /** Settings that may be stored as {value: "..."} or a plain string. */
    public static function text(string $key, string $default = ''): string
    {
        $value = static::get($key, $default);
        if (is_array($value)) {
            return (string) ($value['value'] ?? $default);
        }

        return is_string($value) && $value !== '' ? $value : $default;
    }
}
