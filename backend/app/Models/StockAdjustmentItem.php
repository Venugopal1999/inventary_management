<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustmentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_adjustment_id',
        'product_variant_id',
        'location_id',
        'lot_id',
        'uom_id',
        'qty_delta',
        'unit_cost',
        'note',
    ];

    protected $casts = [
        'qty_delta' => 'decimal:2',
        'unit_cost' => 'decimal:4',
    ];

    /**
     * Get the stock adjustment.
     */
    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class);
    }

    /**
     * Get the product variant.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the location.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the inventory lot.
     */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(InventoryLot::class);
    }

    /**
     * Get the unit of measure.
     */
    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Check if this is a positive adjustment (found stock).
     */
    public function isPositiveAdjustment(): bool
    {
        return $this->qty_delta > 0;
    }

    /**
     * Check if this is a negative adjustment (loss/damage).
     */
    public function isNegativeAdjustment(): bool
    {
        return $this->qty_delta < 0;
    }
}
