<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockAdjustment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'adjustment_number',
        'warehouse_id',
        'reason',
        'status',
        'reason_notes',
        'adjusted_at',
        'created_by',
        'approved_by',
        'approved_at',
        'approval_notes',
        'requires_approval',
    ];

    protected $casts = [
        'adjusted_at' => 'datetime',
        'approved_at' => 'datetime',
        'requires_approval' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($adjustment) {
            if (empty($adjustment->adjustment_number)) {
                $adjustment->adjustment_number = self::generateAdjustmentNumber();
            }
        });
    }

    /**
     * Generate a unique adjustment number.
     */
    public static function generateAdjustmentNumber(): string
    {
        $prefix = 'ADJ';
        $date = now()->format('Ymd');
        $lastAdjustment = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastAdjustment ? (int) substr($lastAdjustment->adjustment_number, -4) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    /**
     * Get the warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who created the adjustment.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who approved the adjustment.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the adjustment items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class);
    }

    /**
     * Check if adjustment is editable.
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'pending_approval']);
    }

    /**
     * Check if adjustment can be approved.
     */
    public function canBeApproved(): bool
    {
        return $this->status === 'pending_approval' && $this->requires_approval;
    }

    /**
     * Check if adjustment can be posted.
     */
    public function canBePosted(): bool
    {
        if ($this->requires_approval) {
            return $this->status === 'approved';
        }
        return $this->status === 'draft';
    }

    /**
     * Get total quantity adjusted (absolute value).
     */
    public function getTotalQtyAdjustedAttribute(): float
    {
        return abs($this->items->sum('qty_delta'));
    }
}
