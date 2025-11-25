<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Services\SalesOrderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Exception;

class SalesOrderController extends Controller
{
    protected SalesOrderService $soService;

    public function __construct(SalesOrderService $soService)
    {
        $this->soService = $soService;
    }

    /**
     * Display a listing of sales orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = SalesOrder::with(['customer', 'creator']);

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by status (supports comma-separated values)
        if ($request->filled('status')) {
            $statuses = is_array($request->status)
                ? $request->status
                : explode(',', $request->status);
            $query->whereIn('status', $statuses);
        }

        // Filter by customer
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('order_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('order_date', '<=', $request->date_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'order_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $salesOrders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $salesOrders,
        ]);
    }

    /**
     * Store a newly created sales order
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'price_list_id' => 'nullable|exists:price_lists,id',
            'order_date' => 'nullable|date',
            'promise_date' => 'nullable|date|after_or_equal:order_date',
            'currency' => 'nullable|string|max:3',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.uom_id' => 'nullable|exists:uoms,id',
            'items.*.ordered_qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $salesOrder = $this->soService->createSalesOrder($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Sales order created successfully',
                'data' => $salesOrder,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create sales order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified sales order
     */
    public function show(int $id): JsonResponse
    {
        try {
            $salesOrder = $this->soService->getSalesOrderDetails($id);

            return response()->json([
                'success' => true,
                'data' => $salesOrder,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }
    }

    /**
     * Update the specified sales order
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $salesOrder = SalesOrder::find($id);

        if (!$salesOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'customer_id' => 'sometimes|required|exists:customers,id',
            'price_list_id' => 'nullable|exists:price_lists,id',
            'order_date' => 'nullable|date',
            'promise_date' => 'nullable|date|after_or_equal:order_date',
            'currency' => 'nullable|string|max:3',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'items' => 'nullable|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.uom_id' => 'nullable|exists:uoms,id',
            'items.*.ordered_qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $salesOrder = $this->soService->updateSalesOrder($salesOrder, $validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Sales order updated successfully',
                'data' => $salesOrder,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update sales order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm sales order
     */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $salesOrder = SalesOrder::find($id);

        if (!$salesOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }

        try {
            $autoAllocate = $request->get('auto_allocate', true);
            $salesOrder = $this->soService->confirmSalesOrder($salesOrder, $autoAllocate);

            return response()->json([
                'success' => true,
                'message' => 'Sales order confirmed successfully',
                'data' => $salesOrder,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm sales order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Allocate stock for sales order
     */
    public function allocate(int $id): JsonResponse
    {
        $salesOrder = SalesOrder::find($id);

        if (!$salesOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }

        try {
            $results = $this->soService->allocateStock($salesOrder);

            return response()->json([
                'success' => true,
                'message' => 'Stock allocation completed',
                'data' => [
                    'sales_order' => $salesOrder->fresh(['items', 'customer']),
                    'allocation_results' => $results,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to allocate stock: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Release stock reservations
     */
    public function releaseReservations(int $id): JsonResponse
    {
        $salesOrder = SalesOrder::find($id);

        if (!$salesOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }

        try {
            $this->soService->releaseReservations($salesOrder);

            return response()->json([
                'success' => true,
                'message' => 'Stock reservations released successfully',
                'data' => $salesOrder->fresh(['items', 'customer']),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to release reservations: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel sales order
     */
    public function cancel(int $id): JsonResponse
    {
        $salesOrder = SalesOrder::find($id);

        if (!$salesOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }

        try {
            $salesOrder = $this->soService->cancelSalesOrder($salesOrder);

            return response()->json([
                'success' => true,
                'message' => 'Sales order cancelled successfully',
                'data' => $salesOrder,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel sales order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check ATP (Available to Promise)
     */
    public function checkATP(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_variant_id' => 'required|exists:product_variants,id',
            'required_qty' => 'required|numeric|min:0.01',
            'warehouse_id' => 'nullable|exists:warehouses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $atp = $this->soService->checkATP(
                $request->product_variant_id,
                $request->required_qty,
                $request->warehouse_id
            );

            return response()->json([
                'success' => true,
                'data' => $atp,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check ATP: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified sales order
     */
    public function destroy(int $id): JsonResponse
    {
        $salesOrder = SalesOrder::find($id);

        if (!$salesOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Sales order not found',
            ], 404);
        }

        // Only allow deletion of draft orders
        if ($salesOrder->status !== SalesOrder::STATUS_DRAFT) {
            return response()->json([
                'success' => false,
                'message' => 'Only draft sales orders can be deleted',
            ], 400);
        }

        try {
            $salesOrder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sales order deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete sales order: ' . $e->getMessage(),
            ], 500);
        }
    }
}
