<?php

namespace App\Services;

use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class StockAdjustmentService
{
    protected StockMovementService $stockMovementService;

    public function __construct(StockMovementService $stockMovementService)
    {
        $this->stockMovementService = $stockMovementService;
    }

    /**
     * Create a new stock adjustment
     */
    public function createAdjustment(array $data): StockAdjustment
    {
        return DB::transaction(function () use ($data) {
            $adjustment = StockAdjustment::create([
                'warehouse_id' => $data['warehouse_id'],
                'reason' => $data['reason'],
                'status' => 'draft',
                'reason_notes' => $data['reason_notes'] ?? null,
                'requires_approval' => $data['requires_approval'] ?? true,
                'created_by' => Auth::id(),
            ]);

            // Create adjustment items
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $this->addAdjustmentItem($adjustment, $itemData);
                }
            }

            return $adjustment->fresh(['items', 'warehouse']);
        });
    }

    /**
     * Update an existing stock adjustment
     */
    public function updateAdjustment(StockAdjustment $adjustment, array $data): StockAdjustment
    {
        if (!$adjustment->canEdit()) {
            throw new Exception('Adjustment cannot be edited in current status');
        }

        return DB::transaction(function () use ($adjustment, $data) {
            $adjustment->update([
                'warehouse_id' => $data['warehouse_id'] ?? $adjustment->warehouse_id,
                'reason' => $data['reason'] ?? $adjustment->reason,
                'reason_notes' => $data['reason_notes'] ?? $adjustment->reason_notes,
                'requires_approval' => $data['requires_approval'] ?? $adjustment->requires_approval,
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $adjustment->items()->delete();

                // Create new items
                foreach ($data['items'] as $itemData) {
                    $this->addAdjustmentItem($adjustment, $itemData);
                }
            }

            return $adjustment->fresh(['items', 'warehouse']);
        });
    }

    /**
     * Add an item to an adjustment
     */
    protected function addAdjustmentItem(StockAdjustment $adjustment, array $itemData): StockAdjustmentItem
    {
        return StockAdjustmentItem::create([
            'stock_adjustment_id' => $adjustment->id,
            'product_variant_id' => $itemData['product_variant_id'],
            'location_id' => $itemData['location_id'] ?? null,
            'lot_id' => $itemData['lot_id'] ?? null,
            'uom_id' => $itemData['uom_id'],
            'qty_delta' => $itemData['qty_delta'],
            'unit_cost' => $itemData['unit_cost'] ?? null,
            'note' => $itemData['note'] ?? null,
        ]);
    }

    /**
     * Submit adjustment for approval
     */
    public function submitForApproval(StockAdjustment $adjustment): StockAdjustment
    {
        if (!$adjustment->requires_approval) {
            throw new Exception('This adjustment does not require approval');
        }

        if ($adjustment->status !== 'draft') {
            throw new Exception('Only draft adjustments can be submitted for approval');
        }

        $adjustment->update(['status' => 'pending_approval']);

        return $adjustment->fresh();
    }

    /**
     * Approve an adjustment
     */
    public function approve(StockAdjustment $adjustment, ?string $approvalNotes = null): StockAdjustment
    {
        if (!$adjustment->canBeApproved()) {
            throw new Exception('Adjustment cannot be approved');
        }

        $adjustment->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'approval_notes' => $approvalNotes,
        ]);

        return $adjustment->fresh();
    }

    /**
     * Reject an adjustment
     */
    public function reject(StockAdjustment $adjustment, ?string $approvalNotes = null): StockAdjustment
    {
        if ($adjustment->status !== 'pending_approval') {
            throw new Exception('Only pending adjustments can be rejected');
        }

        $adjustment->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'approval_notes' => $approvalNotes,
        ]);

        return $adjustment->fresh();
    }

    /**
     * Post the adjustment (create stock movements)
     */
    public function post(StockAdjustment $adjustment): StockAdjustment
    {
        if (!$adjustment->canBePosted()) {
            throw new Exception('Adjustment cannot be posted');
        }

        return DB::transaction(function () use ($adjustment) {
            // Create stock movements for each item
            foreach ($adjustment->items as $item) {
                $this->stockMovementService->createMovement([
                    'product_variant_id' => $item->product_variant_id,
                    'warehouse_id' => $adjustment->warehouse_id,
                    'location_id' => $item->location_id,
                    'lot_id' => $item->lot_id,
                    'qty_delta' => $item->qty_delta,
                    'uom_id' => $item->uom_id,
                    'unit_cost' => $item->unit_cost,
                    'ref_type' => 'ADJUSTMENT',
                    'ref_id' => $adjustment->id,
                    'note' => "Adjustment {$adjustment->adjustment_number}: {$adjustment->reason} - {$item->note}",
                    'user_id' => Auth::id(),
                ]);
            }

            // Update adjustment status
            $adjustment->update([
                'status' => 'posted',
                'adjusted_at' => now(),
            ]);

            return $adjustment->fresh();
        });
    }

    /**
     * Cancel an adjustment
     */
    public function cancel(StockAdjustment $adjustment): StockAdjustment
    {
        if ($adjustment->status === 'posted') {
            throw new Exception('Posted adjustments cannot be cancelled. Create a reversal adjustment instead.');
        }

        $adjustment->delete();

        return $adjustment;
    }

    /**
     * Get adjustment details
     */
    public function getAdjustmentDetails(int $adjustmentId): StockAdjustment
    {
        return StockAdjustment::with([
            'warehouse',
            'items.productVariant.product',
            'items.location',
            'items.lot',
            'items.uom',
            'creator',
            'approver',
        ])->findOrFail($adjustmentId);
    }
}
