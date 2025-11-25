<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'po_number',
        'supplier_id',
        'warehouse_id',
        'status',
        'order_date',
        'expected_date',
        'approved_date',
        'ordered_date',
        'currency',
        'subtotal',
        'tax_amount',
        'shipping_cost',
        'total_amount',
        'created_by',
        'approved_by',
        'notes',
        'terms_and_conditions',
        'supplier_reference',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_date' => 'date',
        'approved_date' => 'date',
        'ordered_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Status constants
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_SUBMITTED = 'submitted';
    const STATUS_APPROVED = 'approved';
    const STATUS_ORDERED = 'ordered';
    const STATUS_PARTIAL = 'partial';
    const STATUS_RECEIVED = 'received';
    const STATUS_CLOSED = 'closed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the supplier that owns the purchase order
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the warehouse where goods will be received
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who created the PO
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who approved the PO
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get all items in this purchase order
     */
    public function items(): HasMany
    {
        return $this->hasMany(POItem::class);
    }

    /**
     * Get goods receipts for this PO
     */
    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for active POs (not closed or cancelled)
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Scope for pending approval
     */
    public function scopePendingApproval($query)
    {
        return $query->where('status', self::STATUS_SUBMITTED);
    }

    /**
     * Scope for approved and not yet fully received
     */
    public function scopeAwaitingReceipt($query)
    {
        return $query->whereIn('status', [self::STATUS_APPROVED, self::STATUS_ORDERED, self::STATUS_PARTIAL]);
    }

    /**
     * Scope for overdue POs
     */
    public function scopeOverdue($query)
    {
        return $query->where('expected_date', '<', now())
            ->whereNotIn('status', [self::STATUS_RECEIVED, self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Scope to search by PO number or supplier
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('po_number', 'like', "%{$term}%")
              ->orWhere('supplier_reference', 'like', "%{$term}%")
              ->orWhereHas('supplier', function ($sq) use ($term) {
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
        $this->tax_amount = $this->items->sum('tax_amount');
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->shipping_cost;
        $this->save();
    }

    /**
     * Check if PO is editable
     */
    public function isEditable(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SUBMITTED]);
    }

    /**
     * Check if PO can be approved
     */
    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_SUBMITTED && $this->items()->count() > 0;
    }

    /**
     * Check if PO can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return !in_array($this->status, [self::STATUS_RECEIVED, self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Get total quantity ordered
     */
    public function getTotalQuantityAttribute(): float
    {
        return $this->items->sum('ordered_qty');
    }

    /**
     * Get total quantity received
     */
    public function getTotalReceivedAttribute(): float
    {
        return $this->items->sum('received_qty');
    }

    /**
     * Get completion percentage
     */
    public function getCompletionPercentageAttribute(): float
    {
        $ordered = $this->getTotalQuantityAttribute();
        if ($ordered == 0) {
            return 0;
        }
        $received = $this->getTotalReceivedAttribute();
        return round(($received / $ordered) * 100, 2);
    }

    /**
     * Check if PO is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        if (!$this->expected_date) {
            return false;
        }
        return $this->expected_date->isPast() &&
               !in_array($this->status, [self::STATUS_RECEIVED, self::STATUS_CLOSED, self::STATUS_CANCELLED]);
    }

    /**
     * Generate next PO number
     */
    public static function generatePoNumber(): string
    {
        $lastPO = static::withTrashed()
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastPO ? $lastPO->id + 1 : 1;
        $year = now()->format('Y');
        return "PO-{$year}-" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($po) {
            if (!$po->po_number) {
                $po->po_number = static::generatePoNumber();
            }
            if (!$po->order_date) {
                $po->order_date = now();
            }
        });
    }
}
