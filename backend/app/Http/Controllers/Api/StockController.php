<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StockService;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Get stock summary for a product variant.
     *
     * @param Request $request
     * @param int $variantId
     * @return JsonResponse
     */
    public function getStockSummary(Request $request, int $variantId): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');

        $summary = $this->stockService->getStockSummary($variantId, $warehouseId);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get stock breakdown by warehouse for a product variant.
     *
     * @param int $variantId
     * @return JsonResponse
     */
    public function getStockByWarehouse(int $variantId): JsonResponse
    {
        $breakdown = $this->stockService->getStockByWarehouse($variantId);

        return response()->json([
            'success' => true,
            'data' => $breakdown,
        ]);
    }

    /**
     * Get stock on hand for a product variant.
     *
     * @param Request $request
     * @param int $variantId
     * @return JsonResponse
     */
    public function getStockOnHand(Request $request, int $variantId): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');
        $locationId = $request->query('location_id');

        $stockOnHand = $this->stockService->getStockOnHand(
            $variantId,
            $warehouseId,
            $locationId
        );

        return response()->json([
            'success' => true,
            'data' => [
                'product_variant_id' => $variantId,
                'warehouse_id' => $warehouseId,
                'location_id' => $locationId,
                'qty_on_hand' => $stockOnHand,
            ],
        ]);
    }

    /**
     * Verify stock balance accuracy.
     *
     * @param Request $request
     * @param int $variantId
     * @return JsonResponse
     */
    public function verifyBalance(Request $request, int $variantId): JsonResponse
    {
        $request->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'location_id' => 'nullable|integer|exists:locations,id',
        ]);

        $verification = $this->stockService->verifyBalance(
            $variantId,
            $request->warehouse_id,
            $request->location_id
        );

        return response()->json([
            'success' => true,
            'data' => $verification,
        ]);
    }

    /**
     * Get low stock products.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getLowStock(Request $request): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');
        $limit = $request->query('limit', 50);

        $lowStockProducts = $this->stockService->getLowStockProducts($warehouseId, $limit);

        return response()->json([
            'success' => true,
            'data' => $lowStockProducts,
            'meta' => [
                'count' => $lowStockProducts->count(),
                'limit' => $limit,
            ],
        ]);
    }

    /**
     * Get out of stock products.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getOutOfStock(Request $request): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');
        $limit = $request->query('limit', 50);

        $outOfStockProducts = $this->stockService->getOutOfStockProducts($warehouseId, $limit);

        return response()->json([
            'success' => true,
            'data' => $outOfStockProducts,
            'meta' => [
                'count' => $outOfStockProducts->count(),
                'limit' => $limit,
            ],
        ]);
    }

    /**
     * Get stock state for a product variant.
     *
     * @param Request $request
     * @param int $variantId
     * @return JsonResponse
     */
    public function getStockState(Request $request, int $variantId): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');

        $variant = ProductVariant::findOrFail($variantId);
        $state = $this->stockService->getStockState(
            $variantId,
            $warehouseId,
            $variant->reorder_min
        );

        return response()->json([
            'success' => true,
            'data' => [
                'product_variant_id' => $variantId,
                'warehouse_id' => $warehouseId,
                'state' => $state,
            ],
        ]);
    }

    /**
     * Get available stock (on hand minus reserved).
     *
     * @param Request $request
     * @param int $variantId
     * @return JsonResponse
     */
    public function getAvailableStock(Request $request, int $variantId): JsonResponse
    {
        $warehouseId = $request->query('warehouse_id');
        $locationId = $request->query('location_id');

        $availableStock = $this->stockService->getAvailableStock(
            $variantId,
            $warehouseId,
            $locationId
        );

        return response()->json([
            'success' => true,
            'data' => [
                'product_variant_id' => $variantId,
                'warehouse_id' => $warehouseId,
                'location_id' => $locationId,
                'qty_available' => $availableStock,
            ],
        ]);
    }
}
