<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Visitor extends Model
{
    protected $fillable = [
        'pass_id',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'age',
        'address',
        'contact_number',
        'id_type',
        'id_number',
        'purpose',
        'visit_type',
        'department_id',
        'person_to_visit',
        'admission_id',
        'patient_id',
        'ward_id',
        'visit_location',
        'visit_date',
        'status',
        'registered_by',
        'reviewed_by',
        'reviewed_at',
        'review_remarks',
        'rejection_reason_id',
        'rejection_notes',
        'qr_token',
        'qr_generated_at',
        'qr_expires_at',
        'entry_scanned_at',
        'exit_scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date',
            'reviewed_at' => 'datetime',
            'qr_generated_at' => 'datetime',
            'qr_expires_at' => 'datetime',
            'entry_scanned_at' => 'datetime',
            'exit_scanned_at' => 'datetime',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function ward(): BelongsTo
    {
        return $this->belongsTo(Ward::class);
    }

    public function rejectionReason(): BelongsTo
    {
        return $this->belongsTo(RejectionReason::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scanEvents(): HasMany
    {
        return $this->hasMany(VisitorScanEvent::class);
    }

    public function vehicle(): HasOne
    {
        return $this->hasOne(Vehicle::class)->latestOfMany();
    }
}
