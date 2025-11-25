<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;

class PurchaseOrderController extends Controller
{
    protected PurchaseOrderService $poService;

    public function __construct(PurchaseOrderService $poService)
    {
        $this->poService = $poService;
    }

    /**
     * Display a listing of purchase orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with(['supplier', 'warehouse', 'creator']);

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

        // Filter by supplier
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Filter by warehouse
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('order_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('order_date', '<=', $request->date_to);
        }

        // Filter overdue
        if ($request->has('overdue') && filter_var($request->overdue, FILTER_VALIDATE_BOOLEAN)) {
            $query->overdue();
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'order_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $pos = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $pos,
        ]);
    }

    /**
     * Store a newly created purchase order
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'currency' => 'nullable|string|max:3',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms_and_conditions' => 'nullable|string',
            'items' => 'nullable|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.uom_id' => 'required|exists:uoms,id',
            'items.*.ordered_qty' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.notes' => 'nullable|string',
            'items.*.expected_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $po = $this->poService->createPurchaseOrder(
                $validator->validated(),
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase order created successfully',
                'data' => $po,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create purchase order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified purchase order
     */
    public function show(int $id): JsonResponse
    {
        $po = PurchaseOrder::with([
            'supplier',
            'warehouse',
            'items.productVariant.product',
            'items.uom',
            'creator',
            'approver',
        ])->find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $po,
        ]);
    }

    /**
     * Update the specified purchase order
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'warehouse_id' => 'sometimes|required|exists:warehouses,id',
            'status' => 'sometimes|required|in:draft,submitted,approved,ordered,partial,received,closed,cancelled',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date',
            'currency' => 'nullable|string|max:3',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms_and_conditions' => 'nullable|string',
            'supplier_reference' => 'nullable|string|max:255',
            'items' => 'nullable|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.uom_id' => 'required|exists:uoms,id',
            'items.*.ordered_qty' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.notes' => 'nullable|string',
            'items.*.expected_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $po = $this->poService->updatePurchaseOrder($po, $validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Purchase order updated successfully',
                'data' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified purchase order
     */
    public function destroy(int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        if (!$po->isEditable()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete purchase order in ' . $po->status . ' status',
            ], 422);
        }

        try {
            $po->delete();

            return response()->json([
                'success' => true,
                'message' => 'Purchase order deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete purchase order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit purchase order for approval
     */
    public function submit(int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        try {
            $po = $this->poService->submitForApproval($po);

            return response()->json([
                'success' => true,
                'message' => 'Purchase order submitted for approval',
                'data' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Approve a purchase order
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        try {
            $po = $this->poService->approve($po, $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Purchase order approved successfully',
                'data' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mark purchase order as ordered (sent to supplier)
     */
    public function markOrdered(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'supplier_reference' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $po = $this->poService->markAsOrdered(
                $po,
                $request->supplier_reference
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase order marked as ordered',
                'data' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cancel a purchase order
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $po = $this->poService->cancel($po, $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Purchase order cancelled successfully',
                'data' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Close a purchase order
     */
    public function close(int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        try {
            $po = $this->poService->close($po);

            return response()->json([
                'success' => true,
                'message' => 'Purchase order closed successfully',
                'data' => $po,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get purchase order summary statistics
     */
    public function summary(Request $request): JsonResponse
    {
        $filters = $request->only(['supplier_id', 'warehouse_id', 'date_from', 'date_to']);
        $stats = $this->poService->getSummaryStats($filters);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get items awaiting receipt
     */
    public function awaitingReceipt(Request $request): JsonResponse
    {
        $warehouseId = $request->get('warehouse_id');
        $items = $this->poService->getItemsAwaitingReceipt($warehouseId);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Generate PDF for purchase order
     *
     * Note: This returns the HTML view. To generate actual PDF, install:
     * composer require barryvdh/laravel-dompdf
     * Then use: return PDF::loadView('pdf.purchase-order', compact('po'))->download($filename);
     */
    public function downloadPdf(int $id)
    {
        $po = PurchaseOrder::with([
            'supplier',
            'warehouse',
            'items.productVariant.product',
            'items.uom',
            'creator',
            'approver',
        ])->find($id);

        if (!$po) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);
        }

        // Generate PDF from view
        $pdf = Pdf::loadView('pdf.purchase-order', compact('po'));

        // Set PDF options
        $pdf->setPaper('a4', 'portrait');

        // Download the PDF with a specific filename
        return $pdf->download("{$po->po_number}.pdf");
    }
}
