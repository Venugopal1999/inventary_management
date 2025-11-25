<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'so_item_id',
        'product_variant_id',
        'lot_id',
        'location_id',
        'shipped_qty',
        'uom_id',
        'unit_cost_fifo_snap',
        'picked_at',
        'notes',
    ];

    protected $casts = [
        'shipped_qty' => 'decimal:2',
        'unit_cost_fifo_snap' => 'decimal:4',
        'picked_at' => 'datetime',
    ];

    /**
     * Get the shipment.
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    /**
     * Get the sales order item.
     */
    public function soItem(): BelongsTo
    {
        return $this->belongsTo(SoItem::class);
    }

    /**
     * Get the product variant.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the inventory lot.
     */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(InventoryLot::class);
    }

    /**
     * Get the location.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the unit of measure.
     */
    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Get the total cost for this shipment item.
     */
    public function getTotalCostAttribute(): float
    {
        return (float) ($this->shipped_qty * $this->unit_cost_fifo_snap);
    }
}
