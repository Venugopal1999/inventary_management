<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shipment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sales_order_id',
        'status',
        'picked_at',
        'packed_at',
        'shipped_at',
        'delivered_at',
        'picked_by',
        'packed_by',
        'shipped_by',
        'carrier',
        'tracking_number',
        'shipping_cost',
        'box_weight',
        'box_dimensions',
        'notes',
    ];

    protected $casts = [
        'picked_at' => 'datetime',
        'packed_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'shipping_cost' => 'decimal:2',
        'box_weight' => 'decimal:2',
        'box_dimensions' => 'array',
    ];

    /**
     * Get the sales order associated with this shipment.
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * Get the shipment items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(ShipmentItem::class);
    }

    /**
     * Get the user who picked this shipment.
     */
    public function picker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'picked_by');
    }

    /**
     * Get the user who packed this shipment.
     */
    public function packer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'packed_by');
    }

    /**
     * Get the user who shipped this shipment.
     */
    public function shipper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    /**
     * Get customer returns for this shipment.
     */
    public function returns(): HasMany
    {
        return $this->hasMany(CustomerReturn::class);
    }

    /**
     * Check if shipment is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if shipment is shipped.
     */
    public function isShipped(): bool
    {
        return in_array($this->status, ['shipped', 'delivered']);
    }

    /**
     * Check if shipment is complete.
     */
    public function isComplete(): bool
    {
        return $this->status === 'delivered';
    }

    /**
     * Check if shipment can be edited.
     */
    public function canEdit(): bool
    {
        return !in_array($this->status, ['shipped', 'delivered', 'cancelled']);
    }
}
