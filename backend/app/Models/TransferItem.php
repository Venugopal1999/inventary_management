<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_id',
        'product_variant_id',
        'from_location_id',
        'to_location_id',
        'lot_id',
        'uom_id',
        'qty_requested',
        'qty_shipped',
        'qty_received',
        'unit_cost',
        'notes',
    ];

    protected $casts = [
        'qty_requested' => 'decimal:2',
        'qty_shipped' => 'decimal:2',
        'qty_received' => 'decimal:2',
        'unit_cost' => 'decimal:4',
    ];

    /**
     * Get the transfer.
     */
    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }

    /**
     * Get the product variant.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the source location.
     */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    /**
     * Get the destination location.
     */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
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
     * Get remaining quantity to ship.
     */
    public function getRemainingToShipAttribute(): float
    {
        return max(0, $this->qty_requested - $this->qty_shipped);
    }

    /**
     * Get remaining quantity to receive.
     */
    public function getRemainingToReceiveAttribute(): float
    {
        return max(0, $this->qty_shipped - $this->qty_received);
    }
}
