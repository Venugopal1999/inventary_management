<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockBalance extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_variant_id',
        'warehouse_id',
        'location_id',
        'qty_on_hand',
        'qty_reserved',
        'qty_available',
        'qty_incoming',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'qty_on_hand' => 'decimal:4',
        'qty_reserved' => 'decimal:4',
        'qty_available' => 'decimal:4',
        'qty_incoming' => 'decimal:4',
    ];

    /**
     * Get the product variant that this balance belongs to.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the warehouse that this balance belongs to.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the location that this balance belongs to.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Scope a query to only include balances with stock on hand.
     */
    public function scopeInStock($query)
    {
        return $query->where('qty_on_hand', '>', 0);
    }

    /**
     * Scope a query to only include balances with available stock.
     */
    public function scopeAvailable($query)
    {
        return $query->where('qty_available', '>', 0);
    }

    /**
     * Scope a query for a specific product.
     */
    public function scopeForProduct($query, int $productVariantId)
    {
        return $query->where('product_variant_id', $productVariantId);
    }

    /**
     * Scope a query for a specific warehouse.
     */
    public function scopeForWarehouse($query, int $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    /**
     * Update the available quantity based on on_hand and reserved.
     */
    public function recalculateAvailable(): void
    {
        $this->qty_available = $this->qty_on_hand - $this->qty_reserved;
        $this->save();
    }

    /**
     * Add to on hand quantity.
     */
    public function addStock(float $quantity): void
    {
        $this->qty_on_hand += $quantity;
        $this->recalculateAvailable();
    }

    /**
     * Remove from on hand quantity.
     */
    public function removeStock(float $quantity): void
    {
        $this->qty_on_hand -= $quantity;
        $this->recalculateAvailable();
    }

    /**
     * Reserve stock for a sales order.
     */
    public function reserveStock(float $quantity): void
    {
        $this->qty_reserved += $quantity;
        $this->recalculateAvailable();
    }

    /**
     * Release reserved stock.
     */
    public function releaseStock(float $quantity): void
    {
        $this->qty_reserved -= $quantity;
        $this->recalculateAvailable();
    }

    /**
     * Check if there's enough available stock.
     */
    public function hasAvailableStock(float $quantity): bool
    {
        return $this->qty_available >= $quantity;
    }
}
