<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\SalesOrder;
use App\Services\ShipmentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShipmentController extends Controller
{
    protected ShipmentService $shipmentService;

    public function __construct(ShipmentService $shipmentService)
    {
        $this->shipmentService = $shipmentService;
    }

    /**
     * Display a listing of shipments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Shipment::with(['salesOrder.customer', 'items']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by sales order
        if ($request->has('sales_order_id')) {
            $query->where('sales_order_id', $request->sales_order_id);
        }

        // Filter by tracking number
        if ($request->has('tracking_number')) {
            $query->where('tracking_number', 'LIKE', "%{$request->tracking_number}%");
        }

        // Filter by date range
        if ($request->has('shipped_from')) {
            $query->where('shipped_at', '>=', $request->shipped_from);
        }
        if ($request->has('shipped_to')) {
            $query->where('shipped_at', '<=', $request->shipped_to);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 15);
        $shipments = $query->paginate($perPage);

        return response()->json($shipments);
    }

    /**
     * Show a single shipment
     */
    public function show(int $id): JsonResponse
    {
        $shipment = $this->shipmentService->getShipmentDetails($id);

        return response()->json($shipment);
    }

    /**
     * Create a new shipment from a sales order
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'carrier' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            $salesOrder = SalesOrder::findOrFail($validated['sales_order_id']);

            $shipment = $this->shipmentService->createShipment($salesOrder, $validated);

            // Add items from reservations
            $shipment = $this->shipmentService->addItemsFromReservations($shipment);

            return response()->json([
                'message' => 'Shipment created successfully',
                'data' => $shipment,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create shipment',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update shipment
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'carrier' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'shipping_cost' => 'nullable|numeric|min:0',
            'box_weight' => 'nullable|numeric|min:0',
            'box_dimensions' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        try {
            $shipment = Shipment::findOrFail($id);

            if (!$shipment->canEdit()) {
                return response()->json([
                    'message' => 'Shipment cannot be edited',
                ], 403);
            }

            $shipment->update($validated);

            return response()->json([
                'message' => 'Shipment updated successfully',
                'data' => $shipment->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update shipment',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Mark shipment as picked
     */
    public function markAsPicked(Request $request, int $id): JsonResponse
    {
        try {
            $shipment = Shipment::findOrFail($id);
            $shipment = $this->shipmentService->markAsPicked($shipment, $request->all());

            return response()->json([
                'message' => 'Shipment marked as picked',
                'data' => $shipment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark shipment as picked',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Mark shipment as packed
     */
    public function markAsPacked(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'box_weight' => 'nullable|numeric|min:0',
            'box_dimensions' => 'nullable|array',
            'box_dimensions.length' => 'nullable|numeric|min:0',
            'box_dimensions.width' => 'nullable|numeric|min:0',
            'box_dimensions.height' => 'nullable|numeric|min:0',
            'box_dimensions.unit' => 'nullable|string|in:cm,in',
        ]);

        try {
            $shipment = Shipment::findOrFail($id);
            $shipment = $this->shipmentService->markAsPacked($shipment, $validated);

            return response()->json([
                'message' => 'Shipment marked as packed',
                'data' => $shipment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark shipment as packed',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Ship the shipment
     */
    public function ship(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'carrier' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'shipped_at' => 'nullable|date',
        ]);

        try {
            $shipment = Shipment::findOrFail($id);
            $shipment = $this->shipmentService->ship($shipment, $validated);

            return response()->json([
                'message' => 'Shipment shipped successfully',
                'data' => $shipment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to ship shipment',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Scan barcode for picking
     */
    public function scan(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'barcode' => 'required|string',
        ]);

        try {
            $shipment = Shipment::findOrFail($id);
            $result = $this->shipmentService->scanItemForPicking($shipment, $validated['barcode']);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Scan failed',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Cancel shipment
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $shipment = Shipment::findOrFail($id);
            $shipment = $this->shipmentService->cancelShipment($shipment);

            return response()->json([
                'message' => 'Shipment cancelled successfully',
                'data' => $shipment,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel shipment',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete shipment
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $shipment = Shipment::findOrFail($id);

            if (!$shipment->canEdit()) {
                return response()->json([
                    'message' => 'Shipment cannot be deleted',
                ], 403);
            }

            $shipment->delete();

            return response()->json([
                'message' => 'Shipment deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete shipment',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
