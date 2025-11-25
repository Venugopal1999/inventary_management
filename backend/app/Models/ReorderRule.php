<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReorderRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'warehouse_id',
        'min_qty',
        'max_qty',
        'reorder_qty',
        'preferred_supplier_id',
        'lead_time_days',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'min_qty' => 'decimal:2',
        'max_qty' => 'decimal:2',
        'reorder_qty' => 'decimal:2',
        'lead_time_days' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the product variant for this reorder rule
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the warehouse for this reorder rule
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the preferred supplier for this reorder rule
     */
    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }

    /**
     * Get replenishment suggestions for this reorder rule
     */
    public function suggestions(): HasMany
    {
        return $this->hasMany(ReplenishmentSuggestion::class);
    }

    /**
     * Get low stock alerts for this reorder rule
     */
    public function lowStockAlerts(): HasMany
    {
        return $this->hasMany(LowStockAlert::class);
    }

    /**
     * Calculate the quantity to order
     */
    public function getOrderQuantity(float $currentStock): float
    {
        if ($this->reorder_qty) {
            return $this->reorder_qty;
        }

        // Order up to max_qty
        return max(0, $this->max_qty - $currentStock);
    }

    /**
     * Check if stock is below reorder point
     */
    public function shouldReorder(float $currentStock): bool
    {
        return $this->is_active && $currentStock <= $this->min_qty;
    }

    /**
     * Get priority based on how far below min_qty the stock is
     */
    public function getPriority(float $currentStock): string
    {
        $shortage = $this->min_qty - $currentStock;
        $percentBelow = ($shortage / $this->min_qty) * 100;

        if ($currentStock <= 0) {
            return 'critical'; // Out of stock
        } elseif ($percentBelow >= 50) {
            return 'high'; // 50% or more below min
        } elseif ($percentBelow >= 25) {
            return 'medium'; // 25-50% below min
        } else {
            return 'low'; // Less than 25% below min
        }
    }
}
