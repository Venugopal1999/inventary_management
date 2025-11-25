<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\POItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PurchaseOrderService
{
    /**
     * Create a new purchase order
     *
     * @param array $data
     * @param User $user
     * @return PurchaseOrder
     * @throws Exception
     */
    public function createPurchaseOrder(array $data, User $user): PurchaseOrder
    {
        DB::beginTransaction();

        try {
            // Create purchase order
            $po = PurchaseOrder::create([
                'supplier_id' => $data['supplier_id'],
                'warehouse_id' => $data['warehouse_id'],
                'status' => $data['status'] ?? PurchaseOrder::STATUS_DRAFT,
                'order_date' => $data['order_date'] ?? now(),
                'expected_date' => $data['expected_date'] ?? null,
                'currency' => $data['currency'] ?? 'USD',
                'shipping_cost' => $data['shipping_cost'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'terms_and_conditions' => $data['terms_and_conditions'] ?? null,
                'supplier_reference' => $data['supplier_reference'] ?? null,
                'created_by' => $user->id,
            ]);

            // Add line items if provided
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->addItem($po, $item);
                }
            }

            // Recalculate totals
            $po->calculateTotals();

            DB::commit();
            Log::info("Purchase Order {$po->po_number} created by user {$user->id}");

            return $po->fresh(['items', 'supplier', 'warehouse']);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Failed to create purchase order: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update an existing purchase order
     *
     * @param PurchaseOrder $po
     * @param array $data
     * @return PurchaseOrder
     * @throws Exception
     */
    public function updatePurchaseOrder(PurchaseOrder $po, array $data): PurchaseOrder
    {
        if (!$po->isEditable()) {
            throw new Exception("Purchase order {$po->po_number} cannot be edited in {$po->status} status");
        }

        DB::beginTransaction();

        try {
            $po->update([
                'supplier_id' => $data['supplier_id'] ?? $po->supplier_id,
                'warehouse_id' => $data['warehouse_id'] ?? $po->warehouse_id,
                'status' => $data['status'] ?? $po->status,
                'order_date' => $data['order_date'] ?? $po->order_date,
                'expected_date' => $data['expected_date'] ?? $po->expected_date,
                'currency' => $data['currency'] ?? $po->currency,
                'shipping_cost' => $data['shipping_cost'] ?? $po->shipping_cost,
                'notes' => $data['notes'] ?? $po->notes,
                'terms_and_conditions' => $data['terms_and_conditions'] ?? $po->terms_and_conditions,
                'supplier_reference' => $data['supplier_reference'] ?? $po->supplier_reference,
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $po->items()->delete();

                // Add new items
                foreach ($data['items'] as $item) {
                    $this->addItem($po, $item);
                }
            }

            // Recalculate totals
            $po->calculateTotals();

            DB::commit();
            Log::info("Purchase Order {$po->po_number} updated");

            return $po->fresh(['items', 'supplier', 'warehouse']);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Failed to update purchase order: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add a line item to a purchase order
     *
     * @param PurchaseOrder $po
     * @param array $data
     * @return POItem
     */
    public function addItem(PurchaseOrder $po, array $data): POItem
    {
        return $po->items()->create([
            'product_variant_id' => $data['product_variant_id'],
            'uom_id' => $data['uom_id'],
            'ordered_qty' => $data['ordered_qty'],
            'unit_cost' => $data['unit_cost'],
            'discount_percent' => $data['discount_percent'] ?? 0,
            'tax_percent' => $data['tax_percent'] ?? 0,
            'notes' => $data['notes'] ?? null,
            'expected_date' => $data['expected_date'] ?? null,
        ]);
    }

    /**
     * Submit purchase order for approval
     *
     * @param PurchaseOrder $po
     * @return PurchaseOrder
     * @throws Exception
     */
    public function submitForApproval(PurchaseOrder $po): PurchaseOrder
    {
        if ($po->status !== PurchaseOrder::STATUS_DRAFT) {
            throw new Exception("Only draft purchase orders can be submitted for approval");
        }

        if ($po->items()->count() === 0) {
            throw new Exception("Cannot submit purchase order without line items");
        }

        $po->update(['status' => PurchaseOrder::STATUS_SUBMITTED]);
        Log::info("Purchase Order {$po->po_number} submitted for approval");

        return $po->fresh();
    }

    /**
     * Approve a purchase order
     *
     * @param PurchaseOrder $po
     * @param User $approver
     * @return PurchaseOrder
     * @throws Exception
     */
    public function approve(PurchaseOrder $po, User $approver): PurchaseOrder
    {
        if (!$po->canBeApproved()) {
            throw new Exception("Purchase order {$po->po_number} cannot be approved in current status");
        }

        // Check approval authority (can be customized based on PO value)
        // For now, any user with appropriate permissions can approve
        // In production, you might check: if ($po->total_amount > $approver->approval_limit) { throw... }

        $po->update([
            'status' => PurchaseOrder::STATUS_APPROVED,
            'approved_by' => $approver->id,
            'approved_date' => now(),
        ]);

        Log::info("Purchase Order {$po->po_number} approved by user {$approver->id}");

        return $po->fresh();
    }

    /**
     * Mark purchase order as ordered (sent to supplier)
     *
     * @param PurchaseOrder $po
     * @param string|null $supplierReference
     * @return PurchaseOrder
     * @throws Exception
     */
    public function markAsOrdered(PurchaseOrder $po, ?string $supplierReference = null): PurchaseOrder
    {
        if ($po->status !== PurchaseOrder::STATUS_APPROVED) {
            throw new Exception("Only approved purchase orders can be marked as ordered");
        }

        $po->update([
            'status' => PurchaseOrder::STATUS_ORDERED,
            'ordered_date' => now(),
            'supplier_reference' => $supplierReference,
        ]);

        Log::info("Purchase Order {$po->po_number} marked as ordered");

        return $po->fresh();
    }

    /**
     * Cancel a purchase order
     *
     * @param PurchaseOrder $po
     * @param string|null $reason
     * @return PurchaseOrder
     * @throws Exception
     */
    public function cancel(PurchaseOrder $po, ?string $reason = null): PurchaseOrder
    {
        if (!$po->canBeCancelled()) {
            throw new Exception("Purchase order {$po->po_number} cannot be cancelled");
        }

        if ($po->items()->where('received_qty', '>', 0)->exists()) {
            throw new Exception("Cannot cancel purchase order with received items");
        }

        $po->update([
            'status' => PurchaseOrder::STATUS_CANCELLED,
            'notes' => $po->notes . "\n\nCancellation reason: " . ($reason ?? 'Not specified'),
        ]);

        Log::info("Purchase Order {$po->po_number} cancelled. Reason: {$reason}");

        return $po->fresh();
    }

    /**
     * Close a purchase order (when all items are received or no longer expected)
     *
     * @param PurchaseOrder $po
     * @return PurchaseOrder
     * @throws Exception
     */
    public function close(PurchaseOrder $po): PurchaseOrder
    {
        if (in_array($po->status, [PurchaseOrder::STATUS_CLOSED, PurchaseOrder::STATUS_CANCELLED])) {
            throw new Exception("Purchase order {$po->po_number} is already closed or cancelled");
        }

        $po->update(['status' => PurchaseOrder::STATUS_CLOSED]);
        Log::info("Purchase Order {$po->po_number} closed");

        return $po->fresh();
    }

    /**
     * Update PO status based on received quantities
     * This will be called from GRN processing in Week 4
     *
     * @param PurchaseOrder $po
     * @return void
     */
    public function updateStatusBasedOnReceipts(PurchaseOrder $po): void
    {
        $allItemsFullyReceived = true;
        $anyItemPartiallyReceived = false;

        foreach ($po->items as $item) {
            if (!$item->is_fully_received) {
                $allItemsFullyReceived = false;
            }
            if ($item->is_partially_received) {
                $anyItemPartiallyReceived = true;
            }
        }

        if ($allItemsFullyReceived) {
            $po->update(['status' => PurchaseOrder::STATUS_RECEIVED]);
            Log::info("Purchase Order {$po->po_number} marked as fully received");
        } elseif ($anyItemPartiallyReceived) {
            $po->update(['status' => PurchaseOrder::STATUS_PARTIAL]);
            Log::info("Purchase Order {$po->po_number} marked as partially received");
        }
    }

    /**
     * Get purchase order summary statistics
     *
     * @param array $filters
     * @return array
     */
    public function getSummaryStats(array $filters = []): array
    {
        $query = PurchaseOrder::query();

        // Apply filters
        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }
        if (isset($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }
        if (isset($filters['date_from'])) {
            $query->where('order_date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('order_date', '<=', $filters['date_to']);
        }

        return [
            'total_count' => (clone $query)->count(),
            'total_value' => (clone $query)->sum('total_amount'),
            'pending_approval' => (clone $query)->where('status', PurchaseOrder::STATUS_SUBMITTED)->count(),
            'approved' => (clone $query)->where('status', PurchaseOrder::STATUS_APPROVED)->count(),
            'in_transit' => (clone $query)->whereIn('status', [PurchaseOrder::STATUS_ORDERED, PurchaseOrder::STATUS_PARTIAL])->count(),
            'overdue' => (clone $query)->overdue()->count(),
            'completed' => (clone $query)->where('status', PurchaseOrder::STATUS_RECEIVED)->count(),
        ];
    }

    /**
     * Get items awaiting receipt
     *
     * @param int|null $warehouseId
     * @return \Illuminate\Support\Collection
     */
    public function getItemsAwaitingReceipt(?int $warehouseId = null)
    {
        $query = POItem::query()
            ->with(['purchaseOrder.supplier', 'productVariant.product', 'uom'])
            ->whereHas('purchaseOrder', function ($q) use ($warehouseId) {
                $q->whereIn('status', [
                    PurchaseOrder::STATUS_APPROVED,
                    PurchaseOrder::STATUS_ORDERED,
                    PurchaseOrder::STATUS_PARTIAL
                ]);

                if ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId);
                }
            })
            ->whereColumn('received_qty', '<', 'ordered_qty');

        return $query->get();
    }
}
