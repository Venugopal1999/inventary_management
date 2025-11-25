<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\POItem;
use App\Models\ReorderRule;
use App\Models\ReplenishmentSuggestion;
use App\Models\StockBalance;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReplenishmentService
{
    /**
     * Generate replenishment suggestions based on reorder rules
     */
    public function generateSuggestions(?int $warehouseId = null): array
    {
        $query = ReorderRule::where('is_active', true)
            ->with(['productVariant.product', 'warehouse', 'preferredSupplier']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $rules = $query->get();
        $suggestions = [];

        foreach ($rules as $rule) {
            // Get current stock balance
            $balance = StockBalance::where('product_variant_id', $rule->product_variant_id)
                ->where('warehouse_id', $rule->warehouse_id)
                ->first();

            $currentQty = $balance ? $balance->qty_available : 0;

            // Check if we need to reorder
            if ($rule->shouldReorder($currentQty)) {
                $suggestion = $this->createOrUpdateSuggestion($rule, $currentQty);
                if ($suggestion) {
                    $suggestions[] = $suggestion;
                }
            } else {
                // Dismiss any pending suggestions if stock is now above min
                $this->dismissPendingSuggestionsForRule($rule);
            }
        }

        return $suggestions;
    }

    /**
     * Create or update a replenishment suggestion
     */
    protected function createOrUpdateSuggestion(ReorderRule $rule, float $currentQty): ?ReplenishmentSuggestion
    {
        // Check if suggestion already exists and is pending
        $existingSuggestion = ReplenishmentSuggestion::where('product_variant_id', $rule->product_variant_id)
            ->where('warehouse_id', $rule->warehouse_id)
            ->where('status', 'pending')
            ->first();

        $suggestedQty = $rule->getOrderQuantity($currentQty);
        $priority = $rule->getPriority($currentQty);

        if ($existingSuggestion) {
            // Update existing suggestion
            $existingSuggestion->update([
                'current_qty' => $currentQty,
                'suggested_qty' => $suggestedQty,
                'priority' => $priority,
            ]);

            return $existingSuggestion;
        }

        // Create new suggestion
        return ReplenishmentSuggestion::create([
            'reorder_rule_id' => $rule->id,
            'product_variant_id' => $rule->product_variant_id,
            'warehouse_id' => $rule->warehouse_id,
            'supplier_id' => $rule->preferred_supplier_id,
            'current_qty' => $currentQty,
            'min_qty' => $rule->min_qty,
            'max_qty' => $rule->max_qty,
            'suggested_qty' => $suggestedQty,
            'priority' => $priority,
            'status' => 'pending',
        ]);
    }

    /**
     * Dismiss pending suggestions for a rule (when stock is replenished)
     */
    protected function dismissPendingSuggestionsForRule(ReorderRule $rule): void
    {
        ReplenishmentSuggestion::where('product_variant_id', $rule->product_variant_id)
            ->where('warehouse_id', $rule->warehouse_id)
            ->where('status', 'pending')
            ->update([
                'status' => 'dismissed',
                'dismissed_at' => now(),
                'notes' => 'Auto-dismissed: stock level above reorder point',
            ]);
    }

    /**
     * Create a purchase order from selected suggestions
     */
    public function createPurchaseOrderFromSuggestions(
        array $suggestionIds,
        ?int $supplierId = null,
        ?User $user = null
    ): PurchaseOrder {
        return DB::transaction(function () use ($suggestionIds, $supplierId, $user) {
            $suggestions = ReplenishmentSuggestion::with(['productVariant', 'supplier'])
                ->whereIn('id', $suggestionIds)
                ->where('status', 'pending')
                ->get();

            if ($suggestions->isEmpty()) {
                throw new \Exception('No valid suggestions found');
            }

            // If supplier not specified, use the supplier from the first suggestion
            if (!$supplierId) {
                $supplierId = $suggestions->first()->supplier_id;
            }

            // Filter suggestions to only include those for the selected supplier
            $suggestions = $suggestions->filter(function ($suggestion) use ($supplierId) {
                return $suggestion->supplier_id == $supplierId;
            });

            if ($suggestions->isEmpty()) {
                throw new \Exception('No suggestions found for the selected supplier');
            }

            // Create purchase order
            $poNumber = $this->generatePONumber();

            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $supplierId,
                'status' => 'draft',
                'order_date' => now(),
                'expected_date' => $this->calculateExpectedDate($suggestions),
                'currency' => 'USD',
                'notes' => 'Auto-generated from replenishment suggestions',
            ]);

            // Create PO items from suggestions
            foreach ($suggestions as $suggestion) {
                // Get unit cost from product variant or set to 0
                $unitCost = $suggestion->productVariant->cost ?? 0;

                POItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_variant_id' => $suggestion->product_variant_id,
                    'uom_id' => $suggestion->productVariant->uom_id ?? 1,
                    'ordered_qty' => $suggestion->suggested_qty,
                    'unit_cost' => $unitCost,
                    'received_qty' => 0,
                ]);

                // Mark suggestion as ordered
                $suggestion->markAsOrdered($purchaseOrder->id);
            }

            return $purchaseOrder->load(['supplier', 'items.productVariant.product']);
        });
    }

    /**
     * Generate unique PO number
     */
    protected function generatePONumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        $lastPO = PurchaseOrder::whereDate('created_at', now()->toDateString())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPO ? (int)substr($lastPO->po_number, -4) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    /**
     * Calculate expected delivery date based on lead times
     */
    protected function calculateExpectedDate($suggestions): \DateTime
    {
        // Get the maximum lead time from all suggestions
        $maxLeadTime = 0;

        foreach ($suggestions as $suggestion) {
            if ($suggestion->reorderRule && $suggestion->reorderRule->lead_time_days > $maxLeadTime) {
                $maxLeadTime = $suggestion->reorderRule->lead_time_days;
            }
        }

        // Default to 7 days if no lead time specified
        $leadTime = $maxLeadTime > 0 ? $maxLeadTime : 7;

        return now()->addDays($leadTime);
    }

    /**
     * Get summary statistics
     */
    public function getSummary(?int $warehouseId = null): array
    {
        $query = ReplenishmentSuggestion::where('status', 'pending');

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $total = $query->count();
        $critical = (clone $query)->where('priority', 'critical')->count();
        $high = (clone $query)->where('priority', 'high')->count();
        $medium = (clone $query)->where('priority', 'medium')->count();
        $low = (clone $query)->where('priority', 'low')->count();

        // Calculate total suggested order value
        $suggestions = $query->with('productVariant')->get();
        $totalValue = $suggestions->sum(function ($suggestion) {
            $unitCost = $suggestion->productVariant->cost ?? 0;
            return $unitCost * $suggestion->suggested_qty;
        });

        // Group suggestions by supplier
        $bySupplier = $suggestions->groupBy('supplier_id')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total_items' => $group->sum('suggested_qty'),
            ];
        });

        return [
            'total_pending' => $total,
            'by_priority' => [
                'critical' => $critical,
                'high' => $high,
                'medium' => $medium,
                'low' => $low,
            ],
            'total_suggested_value' => round($totalValue, 2),
            'by_supplier' => $bySupplier,
        ];
    }

    /**
     * Get net requirements (MRP-style calculation)
     */
    public function getNetRequirements(int $productVariantId, int $warehouseId): array
    {
        // Get current stock
        $balance = StockBalance::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        $onHand = $balance ? $balance->qty_on_hand : 0;
        $available = $balance ? $balance->qty_available : 0;
        $reserved = $balance ? $balance->qty_reserved : 0;

        // Get reorder rule
        $rule = ReorderRule::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->where('is_active', true)
            ->first();

        $minQty = $rule ? $rule->min_qty : 0;
        $maxQty = $rule ? $rule->max_qty : 0;

        // Get pending PO items
        $pendingPO = POItem::whereHas('purchaseOrder', function ($query) {
            $query->whereIn('status', ['approved', 'ordered', 'partial']);
        })
            ->where('product_variant_id', $productVariantId)
            ->sum(DB::raw('ordered_qty - received_qty'));

        // Calculate net requirement
        $projected = $available + $pendingPO;
        $requirement = max(0, $maxQty - $projected);

        return [
            'on_hand' => $onHand,
            'available' => $available,
            'reserved' => $reserved,
            'on_order' => $pendingPO,
            'projected_available' => $projected,
            'min_qty' => $minQty,
            'max_qty' => $maxQty,
            'net_requirement' => $requirement,
            'should_order' => $projected < $minQty,
        ];
    }
}
