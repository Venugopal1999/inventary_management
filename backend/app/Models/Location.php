<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'warehouse_id',
        'code',
        'type',
        'is_pickable',
    ];

    protected $casts = [
        'is_pickable' => 'boolean',
    ];

    /**
     * Get the warehouse that owns this location.
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
