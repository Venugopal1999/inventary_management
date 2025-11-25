<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LowStockAlert;
use App\Services\LowStockAlertService;
use Illuminate\Http\Request;

class LowStockAlertController extends Controller
{
    protected $lowStockAlertService;

    public function __construct(LowStockAlertService $lowStockAlertService)
    {
        $this->lowStockAlertService = $lowStockAlertService;
    }

    /**
     * Get all low stock alerts
     */
    public function index(Request $request)
    {
        $query = LowStockAlert::with([
            'productVariant.product',
            'warehouse',
            'reorderRule'
        ]);

        // Filter by resolved status
        if ($request->has('is_resolved')) {
            $query->where('is_resolved', $request->boolean('is_resolved'));
        } else {
            // Default to unresolved only
            $query->where('is_resolved', false);
        }

        // Filter by severity
        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        // Filter by warehouse
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Sort by severity (critical first) and then by created date - PostgreSQL compatible
        $query->orderByRaw("CASE severity
            WHEN 'critical' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'info' THEN 3
            ELSE 4 END");
        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $alerts = $query->paginate($perPage);

        return response()->json($alerts);
    }

    /**
     * Generate/refresh low stock alerts
     */
    public function generate(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');

        $alerts = $this->lowStockAlertService->checkAndGenerateAlerts($warehouseId);

        return response()->json([
            'message' => 'Low stock alerts generated successfully',
            'count' => count($alerts),
            'data' => $alerts,
        ]);
    }

    /**
     * Get a specific alert
     */
    public function show($id)
    {
        $alert = LowStockAlert::with([
            'productVariant.product',
            'warehouse',
            'reorderRule'
        ])->findOrFail($id);

        return response()->json($alert);
    }

    /**
     * Resolve an alert
     */
    public function resolve($id)
    {
        $alert = LowStockAlert::findOrFail($id);
        $alert->resolve();

        return response()->json([
            'message' => 'Alert resolved',
            'data' => $alert,
        ]);
    }

    /**
     * Bulk resolve alerts
     */
    public function bulkResolve(Request $request)
    {
        $alertIds = $request->get('alert_ids', []);

        $resolved = 0;
        foreach ($alertIds as $id) {
            try {
                $alert = LowStockAlert::findOrFail($id);
                $alert->resolve();
                $resolved++;
            } catch (\Exception $e) {
                continue;
            }
        }

        return response()->json([
            'message' => 'Alerts resolved',
            'resolved' => $resolved,
        ]);
    }

    /**
     * Get summary statistics
     */
    public function summary(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');

        $summary = $this->lowStockAlertService->getSummary($warehouseId);

        return response()->json($summary);
    }

    /**
     * Send alert notifications
     */
    public function sendNotifications(Request $request)
    {
        $alertIds = $request->get('alert_ids', []);

        $sent = $this->lowStockAlertService->sendAlertNotifications($alertIds);

        return response()->json([
            'message' => 'Notifications sent',
            'sent' => $sent,
        ]);
    }
}
