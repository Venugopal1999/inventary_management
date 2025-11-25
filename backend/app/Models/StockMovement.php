<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
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
        'lot_id',
        'qty_delta',
        'uom_id',
        'unit_cost',
        'ref_type',
        'ref_id',
        'note',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'qty_delta' => 'decimal:4',
        'unit_cost' => 'decimal:4',
    ];

    /**
     * Get the product variant that this movement belongs to.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the warehouse that this movement belongs to.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the location that this movement belongs to.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the lot that this movement belongs to.
     */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(InventoryLot::class, 'lot_id');
    }

    /**
     * Get the UOM that this movement belongs to.
     */
    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Get the user who created this movement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include movements for a specific product variant.
     */
    public function scopeForProduct($query, int $productVariantId)
    {
        return $query->where('product_variant_id', $productVariantId);
    }

    /**
     * Scope a query to only include movements for a specific warehouse.
     */
    public function scopeForWarehouse($query, int $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    /**
     * Scope a query to only include movements of a specific type.
     */
    public function scopeOfType($query, string $refType)
    {
        return $query->where('ref_type', $refType);
    }
}
