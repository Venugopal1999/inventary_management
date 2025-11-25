<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * GRNItem Model - Placeholder for Week 4
 * This model will be fully implemented in Week 4 (Receiving & GRN)
 */
class GRNItem extends Model
{
    use HasFactory;

    protected $table = 'grn_items';

    protected $fillable = [
        'goods_receipt_id',
        'po_item_id',
        'product_variant_id',
        'warehouse_id',
        'location_id',
        'lot_id',
        'received_qty',
        'unit_cost',
        'notes',
    ];

    protected $casts = [
        'received_qty' => 'decimal:2',
        'unit_cost' => 'decimal:4',
    ];

    /**
     * Get the goods receipt this item belongs to
     */
    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    /**
     * Get the PO item
     */
    public function poItem(): BelongsTo
    {
        return $this->belongsTo(POItem::class);
    }

    /**
     * Get the product variant
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the inventory lot
     */
    public function lot(): BelongsTo
    {
        return $this->belongsTo(InventoryLot::class, 'lot_id');
    }

    /**
     * Get the warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the location
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
