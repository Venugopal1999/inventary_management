<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class POItem extends Model
{
    use HasFactory;

    protected $table = 'po_items';

    protected $fillable = [
        'purchase_order_id',
        'product_variant_id',
        'uom_id',
        'ordered_qty',
        'received_qty',
        'cancelled_qty',
        'unit_cost',
        'discount_percent',
        'discount_amount',
        'tax_percent',
        'tax_amount',
        'line_total',
        'notes',
        'expected_date',
    ];

    protected $casts = [
        'ordered_qty' => 'decimal:2',
        'received_qty' => 'decimal:2',
        'cancelled_qty' => 'decimal:2',
        'unit_cost' => 'decimal:4',
        'discount_percent' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
        'expected_date' => 'date',
    ];

    /**
     * Get the purchase order this item belongs to
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the product variant
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the unit of measure
     */
    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }

    /**
     * Get GRN items for this PO item
     */
    public function grnItems(): HasMany
    {
        return $this->hasMany(GRNItem::class);
    }

    /**
     * Calculate line totals based on quantity, unit cost, discount, and tax
     */
    public function calculateTotals(): void
    {
        // Calculate discount amount
        $subtotal = $this->ordered_qty * $this->unit_cost;
        $this->discount_amount = ($subtotal * $this->discount_percent) / 100;

        // Calculate amount after discount
        $afterDiscount = $subtotal - $this->discount_amount;

        // Calculate tax amount
        $this->tax_amount = ($afterDiscount * $this->tax_percent) / 100;

        // Calculate line total
        $this->line_total = $afterDiscount + $this->tax_amount;
    }

    /**
     * Get remaining quantity to be received
     */
    public function getRemainingQtyAttribute(): float
    {
        return $this->ordered_qty - $this->received_qty - $this->cancelled_qty;
    }

    /**
     * Get quantity that can still be received
     */
    public function getReceivableQtyAttribute(): float
    {
        return max(0, $this->getRemainingQtyAttribute());
    }

    /**
     * Check if item is fully received
     */
    public function getIsFullyReceivedAttribute(): bool
    {
        return $this->received_qty >= $this->ordered_qty;
    }

    /**
     * Get reception percentage
     */
    public function getReceptionPercentageAttribute(): float
    {
        if ($this->ordered_qty == 0) {
            return 0;
        }
        return round(($this->received_qty / $this->ordered_qty) * 100, 2);
    }

    /**
     * Check if item is partially received
     */
    public function getIsPartiallyReceivedAttribute(): bool
    {
        return $this->received_qty > 0 && $this->received_qty < $this->ordered_qty;
    }

    /**
     * Get the product name (helper)
     */
    public function getProductNameAttribute(): ?string
    {
        return $this->productVariant?->product?->name;
    }

    /**
     * Get the SKU (helper)
     */
    public function getSkuAttribute(): ?string
    {
        return $this->productVariant?->sku;
    }

    /**
     * Boot method to auto-calculate totals
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->calculateTotals();
        });

        static::saved(function ($item) {
            // Recalculate PO totals when item changes
            if ($item->purchaseOrder) {
                $item->purchaseOrder->calculateTotals();
            }
        });

        static::deleted(function ($item) {
            // Recalculate PO totals when item is deleted
            if ($item->purchaseOrder) {
                $item->purchaseOrder->calculateTotals();
            }
        });
    }
}
