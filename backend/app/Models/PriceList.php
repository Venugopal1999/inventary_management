<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceList extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'currency',
        'tax_inclusive',
        'is_active',
    ];

    protected $casts = [
        'tax_inclusive' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get all items in this price list
     */
    public function items(): HasMany
    {
        return $this->hasMany(PriceListItem::class);
    }

    /**
     * Get all sales orders using this price list
     */
    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }

    /**
     * Scope for active price lists
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get price for a specific product variant
     */
    public function getPriceForVariant($productVariantId)
    {
        $item = $this->items()->where('product_variant_id', $productVariantId)->first();
        return $item ? $item->price : null;
    }
}
