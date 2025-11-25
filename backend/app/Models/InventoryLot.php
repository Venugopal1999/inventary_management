<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryLot extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_variant_id',
        'lot_no',
        'mfg_date',
        'exp_date',
        'qty_on_hand',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'mfg_date' => 'date',
        'exp_date' => 'date',
        'qty_on_hand' => 'decimal:4',
    ];

    /**
     * Get the product variant that this lot belongs to.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the stock movements for this lot.
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'lot_id');
    }

    /**
     * Scope a query to only include lots expiring soon.
     */
    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereNotNull('exp_date')
            ->where('exp_date', '<=', Carbon::now()->addDays($days))
            ->where('exp_date', '>', Carbon::now())
            ->where('qty_on_hand', '>', 0);
    }

    /**
     * Scope a query to only include expired lots.
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('exp_date')
            ->where('exp_date', '<', Carbon::now())
            ->where('qty_on_hand', '>', 0);
    }

    /**
     * Scope a query to only include lots with stock.
     */
    public function scopeInStock($query)
    {
        return $query->where('qty_on_hand', '>', 0);
    }

    /**
     * Scope a query to order by expiry date (FEFO - First Expiry First Out).
     */
    public function scopeFEFO($query)
    {
        return $query->orderBy('exp_date', 'asc');
    }

    /**
     * Check if this lot is expired.
     */
    public function isExpired(): bool
    {
        if (!$this->exp_date) {
            return false;
        }

        return $this->exp_date->isPast();
    }

    /**
     * Check if this lot is expiring soon.
     */
    public function isExpiringSoon(int $days = 30): bool
    {
        if (!$this->exp_date) {
            return false;
        }

        return $this->exp_date->isFuture() &&
               $this->exp_date->diffInDays(Carbon::now()) <= $days;
    }

    /**
     * Get days until expiry.
     */
    public function daysUntilExpiry(): ?int
    {
        if (!$this->exp_date) {
            return null;
        }

        return (int) Carbon::now()->diffInDays($this->exp_date, false);
    }
}
