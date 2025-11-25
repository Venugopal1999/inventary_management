<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_return_id',
        'shipment_item_id',
        'product_variant_id',
        'return_qty',
        'uom_id',
        'condition',
        'restockable',
        'refund_unit_price',
        'notes',
    ];

    protected $casts = [
        'return_qty' => 'decimal:2',
        'restockable' => 'boolean',
        'refund_unit_price' => 'decimal:4',
    ];

    /**
     * Get the customer return.
     */
    public function customerReturn(): BelongsTo
    {
        return $this->belongsTo(CustomerReturn::class);
    }

    /**
     * Get the shipment item.
     */
    public function shipmentItem(): BelongsTo
    {
        return $this->belongsTo(ShipmentItem::class);
    }

    /**
     * Get the product variant.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the unit of measure.
     */
    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Get the total refund amount for this item.
     */
    public function getTotalRefundAttribute(): float
    {
        return (float) ($this->return_qty * ($this->refund_unit_price ?? 0));
    }

    /**
     * Check if item can be restocked.
     */
    public function canRestock(): bool
    {
        return $this->restockable && in_array($this->condition, ['new', 'used']);
    }
}
