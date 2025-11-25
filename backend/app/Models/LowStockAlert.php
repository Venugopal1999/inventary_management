<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LowStockAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'warehouse_id',
        'reorder_rule_id',
        'current_qty',
        'min_qty',
        'shortage_qty',
        'severity',
        'notification_sent',
        'notification_sent_at',
        'is_resolved',
        'resolved_at',
    ];

    protected $casts = [
        'current_qty' => 'decimal:2',
        'min_qty' => 'decimal:2',
        'shortage_qty' => 'decimal:2',
        'notification_sent' => 'boolean',
        'notification_sent_at' => 'datetime',
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    /**
     * Get the product variant for this alert
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the warehouse for this alert
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the reorder rule for this alert
     */
    public function reorderRule(): BelongsTo
    {
        return $this->belongsTo(ReorderRule::class);
    }

    /**
     * Mark notification as sent
     */
    public function markNotificationSent(): void
    {
        $this->update([
            'notification_sent' => true,
            'notification_sent_at' => now(),
        ]);
    }

    /**
     * Mark alert as resolved
     */
    public function resolve(): void
    {
        $this->update([
            'is_resolved' => true,
            'resolved_at' => now(),
        ]);
    }

    /**
     * Scope to get only unresolved alerts
     */
    public function scopeUnresolved($query)
    {
        return $query->where('is_resolved', false);
    }

    /**
     * Scope to get alerts by severity
     */
    public function scopeBySeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope to get alerts where notification not sent
     */
    public function scopeNotificationPending($query)
    {
        return $query->where('notification_sent', false);
    }
}
