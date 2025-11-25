<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceipt;
use App\Services\GoodsReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class GoodsReceiptController extends Controller
{
    protected GoodsReceiptService $goodsReceiptService;

    public function __construct(GoodsReceiptService $goodsReceiptService)
    {
        $this->goodsReceiptService = $goodsReceiptService;
    }

    /**
     * Get list of all goods receipts
     */
    public function index(Request $request): JsonResponse
    {
        $query = GoodsReceipt::with([
            'purchaseOrder.supplier',
            'receiver',
            'items'
        ])->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by PO
        if ($request->filled('purchase_order_id')) {
            $query->where('purchase_order_id', $request->purchase_order_id);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->where('received_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('received_at', '<=', $request->to_date);
        }

        $receipts = $query->paginate($request->get('per_page', 15));

        return response()->json($receipts);
    }

    /**
     * Get a specific goods receipt
     */
    public function show(int $id): JsonResponse
    {
        $receipt = GoodsReceipt::with([
            'purchaseOrder.supplier',
            'purchaseOrder.items.productVariant.product',
            'purchaseOrder.items.uom',
            'receiver',
            'items.productVariant.product',
            'items.warehouse',
            'items.location',
            'items.lot',
            'items.poItem'
        ])->findOrFail($id);

        return response()->json($receipt);
    }

    /**
     * Create a new goods receipt from a PO
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'received_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $receipt = $this->goodsReceiptService->createGoodsReceipt(
                $request->purchase_order_id,
                $request->all()
            );

            return response()->json([
                'message' => 'Goods receipt created successfully',
                'data' => $receipt->load(['purchaseOrder', 'receiver'])
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to create goods receipt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Receive items for a goods receipt
     */
    public function receiveItems(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.po_item_id' => 'required|exists:po_items,id',
            'items.*.received_qty' => 'required|numeric|min:0.01',
            'items.*.warehouse_id' => 'required|exists:warehouses,id',
            'items.*.location_id' => 'nullable|exists:locations,id',
            'items.*.lot_data' => 'nullable|array',
            'items.*.lot_data.lot_no' => 'nullable|string',
            'items.*.lot_data.mfg_date' => 'nullable|date',
            'items.*.lot_data.exp_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $receipt = GoodsReceipt::findOrFail($id);

            $this->goodsReceiptService->receiveItems($receipt, $request->items);

            return response()->json([
                'message' => 'Items received successfully',
                'data' => $receipt->load(['items.productVariant', 'items.warehouse', 'items.location', 'items.lot'])
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to receive items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Post the goods receipt (complete the receiving process)
     */
    public function post(int $id): JsonResponse
    {
        try {
            $receipt = GoodsReceipt::findOrFail($id);

            $this->goodsReceiptService->postGoodsReceipt($receipt);

            return response()->json([
                'message' => 'Goods receipt posted successfully',
                'data' => $receipt->fresh()->load(['items.productVariant', 'purchaseOrder'])
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to post goods receipt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a goods receipt
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $receipt = GoodsReceipt::findOrFail($id);

            $this->goodsReceiptService->cancelGoodsReceipt($receipt);

            return response()->json([
                'message' => 'Goods receipt cancelled successfully',
                'data' => $receipt->fresh()
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel goods receipt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available locations for a warehouse
     */
    public function getLocations(int $warehouseId): JsonResponse
    {
        try {
            $locations = $this->goodsReceiptService->getAvailableLocations($warehouseId);

            return response()->json([
                'data' => $locations
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to get locations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get PO details for receiving
     */
    public function getPurchaseOrder(int $purchaseOrderId): JsonResponse
    {
        try {
            $poData = $this->goodsReceiptService->getPurchaseOrderForReceiving($purchaseOrderId);

            return response()->json([
                'data' => $poData
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to get purchase order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
