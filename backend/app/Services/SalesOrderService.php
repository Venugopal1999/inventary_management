<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SOItem;
use App\Models\StockReservation;
use App\Models\StockBalance;
use App\Models\InventoryLot;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class SalesOrderService
{
    /**
     * Create a new sales order
     */
    public function createSalesOrder(array $data): SalesOrder
    {
        return DB::transaction(function () use ($data) {
            $salesOrder = SalesOrder::create([
                'customer_id' => $data['customer_id'],
                'price_list_id' => $data['price_list_id'] ?? null,
                'status' => SalesOrder::STATUS_DRAFT,
                'order_date' => $data['order_date'] ?? now(),
                'promise_date' => $data['promise_date'] ?? null,
                'currency' => $data['currency'] ?? 'USD',
                'tax_rate' => $data['tax_rate'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Create SO items
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $this->createSOItem($salesOrder, $itemData);
                }
            }

            // Calculate totals
            $salesOrder->calculateTotals();

            return $salesOrder->fresh(['items', 'customer']);
        });
    }

    /**
     * Update a sales order
     */
    public function updateSalesOrder(SalesOrder $salesOrder, array $data): SalesOrder
    {
        if (!$salesOrder->isEditable()) {
            throw new Exception('Sales order cannot be edited in current status');
        }

        return DB::transaction(function () use ($salesOrder, $data) {
            $salesOrder->update([
                'customer_id' => $data['customer_id'] ?? $salesOrder->customer_id,
                'price_list_id' => $data['price_list_id'] ?? $salesOrder->price_list_id,
                'order_date' => $data['order_date'] ?? $salesOrder->order_date,
                'promise_date' => $data['promise_date'] ?? $salesOrder->promise_date,
                'currency' => $data['currency'] ?? $salesOrder->currency,
                'tax_rate' => $data['tax_rate'] ?? $salesOrder->tax_rate,
                'notes' => $data['notes'] ?? $salesOrder->notes,
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $salesOrder->items()->delete();

                // Create new items
                foreach ($data['items'] as $itemData) {
                    $this->createSOItem($salesOrder, $itemData);
                }
            }

            // Recalculate totals
            $salesOrder->calculateTotals();

            return $salesOrder->fresh(['items', 'customer']);
        });
    }

    /**
     * Create a sales order item
     */
    protected function createSOItem(SalesOrder $salesOrder, array $itemData): SOItem
    {
        return SOItem::create([
            'sales_order_id' => $salesOrder->id,
            'product_variant_id' => $itemData['product_variant_id'],
            'uom_id' => $itemData['uom_id'] ?? null,
            'ordered_qty' => $itemData['ordered_qty'],
            'unit_price' => $itemData['unit_price'],
            'notes' => $itemData['notes'] ?? null,
        ]);
    }

    /**
     * Confirm sales order and allocate stock using FEFO/FIFO
     */
    public function confirmSalesOrder(SalesOrder $salesOrder, bool $autoAllocate = true): SalesOrder
    {
        if (!$salesOrder->canBeConfirmed()) {
            throw new Exception('Sales order cannot be confirmed');
        }

        return DB::transaction(function () use ($salesOrder, $autoAllocate) {
            $salesOrder->update(['status' => SalesOrder::STATUS_CONFIRMED]);

            // Auto-allocate stock if requested
            if ($autoAllocate) {
                $this->allocateStock($salesOrder);
            }

            return $salesOrder->fresh(['items', 'customer']);
        });
    }

    /**
     * Allocate stock for sales order using FEFO/FIFO logic
     */
    public function allocateStock(SalesOrder $salesOrder): array
    {
        $allocationResults = [];

        DB::transaction(function () use ($salesOrder, &$allocationResults) {
            foreach ($salesOrder->items as $item) {
                $allocationResults[$item->id] = $this->allocateStockForItem($item);
            }

            // Update SO status based on allocation
            $this->updateSalesOrderStatusAfterAllocation($salesOrder);
        });

        return $allocationResults;
    }

    /**
     * Allocate stock for a single SO item using FEFO/FIFO
     */
    protected function allocateStockForItem(SOItem $item): array
    {
        $remainingQty = $item->ordered_qty - $item->allocated_qty;

        if ($remainingQty <= 0) {
            return [
                'success' => true,
                'allocated' => 0,
                'message' => 'Item already fully allocated'
            ];
        }

        $allocations = [];
        $totalAllocated = 0;

        // Get available stock using FEFO (First Expiry First Out) logic
        // If no lots exist, fall back to FIFO (First In First Out)
        $availableStock = $this->getAvailableStockFEFO($item->product_variant_id);

        foreach ($availableStock as $stock) {
            if ($remainingQty <= 0) {
                break;
            }

            $qtyToAllocate = min($remainingQty, $stock->available_qty);

            if ($qtyToAllocate > 0) {
                // Create reservation
                $reservation = StockReservation::create([
                    'sales_order_item_id' => $item->id,
                    'product_variant_id' => $item->product_variant_id,
                    'warehouse_id' => $stock->warehouse_id,
                    'location_id' => $stock->location_id,
                    'lot_id' => $stock->lot_id,
                    'qty_reserved' => $qtyToAllocate,
                    'reserved_by' => Auth::id(),
                ]);

                // Update stock balance
                $this->updateStockBalanceReservation(
                    $item->product_variant_id,
                    $stock->warehouse_id,
                    $stock->location_id,
                    $qtyToAllocate
                );

                // Update lot if exists
                if ($stock->lot_id) {
                    $lot = InventoryLot::find($stock->lot_id);
                    if ($lot) {
                        $lot->qty_reserved = ($lot->qty_reserved ?? 0) + $qtyToAllocate;
                        $lot->save();
                    }
                }

                $allocations[] = [
                    'warehouse_id' => $stock->warehouse_id,
                    'location_id' => $stock->location_id,
                    'lot_id' => $stock->lot_id,
                    'qty_allocated' => $qtyToAllocate,
                ];

                $totalAllocated += $qtyToAllocate;
                $remainingQty -= $qtyToAllocate;
            }
        }

        // Update SO item allocated quantity
        $item->allocated_qty += $totalAllocated;
        $item->save();

        return [
            'success' => $remainingQty == 0,
            'allocated' => $totalAllocated,
            'remaining' => $remainingQty,
            'allocations' => $allocations,
            'message' => $remainingQty > 0
                ? "Partially allocated. {$remainingQty} units short."
                : 'Fully allocated'
        ];
    }

    /**
     * Get available stock using FEFO logic (earliest expiry first)
     * Falls back to FIFO if no lot tracking
     */
    protected function getAvailableStockFEFO(int $productVariantId): \Illuminate\Support\Collection
    {
        // Try to get stock with lot tracking (FEFO)
        $lotsWithStock = DB::table('inventory_lots')
            ->select([
                'inventory_lots.id as lot_id',
                'inventory_lots.warehouse_id',
                'inventory_lots.location_id',
                'inventory_lots.exp_date',
                DB::raw('inventory_lots.qty_on_hand - COALESCE(inventory_lots.qty_reserved, 0) as available_qty')
            ])
            ->where('inventory_lots.product_variant_id', $productVariantId)
            ->whereRaw('inventory_lots.qty_on_hand - COALESCE(inventory_lots.qty_reserved, 0) > 0')
            ->orderBy('inventory_lots.exp_date', 'asc') // FEFO: earliest expiry first
            ->orderBy('inventory_lots.created_at', 'asc') // Then FIFO
            ->get();

        if ($lotsWithStock->isNotEmpty()) {
            return $lotsWithStock;
        }

        // Fallback to stock balances without lot tracking (FIFO)
        return DB::table('stock_balances')
            ->select([
                DB::raw('NULL as lot_id'),
                'stock_balances.warehouse_id',
                'stock_balances.location_id',
                DB::raw('NULL as exp_date'),
                DB::raw('stock_balances.qty_on_hand - COALESCE(stock_balances.qty_reserved, 0) as available_qty')
            ])
            ->where('stock_balances.product_variant_id', $productVariantId)
            ->whereRaw('stock_balances.qty_on_hand - COALESCE(stock_balances.qty_reserved, 0) > 0')
            ->orderBy('stock_balances.created_at', 'asc') // FIFO
            ->get();
    }

    /**
     * Update stock balance reservation
     */
    protected function updateStockBalanceReservation(
        int $productVariantId,
        int $warehouseId,
        ?int $locationId,
        float $qtyReserved
    ): void {
        $balance = StockBalance::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->where('location_id', $locationId)
            ->first();

        if ($balance) {
            $balance->qty_reserved = ($balance->qty_reserved ?? 0) + $qtyReserved;
            $balance->qty_available = $balance->qty_on_hand - $balance->qty_reserved;
            $balance->save();
        }
    }

    /**
     * Check Available to Promise (ATP) for a product variant
     */
    public function checkATP(int $productVariantId, float $requiredQty, ?int $warehouseId = null): array
    {
        $query = DB::table('stock_balances')
            ->where('product_variant_id', $productVariantId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $totalOnHand = $query->sum('qty_on_hand');
        $totalReserved = $query->sum('qty_reserved');
        $totalAvailable = $totalOnHand - $totalReserved;

        return [
            'product_variant_id' => $productVariantId,
            'required_qty' => $requiredQty,
            'on_hand' => $totalOnHand,
            'reserved' => $totalReserved,
            'available' => $totalAvailable,
            'can_fulfill' => $totalAvailable >= $requiredQty,
            'shortage' => max(0, $requiredQty - $totalAvailable),
        ];
    }

    /**
     * Release stock reservations for a sales order
     */
    public function releaseReservations(SalesOrder $salesOrder): void
    {
        DB::transaction(function () use ($salesOrder) {
            foreach ($salesOrder->items as $item) {
                $this->releaseReservationsForItem($item);
            }

            $salesOrder->update(['status' => SalesOrder::STATUS_CONFIRMED]);
        });
    }

    /**
     * Release stock reservations for an SO item
     */
    protected function releaseReservationsForItem(SOItem $item): void
    {
        $reservations = $item->reservations;

        foreach ($reservations as $reservation) {
            // Update stock balance
            $balance = StockBalance::where('product_variant_id', $reservation->product_variant_id)
                ->where('warehouse_id', $reservation->warehouse_id)
                ->where('location_id', $reservation->location_id)
                ->first();

            if ($balance) {
                $balance->qty_reserved = max(0, $balance->qty_reserved - $reservation->qty_reserved);
                $balance->qty_available = $balance->qty_on_hand - $balance->qty_reserved;
                $balance->save();
            }

            // Update lot if exists
            if ($reservation->lot_id) {
                $lot = InventoryLot::find($reservation->lot_id);
                if ($lot) {
                    $lot->qty_reserved = max(0, ($lot->qty_reserved ?? 0) - $reservation->qty_reserved);
                    $lot->save();
                }
            }

            // Delete reservation
            $reservation->delete();
        }

        // Reset allocated quantity
        $item->allocated_qty = 0;
        $item->save();
    }

    /**
     * Cancel a sales order
     */
    public function cancelSalesOrder(SalesOrder $salesOrder): SalesOrder
    {
        if (!$salesOrder->canBeCancelled()) {
            throw new Exception('Sales order cannot be cancelled');
        }

        return DB::transaction(function () use ($salesOrder) {
            // Release any stock reservations
            if ($salesOrder->status === SalesOrder::STATUS_ALLOCATED) {
                $this->releaseReservations($salesOrder);
            }

            $salesOrder->update(['status' => SalesOrder::STATUS_CANCELLED]);

            return $salesOrder->fresh(['items', 'customer']);
        });
    }

    /**
     * Update sales order status after allocation
     */
    protected function updateSalesOrderStatusAfterAllocation(SalesOrder $salesOrder): void
    {
        $salesOrder->refresh();

        $totalOrdered = $salesOrder->items->sum('ordered_qty');
        $totalAllocated = $salesOrder->items->sum('allocated_qty');

        if ($totalAllocated >= $totalOrdered) {
            $salesOrder->update(['status' => SalesOrder::STATUS_ALLOCATED]);
        } elseif ($totalAllocated > 0) {
            // Partial allocation - keep as confirmed
            $salesOrder->update(['status' => SalesOrder::STATUS_CONFIRMED]);
        }
    }

    /**
     * Get sales order with full details for display
     */
    public function getSalesOrderDetails(int $salesOrderId): SalesOrder
    {
        return SalesOrder::with([
            'customer',
            'priceList',
            'creator',
            'items.productVariant.product',
            'items.uom',
            'items.reservations.warehouse',
            'items.reservations.location',
            'items.reservations.lot'
        ])->findOrFail($salesOrderId);
    }
}
