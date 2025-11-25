<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReplenishmentSuggestion;
use App\Services\ReplenishmentService;
use Illuminate\Http\Request;

class ReplenishmentController extends Controller
{
    protected $replenishmentService;

    public function __construct(ReplenishmentService $replenishmentService)
    {
        $this->replenishmentService = $replenishmentService;
    }

    /**
     * Get all replenishment suggestions
     */
    public function index(Request $request)
    {
        $query = ReplenishmentSuggestion::with([
            'productVariant.product',
            'warehouse',
            'supplier',
            'purchaseOrder',
            'reorderRule'
        ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by warehouse
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Only pending by default
        if (!$request->has('status')) {
            $query->where('status', 'pending');
        }

        // Sort by priority (critical first) - PostgreSQL compatible
        $query->orderByRaw("CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5 END");
        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $suggestions = $query->paginate($perPage);

        return response()->json($suggestions);
    }

    /**
     * Generate new replenishment suggestions
     */
    public function generate(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');

        $suggestions = $this->replenishmentService->generateSuggestions($warehouseId);

        return response()->json([
            'message' => 'Replenishment suggestions generated successfully',
            'count' => count($suggestions),
            'data' => $suggestions,
        ]);
    }

    /**
     * Get a specific suggestion
     */
    public function show($id)
    {
        $suggestion = ReplenishmentSuggestion::with([
            'productVariant.product',
            'warehouse',
            'supplier',
            'purchaseOrder',
            'reorderRule'
        ])->findOrFail($id);

        return response()->json($suggestion);
    }

    /**
     * Dismiss a suggestion
     */
    public function dismiss(Request $request, $id)
    {
        $suggestion = ReplenishmentSuggestion::findOrFail($id);

        $reason = $request->get('reason');
        $suggestion->dismiss($reason);

        return response()->json([
            'message' => 'Suggestion dismissed',
            'data' => $suggestion,
        ]);
    }

    /**
     * Create PO from suggestions
     */
    public function createPurchaseOrder(Request $request)
    {
        $suggestionIds = $request->get('suggestion_ids', []);
        $supplierId = $request->get('supplier_id');

        if (empty($suggestionIds)) {
            return response()->json([
                'message' => 'No suggestions selected',
            ], 422);
        }

        $purchaseOrder = $this->replenishmentService->createPurchaseOrderFromSuggestions(
            $suggestionIds,
            $supplierId,
            $request->user()
        );

        return response()->json([
            'message' => 'Purchase order created successfully',
            'data' => $purchaseOrder,
        ], 201);
    }

    /**
     * Get summary statistics
     */
    public function summary(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');

        $summary = $this->replenishmentService->getSummary($warehouseId);

        return response()->json($summary);
    }

    /**
     * Bulk dismiss suggestions
     */
    public function bulkDismiss(Request $request)
    {
        $suggestionIds = $request->get('suggestion_ids', []);
        $reason = $request->get('reason');

        $dismissed = 0;
        foreach ($suggestionIds as $id) {
            try {
                $suggestion = ReplenishmentSuggestion::findOrFail($id);
                $suggestion->dismiss($reason);
                $dismissed++;
            } catch (\Exception $e) {
                continue;
            }
        }

        return response()->json([
            'message' => 'Suggestions dismissed',
            'dismissed' => $dismissed,
        ]);
    }
}
