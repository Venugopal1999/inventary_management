<?php

namespace App\Services;

use App\Models\Shipment;
use App\Models\ShipmentItem;
use App\Models\SalesOrder;
use App\Models\SOItem;
use App\Models\StockReservation;
use App\Models\StockBalance;
use App\Models\InventoryLot;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class ShipmentService
{
    protected StockMovementService $stockMovementService;

    public function __construct(StockMovementService $stockMovementService)
    {
        $this->stockMovementService = $stockMovementService;
    }

    /**
     * Create a new shipment from a sales order
     */
    public function createShipment(SalesOrder $salesOrder, array $data = []): Shipment
    {
        if (!$salesOrder->canBeShipped()) {
            throw new Exception('Sales order cannot be shipped in current status');
        }

        return DB::transaction(function () use ($salesOrder, $data) {
            $shipment = Shipment::create([
                'sales_order_id' => $salesOrder->id,
                'status' => 'draft',
                'carrier' => $data['carrier'] ?? null,
                'tracking_number' => $data['tracking_number'] ?? null,
                'shipping_cost' => $data['shipping_cost'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            return $shipment->fresh(['salesOrder', 'items']);
        });
    }

    /**
     * Add items to shipment from reservations
     */
    public function addItemsFromReservations(Shipment $shipment): Shipment
    {
        if (!$shipment->canEdit()) {
            throw new Exception('Shipment cannot be edited');
        }

        return DB::transaction(function () use ($shipment) {
            $salesOrder = $shipment->salesOrder;

            foreach ($salesOrder->items as $soItem) {
                $this->addShipmentItemsFromSOItem($shipment, $soItem);
            }

            return $shipment->fresh(['items']);
        });
    }

    /**
     * Add shipment items from SO item reservations
     */
    protected function addShipmentItemsFromSOItem(Shipment $shipment, SOItem $soItem): void
    {
        $remainingQty = $soItem->ordered_qty - $soItem->shipped_qty;

        if ($remainingQty <= 0) {
            return; // Nothing to ship
        }

        $reservations = $soItem->reservations;

        foreach ($reservations as $reservation) {
            if ($remainingQty <= 0) {
                break;
            }

            $qtyToShip = min($remainingQty, $reservation->qty_reserved);

            if ($qtyToShip > 0) {
                // Get FIFO cost
                $unitCost = $this->getFIFOCost(
                    $reservation->product_variant_id,
                    $reservation->warehouse_id,
                    $reservation->lot_id
                );

                // Create shipment item
                ShipmentItem::create([
                    'shipment_id' => $shipment->id,
                    'so_item_id' => $soItem->id,
                    'product_variant_id' => $reservation->product_variant_id,
                    'lot_id' => $reservation->lot_id,
                    'location_id' => $reservation->location_id,
                    'shipped_qty' => $qtyToShip,
                    'uom_id' => $soItem->uom_id,
                    'unit_cost_fifo_snap' => $unitCost,
                ]);

                $remainingQty -= $qtyToShip;
            }
        }
    }

    /**
     * Get FIFO cost for a product variant
     * Uses lot cost if available, otherwise calculates from stock movements
     */
    protected function getFIFOCost(int $productVariantId, int $warehouseId, ?int $lotId = null): float
    {
        // If lot is specified, get cost from the lot
        if ($lotId) {
            $lot = InventoryLot::find($lotId);
            if ($lot && $lot->unit_cost) {
                return (float) $lot->unit_cost;
            }
        }

        // Otherwise, get average cost from recent stock movements
        $recentMovement = StockMovement::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->where('qty_delta', '>', 0) // Only incoming movements
            ->whereNotNull('unit_cost')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($recentMovement) {
            return (float) $recentMovement->unit_cost;
        }

        // Fallback to product variant cost
        $variant = \App\Models\ProductVariant::find($productVariantId);
        return $variant ? (float) ($variant->cost ?? 0) : 0;
    }

    /**
     * Mark shipment as picked
     */
    public function markAsPicked(Shipment $shipment, array $data = []): Shipment
    {
        return DB::transaction(function () use ($shipment, $data) {
            $shipment->update([
                'status' => 'picking',
                'picked_at' => now(),
                'picked_by' => $data['picked_by'] ?? Auth::id(),
            ]);

            return $shipment->fresh();
        });
    }

    /**
     * Mark shipment as packed
     */
    public function markAsPacked(Shipment $shipment, array $data): Shipment
    {
        return DB::transaction(function () use ($shipment, $data) {
            $shipment->update([
                'status' => 'packed',
                'packed_at' => now(),
                'packed_by' => $data['packed_by'] ?? Auth::id(),
                'box_weight' => $data['box_weight'] ?? null,
                'box_dimensions' => $data['box_dimensions'] ?? null,
            ]);

            return $shipment->fresh();
        });
    }

    /**
     * Ship the shipment - posts stock movements and updates reservations
     */
    public function ship(Shipment $shipment, array $data = []): Shipment
    {
        if ($shipment->status === 'shipped') {
            throw new Exception('Shipment is already shipped');
        }

        return DB::transaction(function () use ($shipment, $data) {
            // Post stock movements for each shipment item
            foreach ($shipment->items as $item) {
                $this->postStockMovement($item);
                $this->releaseReservation($item);
                $this->updateSOItemShippedQty($item);
            }

            // Update shipment status
            $shipment->update([
                'status' => 'shipped',
                'shipped_at' => $data['shipped_at'] ?? now(),
                'shipped_by' => $data['shipped_by'] ?? Auth::id(),
                'carrier' => $data['carrier'] ?? $shipment->carrier,
                'tracking_number' => $data['tracking_number'] ?? $shipment->tracking_number,
            ]);

            // Mark item as picked if not already
            foreach ($shipment->items as $item) {
                if (!$item->picked_at) {
                    $item->update(['picked_at' => now()]);
                }
            }

            // Check if sales order is complete and close it
            $this->checkAndCloseSalesOrder($shipment->salesOrder);

            return $shipment->fresh(['salesOrder', 'items']);
        });
    }

    /**
     * Post stock movement for a shipment item (reduce inventory)
     */
    protected function postStockMovement(ShipmentItem $item): void
    {
        $this->stockMovementService->createMovement([
            'product_variant_id' => $item->product_variant_id,
            'warehouse_id' => $item->shipment->salesOrder->warehouse_id ?? 1, // Default warehouse
            'location_id' => $item->location_id,
            'lot_id' => $item->lot_id,
            'qty_delta' => -abs($item->shipped_qty), // Negative for outbound
            'uom_id' => $item->uom_id,
            'unit_cost' => $item->unit_cost_fifo_snap,
            'ref_type' => 'SHIPMENT',
            'ref_id' => $item->shipment_id,
            'note' => "Shipment #{$item->shipment_id} for SO #{$item->shipment->sales_order_id}",
            'user_id' => Auth::id(),
        ]);
    }

    /**
     * Release stock reservation for shipped item
     */
    protected function releaseReservation(ShipmentItem $item): void
    {
        // Get warehouse from various sources
        $warehouseId = $item->location?->warehouse_id
            ?? $item->shipment->salesOrder->warehouse_id
            ?? 1;

        $reservation = StockReservation::where('sales_order_item_id', $item->so_item_id)
            ->where('product_variant_id', $item->product_variant_id)
            ->where('warehouse_id', $warehouseId)
            ->where('location_id', $item->location_id)
            ->where('lot_id', $item->lot_id)
            ->first();

        if ($reservation) {
            $qtyToRelease = min($reservation->qty_reserved, $item->shipped_qty);

            // Update stock balance - reduce reserved quantity
            $balance = StockBalance::where('product_variant_id', $item->product_variant_id)
                ->where('warehouse_id', $warehouseId)
                ->where('location_id', $item->location_id)
                ->first();

            if ($balance) {
                $balance->qty_reserved = max(0, $balance->qty_reserved - $qtyToRelease);
                $balance->qty_available = $balance->qty_on_hand - $balance->qty_reserved;
                $balance->save();
            }

            // Update lot reserved quantity
            if ($item->lot_id) {
                $lot = InventoryLot::find($item->lot_id);
                if ($lot) {
                    $lot->qty_reserved = max(0, ($lot->qty_reserved ?? 0) - $qtyToRelease);
                    $lot->save();
                }
            }

            // Reduce or delete reservation
            if ($reservation->qty_reserved <= $qtyToRelease) {
                $reservation->delete();
            } else {
                $reservation->qty_reserved -= $qtyToRelease;
                $reservation->save();
            }
        }
    }

    /**
     * Update SO item shipped quantity
     */
    protected function updateSOItemShippedQty(ShipmentItem $item): void
    {
        $soItem = $item->soItem;
        $soItem->shipped_qty = ($soItem->shipped_qty ?? 0) + $item->shipped_qty;
        $soItem->save();
    }

    /**
     * Check if sales order is fully shipped and close it
     */
    protected function checkAndCloseSalesOrder(SalesOrder $salesOrder): void
    {
        $salesOrder->refresh();

        $totalOrdered = $salesOrder->items->sum('ordered_qty');
        $totalShipped = $salesOrder->items->sum('shipped_qty');

        if ($totalShipped >= $totalOrdered) {
            $salesOrder->update(['status' => SalesOrder::STATUS_SHIPPED]);
        }
    }

    /**
     * Cancel a shipment
     */
    public function cancelShipment(Shipment $shipment): Shipment
    {
        if ($shipment->status === 'shipped') {
            throw new Exception('Cannot cancel a shipped shipment. Create a return instead.');
        }

        return DB::transaction(function () use ($shipment) {
            $shipment->update(['status' => 'cancelled']);

            return $shipment->fresh();
        });
    }

    /**
     * Get shipment with full details
     */
    public function getShipmentDetails(int $shipmentId): Shipment
    {
        return Shipment::with([
            'salesOrder.customer',
            'items.productVariant.product',
            'items.lot',
            'items.location',
            'items.uom',
            'picker',
            'packer',
            'shipper',
        ])->findOrFail($shipmentId);
    }

    /**
     * Scan barcode during picking
     */
    public function scanItemForPicking(Shipment $shipment, string $barcode): array
    {
        // Find shipment item by product variant barcode or lot number
        $variant = \App\Models\ProductVariant::where('barcode', $barcode)->first();
        $lot = InventoryLot::where('lot_no', $barcode)->first();

        if (!$variant && !$lot) {
            return [
                'success' => false,
                'message' => 'Barcode not found',
            ];
        }

        $productVariantId = $variant?->id ?? $lot?->product_variant_id;

        $item = $shipment->items()
            ->where('product_variant_id', $productVariantId)
            ->whereNull('picked_at')
            ->first();

        if (!$item) {
            return [
                'success' => false,
                'message' => 'Item not found in this shipment or already picked',
            ];
        }

        // Mark as picked
        $item->update(['picked_at' => now()]);

        return [
            'success' => true,
            'message' => 'Item marked as picked',
            'item' => $item->load('productVariant.product'),
        ];
    }
}
