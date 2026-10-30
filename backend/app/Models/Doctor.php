<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Doctor extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'specialty',
        'primary_clinic_id',
        'schedule',
        'weekly_json',
        'status',
        'is_on_duty',
    ];

    protected function casts(): array
    {
        return [
            'weekly_json' => 'array',
            'is_on_duty' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function primaryClinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'primary_clinic_id');
    }
}
