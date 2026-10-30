<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Guardian extends Model
{
    protected $fillable = [
        'full_name',
        'relationship',
        'contact_number',
        'id_type',
        'id_number',
        'address',
    ];

    public function link(string $type, int $id): void
    {
        DB::table('guardianables')->insertOrIgnore([
            'guardian_id' => $this->id,
            'guardianable_type' => $type,
            'guardianable_id' => $id,
            'is_primary' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
