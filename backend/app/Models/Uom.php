<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Uom extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'symbol',
        'base_ratio',
    ];

    protected $casts = [
        'base_ratio' => 'decimal:4',
    ];

    /**
     * Get all products using this UOM.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
