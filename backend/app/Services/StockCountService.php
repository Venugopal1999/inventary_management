<?php

namespace App\Services;

use App\Models\StockCount;
use App\Models\StockCountItem;
use App\Models\StockBalance;
use App\Models\InventoryLot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class StockCountService
{
    protected StockMovementService $stockMovementService;

    public function __construct(StockMovementService $stockMovementService)
    {
        $this->stockMovementService = $stockMovementService;
    }

    /**
     * Create a new stock count
     */
    public function createCount(array $data): StockCount
    {
        return DB::transaction(function () use ($data) {
            $count = StockCount::create([
                'warehouse_id' => $data['warehouse_id'],
                'location_id' => $data['location_id'] ?? null,
                'scope' => $data['scope'] ?? 'cycle',
                'status' => 'draft',
                'scheduled_at' => $data['scheduled_at'] ?? null,
                'notes' => $data['notes'] ?? null,
                'auto_post_if_no_variance' => $data['auto_post_if_no_variance'] ?? false,
                'variance_threshold' => $data['variance_threshold'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Initialize count items with expected quantities
            $this->initializeCountItems($count);

            return $count->fresh(['items', 'warehouse']);
        });
    }

    /**
     * Initialize count items with current stock levels
     */
    protected function initializeCountItems(StockCount $count): void
    {
        $query = StockBalance::where('warehouse_id', $count->warehouse_id)
            ->where('qty_on_hand', '>', 0);

        // If location specified (cycle count), filter by location
        if ($count->location_id) {
            $query->where('location_id', $count->location_id);
        }

        $balances = $query->get();

        foreach ($balances as $balance) {
            StockCountItem::create([
                'stock_count_id' => $count->id,
                'product_variant_id' => $balance->product_variant_id,
                'location_id' => $balance->location_id,
                'lot_id' => null, // Will be expanded if lot tracking is enabled
                'uom_id' => $balance->productVariant->product->uom_id,
                'expected_qty' => $balance->qty_on_hand,
                'counted_qty' => null,
                'variance' => null,
            ]);
        }

        // If lot tracking is enabled, create separate items per lot
        if ($count->scope === 'full') {
            $this->expandItemsForLots($count);
        }
    }

    /**
     * Expand count items for lot-tracked products
     */
    protected function expandItemsForLots(StockCount $count): void
    {
        $query = InventoryLot::where('warehouse_id', $count->warehouse_id)
            ->where('qty_on_hand', '>', 0);

        if ($count->location_id) {
            $query->where('location_id', $count->location_id);
        }

        $lots = $query->get();

        foreach ($lots as $lot) {
            // Find existing item for this variant and location
            $existingItem = $count->items()
                ->where('product_variant_id', $lot->product_variant_id)
                ->where('location_id', $lot->location_id)
                ->whereNull('lot_id')
                ->first();

            if ($existingItem) {
                // Delete the aggregate item
                $existingItem->delete();
            }

            // Create lot-specific item
            StockCountItem::create([
                'stock_count_id' => $count->id,
                'product_variant_id' => $lot->product_variant_id,
                'location_id' => $lot->location_id,
                'lot_id' => $lot->id,
                'uom_id' => $lot->productVariant->product->uom_id,
                'expected_qty' => $lot->qty_on_hand,
                'counted_qty' => null,
                'variance' => null,
            ]);
        }
    }

    /**
     * Start the count
     */
    public function start(StockCount $count): StockCount
    {
        if (!$count->canBeStarted()) {
            throw new Exception('Count cannot be started');
        }

        $count->update([
            'status' => 'in_progress',
            'started_at' => now(),
            'counted_by' => Auth::id(),
        ]);

        return $count->fresh();
    }

    /**
     * Record a counted quantity for an item
     */
    public function recordCount(StockCountItem $item, float $countedQty): StockCountItem
    {
        if ($item->stockCount->status !== 'in_progress') {
            throw new Exception('Count is not in progress');
        }

        $item->counted_qty = $countedQty;
        $item->counted_at = now();
        $item->calculateVariance();
        $item->save();

        return $item->fresh();
    }

    /**
     * Complete the count
     */
    public function complete(StockCount $count): StockCount
    {
        if (!$count->canBeCompleted()) {
            throw new Exception('Count cannot be completed');
        }

        // Ensure all items have been counted
        $uncountedItems = $count->items()->whereNull('counted_qty')->count();
        if ($uncountedItems > 0) {
            throw new Exception("Cannot complete count: {$uncountedItems} items have not been counted");
        }

        $count->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Auto-post if configured and no variances
        if ($count->auto_post_if_no_variance && $count->total_variance_count === 0) {
            return $this->post($count);
        }

        return $count->fresh();
    }

    /**
     * Review the count
     */
    public function review(StockCount $count, ?string $notes = null): StockCount
    {
        if (!$count->canBeReviewed()) {
            throw new Exception('Count cannot be reviewed');
        }

        $count->update([
            'status' => 'reviewed',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'notes' => $notes ?? $count->notes,
        ]);

        return $count->fresh();
    }

    /**
     * Post the count (create adjustment movements for variances)
     */
    public function post(StockCount $count): StockCount
    {
        if (!$count->canBePosted() && $count->status !== 'completed') {
            throw new Exception('Count must be reviewed before posting');
        }

        return DB::transaction(function () use ($count) {
            // Create stock movements for items with variance
            $varianceItems = $count->items()->where('variance', '!=', 0)->get();

            foreach ($varianceItems as $item) {
                $this->stockMovementService->createMovement([
                    'product_variant_id' => $item->product_variant_id,
                    'warehouse_id' => $count->warehouse_id,
                    'location_id' => $item->location_id,
                    'lot_id' => $item->lot_id,
                    'qty_delta' => $item->variance,
                    'uom_id' => $item->uom_id,
                    'unit_cost' => null,
                    'ref_type' => 'COUNT',
                    'ref_id' => $count->id,
                    'note' => "Count {$count->count_number} - Variance adjustment: {$item->variance_status}",
                    'user_id' => Auth::id(),
                ]);
            }

            // Update count status
            $count->update([
                'status' => 'posted',
                'posted_by' => Auth::id(),
                'posted_at' => now(),
            ]);

            return $count->fresh();
        });
    }

    /**
     * Cancel a count
     */
    public function cancel(StockCount $count): StockCount
    {
        if ($count->status === 'posted') {
            throw new Exception('Posted counts cannot be cancelled');
        }

        $count->update(['status' => 'cancelled']);

        return $count->fresh();
    }

    /**
     * Get count details
     */
    public function getCountDetails(int $countId): StockCount
    {
        return StockCount::with([
            'warehouse',
            'location',
            'items.productVariant.product',
            'items.location',
            'items.lot',
            'items.uom',
            'creator',
            'counter',
            'reviewer',
            'poster',
        ])->findOrFail($countId);
    }

    /**
     * Get variance summary for a count
     */
    public function getVarianceSummary(StockCount $count): array
    {
        $items = $count->items()->whereNotNull('variance')->get();

        return [
            'total_items' => $count->items()->count(),
            'items_counted' => $count->items()->whereNotNull('counted_qty')->count(),
            'items_with_variance' => $count->total_variance_count,
            'over_count' => $items->where('variance', '>', 0)->count(),
            'under_count' => $items->where('variance', '<', 0)->count(),
            'missing_count' => $items->where('variance_status', 'missing')->count(),
            'match_count' => $items->where('variance', 0)->count(),
            'total_variance_qty' => $items->sum('variance'),
            'items_by_status' => [
                'match' => $items->where('variance_status', 'match')->count(),
                'over' => $items->where('variance_status', 'over')->count(),
                'under' => $items->where('variance_status', 'under')->count(),
                'missing' => $items->where('variance_status', 'missing')->count(),
            ],
        ];
    }
}
