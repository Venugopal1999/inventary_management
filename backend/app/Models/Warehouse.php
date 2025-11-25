<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'address_json',
        'is_active',
    ];

    protected $casts = [
        'address_json' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the locations for this warehouse.
     */
    public function locations()
    {
        return $this->hasMany(Location::class);
    }
}
