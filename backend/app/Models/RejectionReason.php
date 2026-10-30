<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RejectionReason extends Model
{
    protected $fillable = [
        'code',
        'label',
        'applies_to',
        'allows_custom_text',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'allows_custom_text' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
