<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReplenishmentSuggestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'reorder_rule_id',
        'product_variant_id',
        'warehouse_id',
        'supplier_id',
        'current_qty',
        'min_qty',
        'max_qty',
        'suggested_qty',
        'priority',
        'status',
        'purchase_order_id',
        'ordered_at',
        'dismissed_at',
        'notes',
    ];

    protected $casts = [
        'current_qty' => 'decimal:2',
        'min_qty' => 'decimal:2',
        'max_qty' => 'decimal:2',
        'suggested_qty' => 'decimal:2',
        'ordered_at' => 'datetime',
        'dismissed_at' => 'datetime',
    ];

    /**
     * Get the reorder rule for this suggestion
     */
    public function reorderRule(): BelongsTo
    {
        return $this->belongsTo(ReorderRule::class);
    }

    /**
     * Get the product variant for this suggestion
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the warehouse for this suggestion
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the supplier for this suggestion
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the purchase order if this suggestion was converted
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Mark suggestion as ordered
     */
    public function markAsOrdered(int $purchaseOrderId): void
    {
        $this->update([
            'status' => 'ordered',
            'purchase_order_id' => $purchaseOrderId,
            'ordered_at' => now(),
        ]);
    }

    /**
     * Dismiss this suggestion
     */
    public function dismiss(string $reason = null): void
    {
        $this->update([
            'status' => 'dismissed',
            'dismissed_at' => now(),
            'notes' => $reason,
        ]);
    }

    /**
     * Scope to get only pending suggestions
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get suggestions by priority
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }
}
