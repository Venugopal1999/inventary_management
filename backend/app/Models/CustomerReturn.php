<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerReturn extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'return_number',
        'shipment_id',
        'customer_id',
        'status',
        'reason',
        'reason_notes',
        'requested_at',
        'approved_at',
        'received_at',
        'refunded_at',
        'approved_by',
        'received_by',
        'refund_amount',
        'refund_method',
        'restock',
        'notes',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'refunded_at' => 'datetime',
        'refund_amount' => 'decimal:2',
        'restock' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($return) {
            if (empty($return->return_number)) {
                $return->return_number = self::generateReturnNumber();
            }
        });
    }

    /**
     * Generate a unique return number.
     */
    public static function generateReturnNumber(): string
    {
        $prefix = 'RMA';
        $date = now()->format('Ymd');
        $lastReturn = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastReturn ? (int) substr($lastReturn->return_number, -4) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    /**
     * Get the shipment.
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    /**
     * Get the customer.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user who approved this return.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who received this return.
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Get the return items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(CustomerReturnItem::class);
    }

    /**
     * Check if return is pending approval.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if return is approved.
     */
    public function isApproved(): bool
    {
        return in_array($this->status, ['approved', 'received', 'refunded']);
    }

    /**
     * Check if return is complete.
     */
    public function isComplete(): bool
    {
        return $this->status === 'refunded';
    }

    /**
     * Check if return can be edited.
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }
}
