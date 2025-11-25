<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockCount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'count_number',
        'warehouse_id',
        'location_id',
        'scope',
        'status',
        'scheduled_at',
        'started_at',
        'completed_at',
        'reviewed_at',
        'posted_at',
        'created_by',
        'counted_by',
        'reviewed_by',
        'posted_by',
        'notes',
        'auto_post_if_no_variance',
        'variance_threshold',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'posted_at' => 'datetime',
        'auto_post_if_no_variance' => 'boolean',
        'variance_threshold' => 'decimal:2',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($count) {
            if (empty($count->count_number)) {
                $count->count_number = self::generateCountNumber();
            }
        });
    }

    /**
     * Generate a unique count number.
     */
    public static function generateCountNumber(): string
    {
        $prefix = 'CNT';
        $date = now()->format('Ymd');
        $lastCount = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastCount ? (int) substr($lastCount->count_number, -4) + 1 : 1;

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
     * Get the location (if cycle count for specific location).
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the user who created the count.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who performed the count.
     */
    public function counter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    /**
     * Get the user who reviewed the count.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the user who posted the count.
     */
    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    /**
     * Get the count items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockCountItem::class);
    }

    /**
     * Check if count is editable.
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'in_progress']);
    }

    /**
     * Check if count can be started.
     */
    public function canBeStarted(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if count can be completed.
     */
    public function canBeCompleted(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if count can be reviewed.
     */
    public function canBeReviewed(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if count can be posted.
     */
    public function canBePosted(): bool
    {
        return $this->status === 'reviewed';
    }

    /**
     * Get total variance count.
     */
    public function getTotalVarianceCountAttribute(): int
    {
        return $this->items->where('variance', '!=', 0)->count();
    }

    /**
     * Get total items counted.
     */
    public function getTotalItemsCountedAttribute(): int
    {
        return $this->items->whereNotNull('counted_qty')->count();
    }
}
