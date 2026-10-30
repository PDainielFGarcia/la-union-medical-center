<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TriageRecord extends Model
{
    public const SYMPTOMS = [
        'cough',
        'fever',
        'runny_nose',
        'vomiting_diarrhea',
        'loss_taste_smell',
        'body_aches',
        'difficulty_breathing',
        'sore_throat',
    ];

    protected $fillable = [
        'opd_encounter_id',
        'nurse_user_id',
        'cough',
        'fever',
        'runny_nose',
        'vomiting_diarrhea',
        'loss_taste_smell',
        'body_aches',
        'difficulty_breathing',
        'sore_throat',
        'symptom_duration',
        'covid_exposure',
        'notes',
        'screened_at',
    ];

    protected function casts(): array
    {
        return [
            'cough' => 'boolean',
            'fever' => 'boolean',
            'runny_nose' => 'boolean',
            'vomiting_diarrhea' => 'boolean',
            'loss_taste_smell' => 'boolean',
            'body_aches' => 'boolean',
            'difficulty_breathing' => 'boolean',
            'sore_throat' => 'boolean',
            'covid_exposure' => 'boolean',
            'screened_at' => 'datetime',
        ];
    }

    public function encounter(): BelongsTo
    {
        return $this->belongsTo(OpdEncounter::class, 'opd_encounter_id');
    }
}
