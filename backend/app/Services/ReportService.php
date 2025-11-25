<?php

namespace App\Services;

use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\InventoryLot;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportService
{
    /**
     * Stock on Hand by Warehouse Report
     */
    public function getStockOnHandByWarehouse($filters = [])
    {
        $query = StockBalance::with(['productVariant.product', 'warehouse'])
            ->where('qty_on_hand', '>', 0);

        if (!empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        if (!empty($filters['category_id'])) {
            $query->whereHas('productVariant.product', function ($q) use ($filters) {
                $q->where('category_id', $filters['category_id']);
            });
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('productVariant', function ($q) use ($search) {
                $q->where('sku', 'ilike', "%{$search}%")
                    ->orWhereHas('product', function ($q2) use ($search) {
                        $q2->where('name', 'ilike', "%{$search}%");
                    });
            });
        }

        $results = $query->get();

        // Group by warehouse
        $grouped = $results->groupBy('warehouse_id');
        $report = [];

        foreach ($grouped as $warehouseId => $balances) {
            $warehouse = $balances->first()->warehouse;
            $items = [];
            $totalValue = 0;
            $totalQty = 0;

            foreach ($balances as $balance) {
                $variant = $balance->productVariant;
                $product = $variant->product;
                $value = $balance->qty_on_hand * ($variant->cost ?? 0);
                $totalValue += $value;
                $totalQty += $balance->qty_on_hand;

                $items[] = [
                    'product_name' => $product->name ?? 'N/A',
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,
                    'qty_on_hand' => $balance->qty_on_hand,
                    'qty_reserved' => $balance->qty_reserved,
                    'qty_available' => $balance->qty_available,
                    'unit_cost' => $variant->cost ?? 0,
                    'total_value' => $value,
                ];
            }

            $report[] = [
                'warehouse_id' => $warehouseId,
                'warehouse_name' => $warehouse->name ?? 'Unknown',
                'warehouse_code' => $warehouse->code ?? '',
                'total_items' => count($items),
                'total_qty' => $totalQty,
                'total_value' => $totalValue,
                'items' => $items,
            ];
        }

        return [
            'report_type' => 'stock_on_hand_by_warehouse',
            'generated_at' => now()->toIso8601String(),
            'filters' => $filters,
            'summary' => [
                'total_warehouses' => count($report),
                'total_skus' => $results->count(),
                'total_qty' => $results->sum('qty_on_hand'),
                'total_value' => $results->sum(function ($b) {
                    return $b->qty_on_hand * ($b->productVariant->cost ?? 0);
                }),
            ],
            'data' => $report,
        ];
    }

    /**
     * Inventory Valuation Report (FIFO-based)
     */
    public function getInventoryValuation($filters = [])
    {
        $query = StockBalance::with(['productVariant.product', 'warehouse'])
            ->where('qty_on_hand', '>', 0);

        if (!empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        if (!empty($filters['category_id'])) {
            $query->whereHas('productVariant.product', function ($q) use ($filters) {
                $q->where('category_id', $filters['category_id']);
            });
        }

        $balances = $query->get();

        $valuationItems = [];
        $totalValue = 0;

        foreach ($balances as $balance) {
            $variant = $balance->productVariant;
            $product = $variant->product;

            // Get FIFO cost from lot movements or use average cost
            $fifoValue = $this->calculateFIFOValue($variant->id, $balance->warehouse_id, $balance->qty_on_hand);

            $avgCost = $balance->qty_on_hand > 0 ? $fifoValue / $balance->qty_on_hand : 0;
            $totalValue += $fifoValue;

            $valuationItems[] = [
                'product_name' => $product->name ?? 'N/A',
                'sku' => $variant->sku,
                'warehouse_name' => $balance->warehouse->name ?? 'N/A',
                'qty_on_hand' => $balance->qty_on_hand,
                'avg_unit_cost' => round($avgCost, 2),
                'standard_cost' => $variant->cost ?? 0,
                'fifo_value' => round($fifoValue, 2),
                'standard_value' => round($balance->qty_on_hand * ($variant->cost ?? 0), 2),
                'variance' => round($fifoValue - ($balance->qty_on_hand * ($variant->cost ?? 0)), 2),
            ];
        }

        // Sort by value descending
        usort($valuationItems, function ($a, $b) {
            return $b['fifo_value'] <=> $a['fifo_value'];
        });

        return [
            'report_type' => 'inventory_valuation',
            'generated_at' => now()->toIso8601String(),
            'filters' => $filters,
            'valuation_method' => 'FIFO',
            'summary' => [
                'total_skus' => count($valuationItems),
                'total_qty' => array_sum(array_column($valuationItems, 'qty_on_hand')),
                'total_fifo_value' => round($totalValue, 2),
                'total_standard_value' => round(array_sum(array_column($valuationItems, 'standard_value')), 2),
                'total_variance' => round(array_sum(array_column($valuationItems, 'variance')), 2),
            ],
            'data' => $valuationItems,
        ];
    }

    /**
     * Calculate FIFO value for a product variant
     */
    private function calculateFIFOValue($variantId, $warehouseId, $qtyNeeded)
    {
        // Get receipt movements ordered by date (FIFO)
        $receipts = StockMovement::where('product_variant_id', $variantId)
            ->where('warehouse_id', $warehouseId)
            ->where('qty_delta', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        $totalValue = 0;
        $qtyRemaining = $qtyNeeded;

        foreach ($receipts as $receipt) {
            if ($qtyRemaining <= 0) break;

            $qtyFromThisReceipt = min($qtyRemaining, $receipt->qty_delta);
            $totalValue += $qtyFromThisReceipt * ($receipt->unit_cost ?? 0);
            $qtyRemaining -= $qtyFromThisReceipt;
        }

        // If we still have qty remaining (not enough receipts), use standard cost
        if ($qtyRemaining > 0) {
            $variant = ProductVariant::find($variantId);
            $totalValue += $qtyRemaining * ($variant->cost ?? 0);
        }

        return $totalValue;
    }

    /**
     * Stock Movement History Report
     */
    public function getStockMovementHistory($filters = [])
    {
        $query = StockMovement::with(['productVariant.product', 'warehouse', 'user'])
            ->orderBy('created_at', 'desc');

        if (!empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        if (!empty($filters['product_variant_id'])) {
            $query->where('product_variant_id', $filters['product_variant_id']);
        }

        if (!empty($filters['ref_type'])) {
            $query->where('ref_type', $filters['ref_type']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $movements = $query->limit(1000)->get();

        $movementItems = [];
        $totalIn = 0;
        $totalOut = 0;

        foreach ($movements as $movement) {
            $variant = $movement->productVariant;
            $product = $variant->product ?? null;

            if ($movement->qty_delta > 0) {
                $totalIn += $movement->qty_delta;
            } else {
                $totalOut += abs($movement->qty_delta);
            }

            $movementItems[] = [
                'id' => $movement->id,
                'date' => $movement->created_at->toIso8601String(),
                'product_name' => $product->name ?? 'N/A',
                'sku' => $variant->sku ?? 'N/A',
                'warehouse_name' => $movement->warehouse->name ?? 'N/A',
                'ref_type' => $movement->ref_type,
                'ref_id' => $movement->ref_id,
                'qty_delta' => $movement->qty_delta,
                'direction' => $movement->qty_delta > 0 ? 'IN' : 'OUT',
                'unit_cost' => $movement->unit_cost ?? 0,
                'total_value' => abs($movement->qty_delta) * ($movement->unit_cost ?? 0),
                'note' => $movement->note,
                'user' => $movement->user->name ?? 'System',
            ];
        }

        // Summary by reference type
        $byRefType = $movements->groupBy('ref_type')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total_in' => $group->where('qty_delta', '>', 0)->sum('qty_delta'),
                'total_out' => abs($group->where('qty_delta', '<', 0)->sum('qty_delta')),
            ];
        });

        return [
            'report_type' => 'stock_movement_history',
            'generated_at' => now()->toIso8601String(),
            'filters' => $filters,
            'summary' => [
                'total_movements' => count($movementItems),
                'total_qty_in' => $totalIn,
                'total_qty_out' => $totalOut,
                'net_change' => $totalIn - $totalOut,
                'by_ref_type' => $byRefType,
            ],
            'data' => $movementItems,
        ];
    }

    /**
     * Expiry Aging Report
     */
    public function getExpiryAgingReport($filters = [])
    {
        $query = InventoryLot::with(['productVariant.product'])
            ->where('qty_on_hand', '>', 0)
            ->whereNotNull('exp_date');

        if (!empty($filters['warehouse_id'])) {
            // Filter by movements in specific warehouse
            $query->whereHas('stockMovements', function ($q) use ($filters) {
                $q->where('warehouse_id', $filters['warehouse_id']);
            });
        }

        if (!empty($filters['days_threshold'])) {
            $threshold = Carbon::now()->addDays($filters['days_threshold']);
            $query->where('exp_date', '<=', $threshold);
        }

        $lots = $query->orderBy('exp_date', 'asc')->get();

        $today = Carbon::now();
        $agingBuckets = [
            'expired' => [],
            'expiring_30_days' => [],
            'expiring_60_days' => [],
            'expiring_90_days' => [],
            'beyond_90_days' => [],
        ];

        $totalExpiredValue = 0;
        $totalAtRiskValue = 0;

        foreach ($lots as $lot) {
            $variant = $lot->productVariant;
            $product = $variant->product ?? null;
            $expDate = Carbon::parse($lot->exp_date);
            $daysUntilExpiry = $today->diffInDays($expDate, false);
            $value = $lot->qty_on_hand * ($variant->cost ?? 0);

            $item = [
                'lot_no' => $lot->lot_no,
                'product_name' => $product->name ?? 'N/A',
                'sku' => $variant->sku ?? 'N/A',
                'qty_on_hand' => $lot->qty_on_hand,
                'mfg_date' => $lot->mfg_date,
                'exp_date' => $lot->exp_date,
                'days_until_expiry' => $daysUntilExpiry,
                'unit_cost' => $variant->cost ?? 0,
                'total_value' => round($value, 2),
            ];

            if ($daysUntilExpiry < 0) {
                $agingBuckets['expired'][] = $item;
                $totalExpiredValue += $value;
            } elseif ($daysUntilExpiry <= 30) {
                $agingBuckets['expiring_30_days'][] = $item;
                $totalAtRiskValue += $value;
            } elseif ($daysUntilExpiry <= 60) {
                $agingBuckets['expiring_60_days'][] = $item;
                $totalAtRiskValue += $value;
            } elseif ($daysUntilExpiry <= 90) {
                $agingBuckets['expiring_90_days'][] = $item;
                $totalAtRiskValue += $value;
            } else {
                $agingBuckets['beyond_90_days'][] = $item;
            }
        }

        return [
            'report_type' => 'expiry_aging',
            'generated_at' => now()->toIso8601String(),
            'filters' => $filters,
            'summary' => [
                'total_lots' => $lots->count(),
                'expired_lots' => count($agingBuckets['expired']),
                'expiring_30_days' => count($agingBuckets['expiring_30_days']),
                'expiring_60_days' => count($agingBuckets['expiring_60_days']),
                'expiring_90_days' => count($agingBuckets['expiring_90_days']),
                'beyond_90_days' => count($agingBuckets['beyond_90_days']),
                'total_expired_value' => round($totalExpiredValue, 2),
                'total_at_risk_value' => round($totalAtRiskValue, 2),
            ],
            'data' => $agingBuckets,
        ];
    }

    /**
     * Top/Slow Movers Analysis Report
     */
    public function getMoversAnalysis($filters = [])
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->subDays(30)->toDateString();
        $dateTo = $filters['date_to'] ?? Carbon::now()->toDateString();
        $limit = $filters['limit'] ?? 20;

        // Get outbound movements (sales/shipments)
        $query = StockMovement::select(
            'product_variant_id',
            DB::raw('SUM(ABS(qty_delta)) as total_qty'),
            DB::raw('COUNT(*) as movement_count'),
            DB::raw('SUM(ABS(qty_delta) * COALESCE(unit_cost, 0)) as total_value')
        )
            ->where('qty_delta', '<', 0) // Outbound movements
            ->whereIn('ref_type', ['SHIPMENT', 'SO'])
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        if (!empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        $query->groupBy('product_variant_id');

        // Top movers
        $topMovers = (clone $query)
            ->orderBy('total_qty', 'desc')
            ->limit($limit)
            ->get();

        // Slow movers - products with stock but low/no movement
        $slowMovers = StockBalance::select('product_variant_id', DB::raw('SUM(qty_on_hand) as stock_qty'))
            ->where('qty_on_hand', '>', 0)
            ->groupBy('product_variant_id')
            ->get()
            ->map(function ($balance) use ($dateFrom, $dateTo, $filters) {
                $movements = StockMovement::where('product_variant_id', $balance->product_variant_id)
                    ->where('qty_delta', '<', 0)
                    ->whereIn('ref_type', ['SHIPMENT', 'SO'])
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo);

                if (!empty($filters['warehouse_id'])) {
                    $movements->where('warehouse_id', $filters['warehouse_id']);
                }

                return [
                    'product_variant_id' => $balance->product_variant_id,
                    'stock_qty' => $balance->stock_qty,
                    'sold_qty' => abs($movements->sum('qty_delta')),
                    'movement_count' => $movements->count(),
                ];
            })
            ->filter(function ($item) {
                return $item['sold_qty'] == 0 || ($item['stock_qty'] > 0 && $item['sold_qty'] / $item['stock_qty'] < 0.1);
            })
            ->sortBy('sold_qty')
            ->take($limit)
            ->values();

        // Enrich with product details
        $enrichTopMovers = $topMovers->map(function ($item) use ($dateFrom, $dateTo) {
            $variant = ProductVariant::with('product')->find($item->product_variant_id);
            return [
                'product_name' => $variant->product->name ?? 'N/A',
                'sku' => $variant->sku ?? 'N/A',
                'total_qty_sold' => abs($item->total_qty),
                'movement_count' => $item->movement_count,
                'total_value' => round($item->total_value, 2),
                'avg_daily_sales' => round(abs($item->total_qty) / max(1, Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo))), 2),
            ];
        });

        $enrichSlowMovers = $slowMovers->map(function ($item) {
            $variant = ProductVariant::with('product')->find($item['product_variant_id']);
            return [
                'product_name' => $variant->product->name ?? 'N/A',
                'sku' => $variant->sku ?? 'N/A',
                'stock_on_hand' => $item['stock_qty'],
                'qty_sold' => $item['sold_qty'],
                'movement_count' => $item['movement_count'],
                'turnover_rate' => $item['stock_qty'] > 0 ? round($item['sold_qty'] / $item['stock_qty'], 4) : 0,
                'stock_value' => round($item['stock_qty'] * ($variant->cost ?? 0), 2),
            ];
        });

        return [
            'report_type' => 'movers_analysis',
            'generated_at' => now()->toIso8601String(),
            'filters' => $filters,
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'summary' => [
                'total_top_movers' => count($enrichTopMovers),
                'total_slow_movers' => count($enrichSlowMovers),
                'top_movers_value' => round($enrichTopMovers->sum('total_value'), 2),
                'slow_movers_stock_value' => round($enrichSlowMovers->sum('stock_value'), 2),
            ],
            'top_movers' => $enrichTopMovers,
            'slow_movers' => $enrichSlowMovers,
        ];
    }

    /**
     * Generate CSV export data
     */
    public function generateCSV($reportType, $data)
    {
        $rows = [];

        switch ($reportType) {
            case 'stock_on_hand_by_warehouse':
                $rows[] = ['Warehouse', 'Product', 'SKU', 'Qty On Hand', 'Qty Reserved', 'Qty Available', 'Unit Cost', 'Total Value'];
                foreach ($data['data'] as $warehouse) {
                    foreach ($warehouse['items'] as $item) {
                        $rows[] = [
                            $warehouse['warehouse_name'],
                            $item['product_name'],
                            $item['sku'],
                            $item['qty_on_hand'],
                            $item['qty_reserved'],
                            $item['qty_available'],
                            $item['unit_cost'],
                            $item['total_value'],
                        ];
                    }
                }
                break;

            case 'inventory_valuation':
                $rows[] = ['Product', 'SKU', 'Warehouse', 'Qty On Hand', 'Avg Unit Cost', 'Standard Cost', 'FIFO Value', 'Standard Value', 'Variance'];
                foreach ($data['data'] as $item) {
                    $rows[] = [
                        $item['product_name'],
                        $item['sku'],
                        $item['warehouse_name'],
                        $item['qty_on_hand'],
                        $item['avg_unit_cost'],
                        $item['standard_cost'],
                        $item['fifo_value'],
                        $item['standard_value'],
                        $item['variance'],
                    ];
                }
                break;

            case 'stock_movement_history':
                $rows[] = ['Date', 'Product', 'SKU', 'Warehouse', 'Type', 'Ref ID', 'Direction', 'Qty', 'Unit Cost', 'Total Value', 'User', 'Note'];
                foreach ($data['data'] as $item) {
                    $rows[] = [
                        $item['date'],
                        $item['product_name'],
                        $item['sku'],
                        $item['warehouse_name'],
                        $item['ref_type'],
                        $item['ref_id'],
                        $item['direction'],
                        abs($item['qty_delta']),
                        $item['unit_cost'],
                        $item['total_value'],
                        $item['user'],
                        $item['note'],
                    ];
                }
                break;

            case 'expiry_aging':
                $rows[] = ['Aging Bucket', 'Lot No', 'Product', 'SKU', 'Qty On Hand', 'Mfg Date', 'Exp Date', 'Days Until Expiry', 'Unit Cost', 'Total Value'];
                foreach ($data['data'] as $bucket => $items) {
                    foreach ($items as $item) {
                        $rows[] = [
                            str_replace('_', ' ', ucfirst($bucket)),
                            $item['lot_no'],
                            $item['product_name'],
                            $item['sku'],
                            $item['qty_on_hand'],
                            $item['mfg_date'],
                            $item['exp_date'],
                            $item['days_until_expiry'],
                            $item['unit_cost'],
                            $item['total_value'],
                        ];
                    }
                }
                break;

            case 'movers_analysis':
                $rows[] = ['Category', 'Product', 'SKU', 'Metric 1', 'Metric 2', 'Value'];
                $rows[] = ['--- TOP MOVERS ---', '', '', 'Total Qty Sold', 'Movement Count', 'Total Value'];
                foreach ($data['top_movers'] as $item) {
                    $rows[] = [
                        'Top Mover',
                        $item['product_name'],
                        $item['sku'],
                        $item['total_qty_sold'],
                        $item['movement_count'],
                        $item['total_value'],
                    ];
                }
                $rows[] = ['--- SLOW MOVERS ---', '', '', 'Stock On Hand', 'Qty Sold', 'Stock Value'];
                foreach ($data['slow_movers'] as $item) {
                    $rows[] = [
                        'Slow Mover',
                        $item['product_name'],
                        $item['sku'],
                        $item['stock_on_hand'],
                        $item['qty_sold'],
                        $item['stock_value'],
                    ];
                }
                break;
        }

        return $rows;
    }
}
