<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    /**
     * Get list of all warehouses
     */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query();

        // Filter by active status
        if ($request->filled('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        $warehouses = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $warehouses,
        ]);
    }

    /**
     * Get a specific warehouse with details
     */
    public function show(int $id): JsonResponse
    {
        $warehouse = Warehouse::with(['locations'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $warehouse,
        ]);
    }

    /**
     * Get locations for a specific warehouse
     */
    public function getLocations(int $warehouseId): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($warehouseId);
        $locations = Location::where('warehouse_id', $warehouseId)
            ->orderBy('code', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
    }
}
