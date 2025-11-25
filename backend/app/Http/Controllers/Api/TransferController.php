<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Services\TransferService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransferController extends Controller
{
    protected TransferService $service;

    public function __construct(TransferService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Transfer::with(['fromWarehouse', 'toWarehouse', 'requester', 'items']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('from_warehouse_id')) {
            $query->where('from_warehouse_id', $request->from_warehouse_id);
        }
        if ($request->has('to_warehouse_id')) {
            $query->where('to_warehouse_id', $request->to_warehouse_id);
        }

        $transfers = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($transfers);
    }

    public function show(int $id): JsonResponse
    {
        $transfer = $this->service->getTransferDetails($id);
        return response()->json($transfer);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'carrier' => 'nullable|string',
            'tracking_number' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.from_location_id' => 'nullable|exists:locations,id',
            'items.*.to_location_id' => 'nullable|exists:locations,id',
            'items.*.lot_id' => 'nullable|exists:inventory_lots,id',
            'items.*.uom_id' => 'required|exists:uoms,id',
            'items.*.qty_requested' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'nullable|numeric',
            'items.*.notes' => 'nullable|string',
        ]);

        try {
            $transfer = $this->service->createTransfer($validated);
            return response()->json(['message' => 'Transfer created successfully', 'data' => $transfer], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create transfer', 'error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'carrier' => 'nullable|string',
            'tracking_number' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
        ]);

        try {
            $transfer = Transfer::findOrFail($id);
            $transfer = $this->service->updateTransfer($transfer, $validated);
            return response()->json(['message' => 'Transfer updated successfully', 'data' => $transfer]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update transfer', 'error' => $e->getMessage()], 400);
        }
    }

    public function approve(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::findOrFail($id);
            $transfer = $this->service->approve($transfer);
            return response()->json(['message' => 'Transfer approved successfully', 'data' => $transfer]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve transfer', 'error' => $e->getMessage()], 400);
        }
    }

    public function ship(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::findOrFail($id);
            $transfer = $this->service->ship($transfer);
            return response()->json(['message' => 'Transfer shipped successfully', 'data' => $transfer]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to ship transfer', 'error' => $e->getMessage()], 400);
        }
    }

    public function receive(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'received_quantities' => 'nullable|array',
            'received_quantities.*' => 'nullable|numeric|min:0',
        ]);

        try {
            $transfer = Transfer::findOrFail($id);
            $transfer = $this->service->receive($transfer, $validated['received_quantities'] ?? []);
            return response()->json(['message' => 'Transfer received successfully', 'data' => $transfer]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to receive transfer', 'error' => $e->getMessage()], 400);
        }
    }

    public function cancel(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::findOrFail($id);
            $transfer = $this->service->cancel($transfer);
            return response()->json(['message' => 'Transfer cancelled successfully', 'data' => $transfer]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel transfer', 'error' => $e->getMessage()], 400);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::findOrFail($id);
            $transfer->delete();
            return response()->json(['message' => 'Transfer deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete transfer', 'error' => $e->getMessage()], 400);
        }
    }
}
