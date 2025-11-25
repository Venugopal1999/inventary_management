<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockCountItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_count_id',
        'product_variant_id',
        'location_id',
        'lot_id',
        'uom_id',
        'expected_qty',
        'counted_qty',
        'variance',
        'variance_percentage',
        'variance_status',
        'notes',
        'counted_at',
    ];

    protected $casts = [
        'expected_qty' => 'decimal:2',
        'counted_qty' => 'decimal:2',
        'variance' => 'decimal:2',
        'variance_percentage' => 'decimal:2',
        'counted_at' => 'datetime',
    ];

    /**
     * Get the stock count.
     */
    public function stockCount(): BelongsTo
    {
        return $this->belongsTo(StockCount::class);
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
     * Calculate variance when counted_qty is set.
     */
    public function calculateVariance(): void
    {
        if ($this->counted_qty === null) {
            $this->variance = null;
            $this->variance_percentage = null;
            $this->variance_status = null;
            return;
        }

        $this->variance = $this->counted_qty - $this->expected_qty;

        if ($this->expected_qty != 0) {
            $this->variance_percentage = ($this->variance / $this->expected_qty) * 100;
        } else {
            $this->variance_percentage = $this->counted_qty > 0 ? 100 : 0;
        }

        // Determine variance status
        if ($this->variance == 0) {
            $this->variance_status = 'match';
        } elseif ($this->variance > 0) {
            $this->variance_status = 'over';
        } elseif ($this->counted_qty == 0) {
            $this->variance_status = 'missing';
        } else {
            $this->variance_status = 'under';
        }
    }

    /**
     * Check if this item has a variance.
     */
    public function hasVariance(): bool
    {
        return $this->variance !== null && $this->variance != 0;
    }
}
