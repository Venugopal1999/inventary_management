<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'sku_policy',
        'category_id',
        'uom_id',
        'barcode',
        'track_serial',
        'track_batch',
        'shelf_life_days',
        'tax_rate',
        'status',
        'image_url',
    ];

    protected $casts = [
        'track_serial' => 'boolean',
        'track_batch' => 'boolean',
        'tax_rate' => 'decimal:2',
    ];

    /**
     * Get the category for this product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the unit of measure for this product.
     */
    public function uom()
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Get the variants for this product.
     */
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Check if product has variants.
     */
    public function hasVariants(): bool
    {
        return $this->sku_policy === 'variant';
    }
}
