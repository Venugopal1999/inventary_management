<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockCount;
use App\Models\StockCountItem;
use App\Services\StockCountService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockCountController extends Controller
{
    protected StockCountService $service;

    public function __construct(StockCountService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $query = StockCount::with(['warehouse', 'location', 'creator', 'items']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
        if ($request->has('scope')) {
            $query->where('scope', $request->scope);
        }

        $counts = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($counts);
    }

    public function show(int $id): JsonResponse
    {
        $count = $this->service->getCountDetails($id);
        return response()->json($count);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'location_id' => 'nullable|exists:locations,id',
            'scope' => 'required|in:cycle,full',
            'scheduled_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'auto_post_if_no_variance' => 'nullable|boolean',
            'variance_threshold' => 'nullable|numeric',
        ]);

        try {
            $count = $this->service->createCount($validated);
            return response()->json(['message' => 'Count created successfully', 'data' => $count], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create count', 'error' => $e->getMessage()], 400);
        }
    }

    public function start(int $id): JsonResponse
    {
        try {
            $count = StockCount::findOrFail($id);
            $count = $this->service->start($count);
            return response()->json(['message' => 'Count started successfully', 'data' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to start count', 'error' => $e->getMessage()], 400);
        }
    }

    public function recordCount(Request $request, int $countId, int $itemId): JsonResponse
    {
        $validated = $request->validate([
            'counted_qty' => 'required|numeric|min:0',
        ]);

        try {
            $item = StockCountItem::where('stock_count_id', $countId)
                ->where('id', $itemId)
                ->firstOrFail();

            $item = $this->service->recordCount($item, $validated['counted_qty']);
            return response()->json(['message' => 'Count recorded successfully', 'data' => $item]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to record count', 'error' => $e->getMessage()], 400);
        }
    }

    public function complete(int $id): JsonResponse
    {
        try {
            $count = StockCount::findOrFail($id);
            $count = $this->service->complete($count);
            return response()->json(['message' => 'Count completed successfully', 'data' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to complete count', 'error' => $e->getMessage()], 400);
        }
    }

    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['notes' => 'nullable|string']);

        try {
            $count = StockCount::findOrFail($id);
            $count = $this->service->review($count, $validated['notes'] ?? null);
            return response()->json(['message' => 'Count reviewed successfully', 'data' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to review count', 'error' => $e->getMessage()], 400);
        }
    }

    public function post(int $id): JsonResponse
    {
        try {
            $count = StockCount::findOrFail($id);
            $count = $this->service->post($count);
            return response()->json(['message' => 'Count posted successfully', 'data' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to post count', 'error' => $e->getMessage()], 400);
        }
    }

    public function getVarianceSummary(int $id): JsonResponse
    {
        try {
            $count = StockCount::findOrFail($id);
            $summary = $this->service->getVarianceSummary($count);
            return response()->json($summary);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to get variance summary', 'error' => $e->getMessage()], 400);
        }
    }

    public function cancel(int $id): JsonResponse
    {
        try {
            $count = StockCount::findOrFail($id);
            $count = $this->service->cancel($count);
            return response()->json(['message' => 'Count cancelled successfully', 'data' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel count', 'error' => $e->getMessage()], 400);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $count = StockCount::findOrFail($id);
            $count->delete();
            return response()->json(['message' => 'Count deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete count', 'error' => $e->getMessage()], 400);
        }
    }
}
