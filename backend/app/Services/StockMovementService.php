<?php

namespace App\Services;

use App\Models\StockMovement;
use App\Models\StockBalance;
use App\Models\InventoryLot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

class StockMovementService
{
    /**
     * Create a stock movement and update balances.
     *
     * @param array $data Movement data
     * @return StockMovement
     * @throws InvalidArgumentException
     */
    public function createMovement(array $data): StockMovement
    {
        // Validate required fields
        $this->validateMovementData($data);

        return DB::transaction(function () use ($data) {
            // Create the stock movement
            $movement = StockMovement::create([
                'product_variant_id' => $data['product_variant_id'],
                'warehouse_id' => $data['warehouse_id'],
                'location_id' => $data['location_id'] ?? null,
                'lot_id' => $data['lot_id'] ?? null,
                'qty_delta' => $data['qty_delta'],
                'uom_id' => $data['uom_id'] ?? null,
                'unit_cost' => $data['unit_cost'] ?? null,
                'ref_type' => $data['ref_type'],
                'ref_id' => $data['ref_id'],
                'note' => $data['note'] ?? null,
                'user_id' => $data['user_id'] ?? Auth::id(),
            ]);

            // Update stock balance
            $this->updateStockBalance(
                $data['product_variant_id'],
                $data['warehouse_id'],
                $data['location_id'] ?? null,
                $data['qty_delta']
            );

            // Update lot quantity if lot_id is specified
            if (isset($data['lot_id'])) {
                $this->updateLotQuantity($data['lot_id'], $data['qty_delta']);
            }

            return $movement->fresh();
        });
    }

    /**
     * Validate movement data.
     *
     * @param array $data
     * @throws InvalidArgumentException
     */
    protected function validateMovementData(array $data): void
    {
        $required = ['product_variant_id', 'warehouse_id', 'qty_delta', 'ref_type', 'ref_id'];

        foreach ($required as $field) {
            if (!isset($data[$field])) {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }
        }

        // Validate ref_type
        $validRefTypes = ['PO', 'GRN', 'SO', 'SHIPMENT', 'ADJUSTMENT', 'TRANSFER', 'COUNT'];
        if (!in_array($data['ref_type'], $validRefTypes)) {
            throw new InvalidArgumentException("Invalid ref_type. Must be one of: " . implode(', ', $validRefTypes));
        }

        // Validate qty_delta is not zero
        if ($data['qty_delta'] == 0) {
            throw new InvalidArgumentException("qty_delta cannot be zero");
        }
    }

    /**
     * Update stock balance for a product/warehouse/location.
     *
     * @param int $productVariantId
     * @param int $warehouseId
     * @param int|null $locationId
     * @param float $qtyDelta
     */
    protected function updateStockBalance(
        int $productVariantId,
        int $warehouseId,
        ?int $locationId,
        float $qtyDelta
    ): void {
        $balance = StockBalance::firstOrCreate(
            [
                'product_variant_id' => $productVariantId,
                'warehouse_id' => $warehouseId,
                'location_id' => $locationId,
            ],
            [
                'qty_on_hand' => 0,
                'qty_reserved' => 0,
                'qty_available' => 0,
                'qty_incoming' => 0,
            ]
        );

        $balance->addStock($qtyDelta);
    }

    /**
     * Update lot quantity.
     *
     * @param int $lotId
     * @param float $qtyDelta
     */
    protected function updateLotQuantity(int $lotId, float $qtyDelta): void
    {
        $lot = InventoryLot::findOrFail($lotId);
        $lot->qty_on_hand += $qtyDelta;

        // Prevent negative lot quantities
        if ($lot->qty_on_hand < 0) {
            throw new InvalidArgumentException("Insufficient stock in lot {$lot->lot_no}. Available: {$lot->qty_on_hand}");
        }

        $lot->save();
    }

    /**
     * Create a receipt movement (increase stock).
     *
     * @param array $data
     * @return StockMovement
     */
    public function receiveStock(array $data): StockMovement
    {
        // Ensure positive quantity
        $data['qty_delta'] = abs($data['qty_delta']);

        return $this->createMovement($data);
    }

    /**
     * Create a shipment movement (decrease stock).
     *
     * @param array $data
     * @return StockMovement
     */
    public function shipStock(array $data): StockMovement
    {
        // Ensure negative quantity
        $data['qty_delta'] = -abs($data['qty_delta']);

        // Validate sufficient stock
        $this->validateSufficientStock(
            $data['product_variant_id'],
            $data['warehouse_id'],
            $data['location_id'] ?? null,
            abs($data['qty_delta'])
        );

        return $this->createMovement($data);
    }

    /**
     * Validate sufficient stock is available.
     *
     * @param int $productVariantId
     * @param int $warehouseId
     * @param int|null $locationId
     * @param float $quantity
     * @throws InvalidArgumentException
     */
    protected function validateSufficientStock(
        int $productVariantId,
        int $warehouseId,
        ?int $locationId,
        float $quantity
    ): void {
        $balance = StockBalance::where('product_variant_id', $productVariantId)
            ->where('warehouse_id', $warehouseId)
            ->where('location_id', $locationId)
            ->first();

        if (!$balance || $balance->qty_available < $quantity) {
            $available = $balance ? $balance->qty_available : 0;
            throw new InvalidArgumentException(
                "Insufficient stock. Required: {$quantity}, Available: {$available}"
            );
        }
    }

    /**
     * Create an adjustment movement (can be positive or negative).
     *
     * @param array $data
     * @return StockMovement
     */
    public function adjustStock(array $data): StockMovement
    {
        $data['ref_type'] = 'ADJUSTMENT';

        // For negative adjustments, validate sufficient stock
        if ($data['qty_delta'] < 0) {
            $this->validateSufficientStock(
                $data['product_variant_id'],
                $data['warehouse_id'],
                $data['location_id'] ?? null,
                abs($data['qty_delta'])
            );
        }

        return $this->createMovement($data);
    }
}
