<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_item_id',
        'product_variant_id',
        'warehouse_id',
        'location_id',
        'lot_id',
        'qty_reserved',
        'reserved_at',
        'reserved_by',
    ];

    protected $casts = [
        'qty_reserved' => 'decimal:4',
        'reserved_at' => 'datetime',
    ];

    /**
     * Get the SO item that owns this reservation
     */
    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SOItem::class);
    }

    /**
     * Get the product variant
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the location
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the inventory lot
     */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(InventoryLot::class, 'lot_id');
    }

    /**
     * Get the user who reserved this stock
     */
    public function reservedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reserved_by');
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($reservation) {
            if (!$reservation->reserved_at) {
                $reservation->reserved_at = now();
            }
        });
    }
}
