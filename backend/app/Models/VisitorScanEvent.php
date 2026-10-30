<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorScanEvent extends Model
{
    protected $fillable = [
        'visitor_id',
        'scan_type',
        'scanned_by',
        'result',
        'rejection_reason_id',
        'rejection_notes',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'scanned_at' => 'datetime',
        ];
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }
}
