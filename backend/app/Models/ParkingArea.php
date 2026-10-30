<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParkingArea extends Model
{
    protected $fillable = ['name', 'code', 'capacity', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function toApiArray(): array
    {
        $parked = $this->vehicles()->where('status', 'parked')->count();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'capacity' => $this->capacity,
            'is_active' => $this->is_active,
            'parked' => $parked,
            'available' => $this->capacity !== null ? max(0, $this->capacity - $parked) : null,
        ];
    }
}
