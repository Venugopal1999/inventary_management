<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transfer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'transfer_number',
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'requested_at',
        'approved_at',
        'shipped_at',
        'received_at',
        'requested_by',
        'approved_by',
        'shipped_by',
        'received_by',
        'carrier',
        'tracking_number',
        'notes',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = self::generateTransferNumber();
            }
        });
    }

    /**
     * Generate a unique transfer number.
     */
    public static function generateTransferNumber(): string
    {
        $prefix = 'TRF';
        $date = now()->format('Ymd');
        $lastTransfer = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastTransfer ? (int) substr($lastTransfer->transfer_number, -4) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    /**
     * Get the source warehouse.
     */
    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    /**
     * Get the destination warehouse.
     */
    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    /**
     * Get the user who requested the transfer.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who approved the transfer.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who shipped the transfer.
     */
    public function shipper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    /**
     * Get the user who received the transfer.
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Get the transfer items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(TransferItem::class);
    }

    /**
     * Check if transfer is editable.
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'approved']);
    }

    /**
     * Check if transfer can be approved.
     */
    public function canBeApproved(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if transfer can be shipped.
     */
    public function canBeShipped(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if transfer can be received.
     */
    public function canBeReceived(): bool
    {
        return $this->status === 'in_transit';
    }

    /**
     * Get transfer completion percentage.
     */
    public function getCompletionPercentageAttribute(): float
    {
        $totalRequested = $this->items->sum('qty_requested');
        if ($totalRequested == 0) {
            return 0;
        }
        $totalReceived = $this->items->sum('qty_received');
        return round(($totalReceived / $totalRequested) * 100, 2);
    }
}
