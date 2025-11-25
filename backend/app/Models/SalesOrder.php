<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'so_number',
        'customer_id',
        'price_list_id',
        'status',
        'order_date',
        'promise_date',
        'currency',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'order_date' => 'date',
        'promise_date' => 'date',
        'tax_rate' => 'decimal:2',
        'subtotal' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total' => 'decimal:4',
    ];

    /**
     * Status constants
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_ALLOCATED = 'allocated';
    const STATUS_PARTIAL = 'partial';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_CLOSED = 'closed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the customer that owns the sales order
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the price list used for this order
     */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Get the user who created the SO
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all items in this sales order
     */
    public function items(): HasMany
    {
        return $this->hasMany(SOItem::class);
    }

    /**
     * Get all shipments for this sales order
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for active SOs (not closed or cancelled)
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Scope for confirmed and awaiting allocation
     */
    public function scopeAwaitingAllocation($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    /**
     * Scope for allocated and ready to ship
     */
    public function scopeReadyToShip($query)
    {
        return $query->where('status', self::STATUS_ALLOCATED);
    }

    /**
     * Scope to search by SO number or customer
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('so_number', 'like', "%{$term}%")
              ->orWhereHas('customer', function ($sq) use ($term) {
                  $sq->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%");
              });
        });
    }

    /**
     * Calculate and update totals based on line items
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('line_total');
        $this->tax_amount = $this->subtotal * ($this->tax_rate / 100);
        $this->total = $this->subtotal + $this->tax_amount;
        $this->save();
    }

    /**
     * Check if SO is editable
     */
    public function isEditable(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if SO can be confirmed
     */
    public function canBeConfirmed(): bool
    {
        return $this->status === self::STATUS_DRAFT && $this->items()->count() > 0;
    }

    /**
     * Check if SO can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return !in_array($this->status, [self::STATUS_SHIPPED, self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Check if SO can be shipped
     */
    public function canBeShipped(): bool
    {
        return in_array($this->status, [self::STATUS_CONFIRMED, self::STATUS_ALLOCATED, self::STATUS_PARTIAL]);
    }

    /**
     * Get total quantity ordered
     */
    public function getTotalQuantityAttribute(): float
    {
        return $this->items->sum('ordered_qty');
    }

    /**
     * Get total quantity allocated
     */
    public function getTotalAllocatedAttribute(): float
    {
        return $this->items->sum('allocated_qty');
    }

    /**
     * Get total quantity shipped
     */
    public function getTotalShippedAttribute(): float
    {
        return $this->items->sum('shipped_qty');
    }

    /**
     * Get allocation percentage
     */
    public function getAllocationPercentageAttribute(): float
    {
        $ordered = $this->getTotalQuantityAttribute();
        if ($ordered == 0) {
            return 0;
        }
        $allocated = $this->getTotalAllocatedAttribute();
        return round(($allocated / $ordered) * 100, 2);
    }

    /**
     * Get shipment percentage
     */
    public function getShipmentPercentageAttribute(): float
    {
        $ordered = $this->getTotalQuantityAttribute();
        if ($ordered == 0) {
            return 0;
        }
        $shipped = $this->getTotalShippedAttribute();
        return round(($shipped / $ordered) * 100, 2);
    }

    /**
     * Check if SO is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        if (!$this->promise_date) {
            return false;
        }
        return $this->promise_date->isPast() &&
               !in_array($this->status, [self::STATUS_SHIPPED, self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Generate next SO number
     */
    public static function generateSoNumber(): string
    {
        $lastSO = static::orderBy('id', 'desc')->first();

        $nextNumber = $lastSO ? $lastSO->id + 1 : 1;
        $year = now()->format('Y');
        return "SO-{$year}-" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($so) {
            if (!$so->so_number) {
                $so->so_number = static::generateSoNumber();
            }
            if (!$so->order_date) {
                $so->order_date = now();
            }
        });
    }
}
