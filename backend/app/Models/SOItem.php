<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SOItem extends Model
{
    use HasFactory;

    protected $table = 'so_items';

    protected $fillable = [
        'sales_order_id',
        'product_variant_id',
        'uom_id',
        'ordered_qty',
        'allocated_qty',
        'shipped_qty',
        'unit_price',
        'line_total',
        'notes',
    ];

    protected $casts = [
        'ordered_qty' => 'decimal:4',
        'allocated_qty' => 'decimal:4',
        'shipped_qty' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'line_total' => 'decimal:4',
    ];

    /**
     * Get the sales order that owns this item
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * Get the product variant
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the unit of measure
     */
    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Get all stock reservations for this item
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(StockReservation::class, 'sales_order_item_id');
    }

    /**
     * Get remaining quantity to allocate
     */
    public function getRemainingToAllocateAttribute(): float
    {
        return $this->ordered_qty - $this->allocated_qty;
    }

    /**
     * Get remaining quantity to ship
     */
    public function getRemainingToShipAttribute(): float
    {
        return $this->allocated_qty - $this->shipped_qty;
    }

    /**
     * Check if item is fully allocated
     */
    public function isFullyAllocated(): bool
    {
        return $this->allocated_qty >= $this->ordered_qty;
    }

    /**
     * Check if item is fully shipped
     */
    public function isFullyShipped(): bool
    {
        return $this->shipped_qty >= $this->ordered_qty;
    }

    /**
     * Calculate line total
     */
    public function calculateLineTotal(): void
    {
        $this->line_total = $this->ordered_qty * $this->unit_price;
        $this->save();
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            // Automatically calculate line total when saving
            $item->line_total = $item->ordered_qty * $item->unit_price;
        });

        static::saved(function ($item) {
            // Update sales order totals when item is saved
            if ($item->salesOrder) {
                $item->salesOrder->calculateTotals();
            }
        });

        static::deleted(function ($item) {
            // Update sales order totals when item is deleted
            if ($item->salesOrder) {
                $item->salesOrder->calculateTotals();
            }
        });
    }
}
