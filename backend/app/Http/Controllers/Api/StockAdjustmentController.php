<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Services\StockAdjustmentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockAdjustmentController extends Controller
{
    protected StockAdjustmentService $service;

    public function __construct(StockAdjustmentService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $query = StockAdjustment::with(['warehouse', 'creator', 'items']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
        if ($request->has('reason')) {
            $query->where('reason', $request->reason);
        }

        $adjustments = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($adjustments);
    }

    public function show(int $id): JsonResponse
    {
        $adjustment = $this->service->getAdjustmentDetails($id);
        return response()->json($adjustment);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'reason' => 'required|in:damage,writeoff,found,loss,expired,quality_issue,miscellaneous',
            'reason_notes' => 'nullable|string',
            'requires_approval' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.location_id' => 'nullable|exists:locations,id',
            'items.*.lot_id' => 'nullable|exists:inventory_lots,id',
            'items.*.uom_id' => 'required|exists:uoms,id',
            'items.*.qty_delta' => 'required|numeric',
            'items.*.unit_cost' => 'nullable|numeric',
            'items.*.note' => 'nullable|string',
        ]);

        try {
            $adjustment = $this->service->createAdjustment($validated);
            return response()->json(['message' => 'Adjustment created successfully', 'data' => $adjustment], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create adjustment', 'error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'reason' => 'nullable|in:damage,writeoff,found,loss,expired,quality_issue,miscellaneous',
            'reason_notes' => 'nullable|string',
            'items' => 'nullable|array',
        ]);

        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $adjustment = $this->service->updateAdjustment($adjustment, $validated);
            return response()->json(['message' => 'Adjustment updated successfully', 'data' => $adjustment]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update adjustment', 'error' => $e->getMessage()], 400);
        }
    }

    public function submitForApproval(int $id): JsonResponse
    {
        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $adjustment = $this->service->submitForApproval($adjustment);
            return response()->json(['message' => 'Adjustment submitted for approval', 'data' => $adjustment]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to submit adjustment', 'error' => $e->getMessage()], 400);
        }
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['approval_notes' => 'nullable|string']);

        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $adjustment = $this->service->approve($adjustment, $validated['approval_notes'] ?? null);
            return response()->json(['message' => 'Adjustment approved successfully', 'data' => $adjustment]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve adjustment', 'error' => $e->getMessage()], 400);
        }
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['approval_notes' => 'nullable|string']);

        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $adjustment = $this->service->reject($adjustment, $validated['approval_notes'] ?? null);
            return response()->json(['message' => 'Adjustment rejected', 'data' => $adjustment]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to reject adjustment', 'error' => $e->getMessage()], 400);
        }
    }

    public function post(int $id): JsonResponse
    {
        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $adjustment = $this->service->post($adjustment);
            return response()->json(['message' => 'Adjustment posted successfully', 'data' => $adjustment]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to post adjustment', 'error' => $e->getMessage()], 400);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $this->service->cancel($adjustment);
            return response()->json(['message' => 'Adjustment cancelled successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel adjustment', 'error' => $e->getMessage()], 400);
        }
    }
}
