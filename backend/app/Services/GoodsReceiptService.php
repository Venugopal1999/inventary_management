<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use App\Models\GRNItem;
use App\Models\InventoryLot;
use App\Models\POItem;
use App\Models\PurchaseOrder;
use App\Models\StockBalance;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class GoodsReceiptService
{
    /**
     * Create a new goods receipt from a purchase order
     */
    public function createGoodsReceipt(int $purchaseOrderId, array $data): GoodsReceipt
    {
        return DB::transaction(function () use ($purchaseOrderId, $data) {
            $goodsReceipt = GoodsReceipt::create([
                'purchase_order_id' => $purchaseOrderId,
                'received_at' => $data['received_at'] ?? now(),
                'received_by' => Auth::id(),
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
            ]);

            return $goodsReceipt;
        });
    }

    /**
     * Receive items for a goods receipt
     * This handles partial receipts and creates/updates inventory lots
     */
    public function receiveItems(GoodsReceipt $goodsReceipt, array $items): void
    {
        DB::transaction(function () use ($goodsReceipt, $items) {
            foreach ($items as $itemData) {
                $this->receiveItem($goodsReceipt, $itemData);
            }

            // Update GRN status based on PO items
            $this->updateGoodsReceiptStatus($goodsReceipt);

            // Update PO status
            $this->updatePurchaseOrderStatus($goodsReceipt->purchaseOrder);
        });
    }

    /**
     * Receive a single item
     */
    protected function receiveItem(GoodsReceipt $goodsReceipt, array $itemData): GRNItem
    {
        $poItem = POItem::findOrFail($itemData['po_item_id']);

        // Validate received quantity
        $alreadyReceived = $this->getReceivedQuantity($poItem);
        $remainingQty = $poItem->ordered_qty - $alreadyReceived;

        if ($itemData['received_qty'] > $remainingQty) {
            throw new Exception("Cannot receive more than ordered. Remaining: {$remainingQty}");
        }

        // Create or find inventory lot if batch tracking is enabled
        $lotId = null;
        if (isset($itemData['lot_data']) && $itemData['lot_data']) {
            $lot = $this->createOrUpdateInventoryLot(
                $poItem->product_variant_id,
                $itemData['lot_data']
            );
            $lotId = $lot->id;
        }

        // Create GRN item
        $grnItem = GRNItem::create([
            'goods_receipt_id' => $goodsReceipt->id,
            'po_item_id' => $poItem->id,
            'product_variant_id' => $poItem->product_variant_id,
            'warehouse_id' => $itemData['warehouse_id'],
            'location_id' => $itemData['location_id'] ?? null,
            'lot_id' => $lotId,
            'received_qty' => $itemData['received_qty'],
            'unit_cost' => $poItem->unit_cost,
            'notes' => $itemData['notes'] ?? null,
        ]);

        // Update PO item received quantity
        $poItem->increment('received_qty', $itemData['received_qty']);

        return $grnItem;
    }

    /**
     * Post the goods receipt - create stock movements and update balances
     */
    public function postGoodsReceipt(GoodsReceipt $goodsReceipt): void
    {
        DB::transaction(function () use ($goodsReceipt) {
            if ($goodsReceipt->status === 'completed') {
                throw new Exception('Goods receipt is already completed');
            }

            foreach ($goodsReceipt->items as $grnItem) {
                // Create stock movement
                $this->createStockMovement($grnItem, $goodsReceipt);

                // Update stock balance
                $this->updateStockBalance($grnItem);

                // Update inventory lot quantity if applicable
                if ($grnItem->lot_id) {
                    $this->updateInventoryLotQuantity($grnItem);
                }
            }

            // Update GRN status
            $goodsReceipt->update(['status' => 'completed']);

            // Update PO status
            $this->updatePurchaseOrderStatus($goodsReceipt->purchaseOrder);
        });
    }

    /**
     * Create stock movement for received item
     */
    protected function createStockMovement(GRNItem $grnItem, GoodsReceipt $goodsReceipt): StockMovement
    {
        return StockMovement::create([
            'product_variant_id' => $grnItem->product_variant_id,
            'warehouse_id' => $grnItem->warehouse_id,
            'location_id' => $grnItem->location_id,
            'lot_id' => $grnItem->lot_id,
            'qty_delta' => $grnItem->received_qty, // Positive for receipt
            'uom_id' => $grnItem->poItem->uom_id,
            'unit_cost' => $grnItem->unit_cost,
            'ref_type' => 'GRN',
            'ref_id' => $goodsReceipt->id,
            'note' => "Goods received from PO#{$goodsReceipt->purchaseOrder->id}",
            'user_id' => $goodsReceipt->received_by,
            'ts' => $goodsReceipt->received_at,
        ]);
    }

    /**
     * Update or create stock balance
     */
    protected function updateStockBalance(GRNItem $grnItem): void
    {
        $balance = StockBalance::firstOrNew([
            'product_variant_id' => $grnItem->product_variant_id,
            'warehouse_id' => $grnItem->warehouse_id,
            'location_id' => $grnItem->location_id,
        ]);

        $balance->qty_on_hand = ($balance->qty_on_hand ?? 0) + $grnItem->received_qty;
        $balance->qty_available = ($balance->qty_on_hand ?? 0) - ($balance->qty_reserved ?? 0);
        $balance->save();
    }

    /**
     * Create or update inventory lot
     */
    protected function createOrUpdateInventoryLot(int $productVariantId, array $lotData): InventoryLot
    {
        // Try to find existing lot by lot number
        if (isset($lotData['lot_no'])) {
            $lot = InventoryLot::where('product_variant_id', $productVariantId)
                ->where('lot_no', $lotData['lot_no'])
                ->first();

            if ($lot) {
                return $lot;
            }
        }

        // Create new lot
        return InventoryLot::create([
            'product_variant_id' => $productVariantId,
            'lot_no' => $lotData['lot_no'] ?? null,
            'mfg_date' => $lotData['mfg_date'] ?? null,
            'exp_date' => $lotData['exp_date'] ?? null,
            'qty_on_hand' => 0, // Will be updated by stock movement
        ]);
    }

    /**
     * Update inventory lot quantity
     */
    protected function updateInventoryLotQuantity(GRNItem $grnItem): void
    {
        if ($grnItem->lot_id) {
            $lot = InventoryLot::find($grnItem->lot_id);
            if ($lot) {
                $lot->increment('qty_on_hand', $grnItem->received_qty);
            }
        }
    }

    /**
     * Get total received quantity for a PO item
     */
    protected function getReceivedQuantity(POItem $poItem): float
    {
        return $poItem->received_qty ?? 0;
    }

    /**
     * Update goods receipt status based on items
     */
    protected function updateGoodsReceiptStatus(GoodsReceipt $goodsReceipt): void
    {
        $hasItems = $goodsReceipt->items()->count() > 0;

        if (!$hasItems) {
            $goodsReceipt->update(['status' => 'draft']);
        } else {
            $goodsReceipt->update(['status' => 'partial']);
        }
    }

    /**
     * Update purchase order status based on received items
     */
    protected function updatePurchaseOrderStatus(PurchaseOrder $purchaseOrder): void
    {
        $allFullyReceived = true;
        $anyReceived = false;

        foreach ($purchaseOrder->items as $item) {
            if ($item->received_qty > 0) {
                $anyReceived = true;
            }
            if ($item->received_qty < $item->ordered_qty) {
                $allFullyReceived = false;
            }
        }

        if ($allFullyReceived && $anyReceived) {
            $purchaseOrder->update(['status' => 'received']);
        } elseif ($anyReceived) {
            $purchaseOrder->update(['status' => 'partial']);
        }
    }

    /**
     * Cancel a goods receipt
     */
    public function cancelGoodsReceipt(GoodsReceipt $goodsReceipt): void
    {
        DB::transaction(function () use ($goodsReceipt) {
            if ($goodsReceipt->status === 'completed') {
                throw new Exception('Cannot cancel a completed goods receipt');
            }

            // Revert received quantities on PO items
            foreach ($goodsReceipt->items as $grnItem) {
                $grnItem->poItem->decrement('received_qty', $grnItem->received_qty);
            }

            // Delete GRN items
            $goodsReceipt->items()->delete();

            // Update status
            $goodsReceipt->update(['status' => 'cancelled']);

            // Update PO status
            $this->updatePurchaseOrderStatus($goodsReceipt->purchaseOrder);
        });
    }

    /**
     * Get available locations for putaway
     */
    public function getAvailableLocations(int $warehouseId): array
    {
        return \App\Models\Location::where('warehouse_id', $warehouseId)
            ->where('is_pickable', true)
            ->where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(function ($location) {
                return [
                    'id' => $location->id,
                    'code' => $location->code,
                    'type' => $location->type,
                ];
            })
            ->toArray();
    }

    /**
     * Get PO details for receiving
     */
    public function getPurchaseOrderForReceiving(int $purchaseOrderId): array
    {
        $po = PurchaseOrder::with([
            'supplier',
            'items.productVariant.product',
            'items.uom'
        ])->findOrFail($purchaseOrderId);

        if (!in_array($po->status, ['approved', 'ordered', 'partial'])) {
            throw new Exception('Purchase order is not in a receivable status');
        }

        return [
            'id' => $po->id,
            'supplier' => [
                'id' => $po->supplier->id,
                'name' => $po->supplier->name,
            ],
            'order_date' => $po->order_date,
            'expected_date' => $po->expected_date,
            'status' => $po->status,
            'items' => $po->items->map(function ($item) {
                $alreadyReceived = $item->received_qty ?? 0;
                return [
                    'id' => $item->id,
                    'product_variant_id' => $item->product_variant_id,
                    'sku' => $item->productVariant->sku,
                    'product_name' => $item->productVariant->product->name,
                    'uom' => $item->uom->name,
                    'ordered_qty' => (float) $item->ordered_qty,
                    'received_qty' => (float) $alreadyReceived,
                    'remaining_qty' => (float) ($item->ordered_qty - $alreadyReceived),
                    'unit_cost' => (float) $item->unit_cost,
                ];
            })->toArray(),
        ];
    }
}
