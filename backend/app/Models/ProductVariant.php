<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'sku',
        'attributes_json',
        'barcode',
        'reorder_min',
        'reorder_max',
        'cost',
        'price',
    ];

    protected $casts = [
        'attributes_json' => 'array',
        'reorder_min' => 'decimal:2',
        'reorder_max' => 'decimal:2',
        'cost' => 'decimal:2',
        'price' => 'decimal:2',
    ];

    /**
     * Get the product that owns this variant.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the stock balances for this variant.
     */
    public function stockBalances()
    {
        return $this->hasMany(StockBalance::class);
    }

    /**
     * Get the stock movements for this variant.
     */
    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Get the inventory lots for this variant.
     */
    public function inventoryLots()
    {
        return $this->hasMany(InventoryLot::class);
    }

    /**
     * Get the display name for this variant.
     */
    public function getDisplayNameAttribute(): string
    {
        $name = $this->product->name;

        if ($this->attributes_json) {
            $attrs = collect($this->attributes_json)->map(function ($value, $key) {
                return ucfirst($key) . ': ' . $value;
            })->implode(', ');

            return $name . ' (' . $attrs . ')';
        }

        return $name;
    }
}
