<?php

namespace App\Services;

use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;

class StockService
{
    /**
     * Stock state constants.
     */
    const STATE_IN_STOCK = 'in_stock';
    const STATE_LOW_STOCK = 'low_stock';
    const STATE_OUT_OF_STOCK = 'out_of_stock';
    const STATE_ON_ORDER = 'on_order';
    const STATE_ALLOCATED = 'allocated';

    /**
     * Low stock threshold (percentage of reorder minimum).
     */
    protected float $lowStockThreshold = 0.2; // 20%

    /**
     * Get stock on hand for a product variant at a warehouse.
     *
     * @param int $productVariantId
     * @param int|null $warehouseId If null, returns total across all warehouses
     * @param int|null $locationId
     * @return float
     */
    public function getStockOnHand(
        int $productVariantId,
        ?int $warehouseId = null,
        ?int $locationId = null
    ): float {
        $query = StockBalance::where('product_variant_id', $productVariantId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($locationId !== null) {
            $query->where('location_id', $locationId);
        }

        return $query->sum('qty_on_hand');
    }

    /**
     * Get available stock (on hand minus reserved) for a product variant.
     *
     * @param int $productVariantId
     * @param int|null $warehouseId
     * @param int|null $locationId
     * @return float
     */
    public function getAvailableStock(
        int $productVariantId,
        ?int $warehouseId = null,
        ?int $locationId = null
    ): float {
        $query = StockBalance::where('product_variant_id', $productVariantId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($locationId !== null) {
            $query->where('location_id', $locationId);
        }

        return $query->sum('qty_available');
    }

    /**
     * Get reserved stock for a product variant.
     *
     * @param int $productVariantId
     * @param int|null $warehouseId
     * @return float
     */
    public function getReservedStock(
        int $productVariantId,
        ?int $warehouseId = null
    ): float {
        $query = StockBalance::where('product_variant_id', $productVariantId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->sum('qty_reserved');
    }

    /**
     * Get incoming stock (on order) for a product variant.
     *
     * @param int $productVariantId
     * @param int|null $warehouseId
     * @return float
     */
    public function getIncomingStock(
        int $productVariantId,
        ?int $warehouseId = null
    ): float {
        $query = StockBalance::where('product_variant_id', $productVariantId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->sum('qty_incoming');
    }

    /**
     * Get stock state for a product variant.
     *
     * @param int $productVariantId
     * @param int|null $warehouseId
     * @param float|null $reorderMin Reorder minimum threshold
     * @return string
     */
    public function getStockState(
        int $productVariantId,
        ?int $warehouseId = null,
        ?float $reorderMin = null
    ): string {
        $onHand = $this->getStockOnHand($productVariantId, $warehouseId);
        $available = $this->getAvailableStock($productVariantId, $warehouseId);
        $reserved = $this->getReservedStock($productVariantId, $warehouseId);
        $incoming = $this->getIncomingStock($productVariantId, $warehouseId);

        // Out of stock
        if ($onHand <= 0) {
            // But has incoming orders
            if ($incoming > 0) {
                return self::STATE_ON_ORDER;
            }
            return self::STATE_OUT_OF_STOCK;
        }

        // All stock is allocated
        if ($onHand > 0 && $available <= 0 && $reserved > 0) {
            return self::STATE_ALLOCATED;
        }

        // Low stock check (if reorder minimum is provided)
        if ($reorderMin && $available <= ($reorderMin * $this->lowStockThreshold)) {
            return self::STATE_LOW_STOCK;
        }

        // In stock
        return self::STATE_IN_STOCK;
    }

    /**
     * Get stock summary for a product variant.
     *
     * @param int $productVariantId
     * @param int|null $warehouseId
     * @return array
     */
    public function getStockSummary(
        int $productVariantId,
        ?int $warehouseId = null
    ): array {
        $variant = ProductVariant::find($productVariantId);
        $reorderMin = $variant?->reorder_min;

        return [
            'product_variant_id' => $productVariantId,
            'warehouse_id' => $warehouseId,
            'qty_on_hand' => $this->getStockOnHand($productVariantId, $warehouseId),
            'qty_available' => $this->getAvailableStock($productVariantId, $warehouseId),
            'qty_reserved' => $this->getReservedStock($productVariantId, $warehouseId),
            'qty_incoming' => $this->getIncomingStock($productVariantId, $warehouseId),
            'state' => $this->getStockState($productVariantId, $warehouseId, $reorderMin),
            'reorder_min' => $reorderMin,
        ];
    }

    /**
     * Get stock breakdown by warehouse for a product variant.
     *
     * @param int $productVariantId
     * @return Collection
     */
    public function getStockByWarehouse(int $productVariantId): Collection
    {
        return StockBalance::with('warehouse')
            ->where('product_variant_id', $productVariantId)
            ->get()
            ->groupBy('warehouse_id')
            ->map(function ($balances, $warehouseId) {
                return [
                    'warehouse_id' => $warehouseId,
                    'warehouse_name' => $balances->first()->warehouse->name ?? 'Unknown',
                    'qty_on_hand' => $balances->sum('qty_on_hand'),
                    'qty_available' => $balances->sum('qty_available'),
                    'qty_reserved' => $balances->sum('qty_reserved'),
                    'locations' => $balances->map(function ($balance) {
                        return [
                            'location_id' => $balance->location_id,
                            'location_code' => $balance->location?->code ?? 'Default',
                            'qty_on_hand' => $balance->qty_on_hand,
                            'qty_available' => $balance->qty_available,
                            'qty_reserved' => $balance->qty_reserved,
                        ];
                    })->values(),
                ];
            })
            ->values();
    }

    /**
     * Verify stock balance accuracy by comparing with sum of movements.
     * Use this for debugging or periodic reconciliation.
     *
     * @param int $productVariantId
     * @param int $warehouseId
     * @param int|null $locationId
     * @return array ['balance' => float, 'movements_sum' => float, 'variance' => float]
     */
    public function verifyBalance(
        int $productVariantId,
        int $warehouseId,
        ?int $locationId = null
    ): array {
        // Get balance from stock_balances table
        $balance = StockBalance::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->where('location_id', $locationId)
            ->first();

        $balanceQty = $balance ? $balance->qty_on_hand : 0;

        // Calculate sum from stock_movements
        $movementsSum = StockMovement::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->where('location_id', $locationId)
            ->sum('qty_delta');

        $variance = $balanceQty - $movementsSum;

        return [
            'product_variant_id' => $productVariantId,
            'warehouse_id' => $warehouseId,
            'location_id' => $locationId,
            'balance' => $balanceQty,
            'movements_sum' => $movementsSum,
            'variance' => $variance,
            'is_accurate' => abs($variance) < 0.0001, // Allow for small floating point differences
        ];
    }

    /**
     * Get products with low stock.
     *
     * @param int|null $warehouseId
     * @param int $limit
     * @return Collection
     */
    public function getLowStockProducts(?int $warehouseId = null, int $limit = 50): Collection
    {
        $query = ProductVariant::with(['product', 'stockBalances'])
            ->whereHas('stockBalances', function ($q) {
                $q->where('qty_available', '>', 0);
            })
            ->whereNotNull('reorder_min');

        if ($warehouseId) {
            $query->whereHas('stockBalances', function ($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            });
        }

        return $query->get()
            ->filter(function ($variant) use ($warehouseId) {
                $available = $this->getAvailableStock($variant->id, $warehouseId);
                $reorderMin = $variant->reorder_min;
                return $reorderMin && $available <= ($reorderMin * $this->lowStockThreshold);
            })
            ->take($limit)
            ->map(function ($variant) use ($warehouseId) {
                return array_merge(
                    $variant->toArray(),
                    $this->getStockSummary($variant->id, $warehouseId)
                );
            });
    }

    /**
     * Get products that are out of stock.
     *
     * @param int|null $warehouseId
     * @param int $limit
     * @return Collection
     */
    public function getOutOfStockProducts(?int $warehouseId = null, int $limit = 50): Collection
    {
        $query = StockBalance::with(['productVariant.product'])
            ->where('qty_on_hand', '<=', 0);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->limit($limit)
            ->get()
            ->map(function ($balance) {
                return array_merge(
                    $balance->productVariant->toArray(),
                    $this->getStockSummary($balance->product_variant_id, $balance->warehouse_id)
                );
            });
    }
}
