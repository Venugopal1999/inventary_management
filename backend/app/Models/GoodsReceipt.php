<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * GoodsReceipt Model - Placeholder for Week 4
 * This model will be fully implemented in Week 4 (Receiving & GRN)
 */
class GoodsReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'received_at',
        'received_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'received_at' => 'datetime',
    ];

    /**
     * Get the purchase order for this receipt
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the user who received the goods
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Get all items in this goods receipt
     */
    public function items(): HasMany
    {
        return $this->hasMany(GRNItem::class);
    }
}
