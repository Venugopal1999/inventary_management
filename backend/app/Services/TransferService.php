<?php

namespace App\Services;

use App\Models\Transfer;
use App\Models\TransferItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class TransferService
{
    protected StockMovementService $stockMovementService;

    public function __construct(StockMovementService $stockMovementService)
    {
        $this->stockMovementService = $stockMovementService;
    }

    /**
     * Create a new transfer
     */
    public function createTransfer(array $data): Transfer
    {
        // Validate warehouses are different
        if ($data['from_warehouse_id'] === $data['to_warehouse_id']) {
            throw new Exception('Source and destination warehouses must be different');
        }

        return DB::transaction(function () use ($data) {
            $transfer = Transfer::create([
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'status' => 'draft',
                'requested_at' => now(),
                'requested_by' => Auth::id(),
                'carrier' => $data['carrier'] ?? null,
                'tracking_number' => $data['tracking_number'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Create transfer items
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $this->addTransferItem($transfer, $itemData);
                }
            }

            return $transfer->fresh(['items', 'fromWarehouse', 'toWarehouse']);
        });
    }

    /**
     * Update an existing transfer
     */
    public function updateTransfer(Transfer $transfer, array $data): Transfer
    {
        if (!$transfer->canEdit()) {
            throw new Exception('Transfer cannot be edited in current status');
        }

        return DB::transaction(function () use ($transfer, $data) {
            $transfer->update([
                'carrier' => $data['carrier'] ?? $transfer->carrier,
                'tracking_number' => $data['tracking_number'] ?? $transfer->tracking_number,
                'notes' => $data['notes'] ?? $transfer->notes,
            ]);

            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $transfer->items()->delete();

                // Create new items
                foreach ($data['items'] as $itemData) {
                    $this->addTransferItem($transfer, $itemData);
                }
            }

            return $transfer->fresh(['items', 'fromWarehouse', 'toWarehouse']);
        });
    }

    /**
     * Add an item to a transfer
     */
    protected function addTransferItem(Transfer $transfer, array $itemData): TransferItem
    {
        return TransferItem::create([
            'transfer_id' => $transfer->id,
            'product_variant_id' => $itemData['product_variant_id'],
            'from_location_id' => $itemData['from_location_id'] ?? null,
            'to_location_id' => $itemData['to_location_id'] ?? null,
            'lot_id' => $itemData['lot_id'] ?? null,
            'uom_id' => $itemData['uom_id'],
            'qty_requested' => $itemData['qty_requested'],
            'unit_cost' => $itemData['unit_cost'] ?? null,
            'notes' => $itemData['notes'] ?? null,
        ]);
    }

    /**
     * Approve a transfer
     */
    public function approve(Transfer $transfer): Transfer
    {
        if (!$transfer->canBeApproved()) {
            throw new Exception('Transfer cannot be approved');
        }

        $transfer->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return $transfer->fresh();
    }

    /**
     * Ship the transfer (removes stock from source warehouse)
     */
    public function ship(Transfer $transfer): Transfer
    {
        if (!$transfer->canBeShipped()) {
            throw new Exception('Transfer cannot be shipped');
        }

        return DB::transaction(function () use ($transfer) {
            // Create negative stock movements for source warehouse
            foreach ($transfer->items as $item) {
                // Remove stock from source warehouse
                $this->stockMovementService->createMovement([
                    'product_variant_id' => $item->product_variant_id,
                    'warehouse_id' => $transfer->from_warehouse_id,
                    'location_id' => $item->from_location_id,
                    'lot_id' => $item->lot_id,
                    'qty_delta' => -abs($item->qty_requested),
                    'uom_id' => $item->uom_id,
                    'unit_cost' => $item->unit_cost,
                    'ref_type' => 'TRANSFER',
                    'ref_id' => $transfer->id,
                    'note' => "Transfer {$transfer->transfer_number} - Shipped to {$transfer->toWarehouse->name}",
                    'user_id' => Auth::id(),
                ]);

                // Update item shipped quantity
                $item->update(['qty_shipped' => $item->qty_requested]);
            }

            // Update transfer status
            $transfer->update([
                'status' => 'in_transit',
                'shipped_by' => Auth::id(),
                'shipped_at' => now(),
            ]);

            return $transfer->fresh();
        });
    }

    /**
     * Receive the transfer (adds stock to destination warehouse)
     */
    public function receive(Transfer $transfer, array $receivedQuantities = []): Transfer
    {
        if (!$transfer->canBeReceived()) {
            throw new Exception('Transfer cannot be received');
        }

        return DB::transaction(function () use ($transfer, $receivedQuantities) {
            // Create positive stock movements for destination warehouse
            foreach ($transfer->items as $item) {
                $qtyReceived = $receivedQuantities[$item->id] ?? $item->qty_shipped;

                if ($qtyReceived > 0) {
                    // Add stock to destination warehouse
                    $this->stockMovementService->createMovement([
                        'product_variant_id' => $item->product_variant_id,
                        'warehouse_id' => $transfer->to_warehouse_id,
                        'location_id' => $item->to_location_id,
                        'lot_id' => $item->lot_id,
                        'qty_delta' => abs($qtyReceived),
                        'uom_id' => $item->uom_id,
                        'unit_cost' => $item->unit_cost,
                        'ref_type' => 'TRANSFER',
                        'ref_id' => $transfer->id,
                        'note' => "Transfer {$transfer->transfer_number} - Received from {$transfer->fromWarehouse->name}",
                        'user_id' => Auth::id(),
                    ]);

                    // Update item received quantity
                    $item->update(['qty_received' => $qtyReceived]);
                }
            }

            // Update transfer status
            $transfer->update([
                'status' => 'received',
                'received_by' => Auth::id(),
                'received_at' => now(),
            ]);

            return $transfer->fresh();
        });
    }

    /**
     * Cancel a transfer
     */
    public function cancel(Transfer $transfer): Transfer
    {
        if ($transfer->status === 'received') {
            throw new Exception('Received transfers cannot be cancelled');
        }

        if ($transfer->status === 'in_transit') {
            throw new Exception('Transfers in transit cannot be cancelled. Please receive them first.');
        }

        $transfer->update(['status' => 'cancelled']);

        return $transfer->fresh();
    }

    /**
     * Get transfer details
     */
    public function getTransferDetails(int $transferId): Transfer
    {
        return Transfer::with([
            'fromWarehouse',
            'toWarehouse',
            'items.productVariant.product',
            'items.fromLocation',
            'items.toLocation',
            'items.lot',
            'items.uom',
            'requester',
            'approver',
            'shipper',
            'receiver',
        ])->findOrFail($transferId);
    }
}
