<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Exception;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $suppliers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    /**
     * Store a newly created supplier
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:suppliers,code',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'contact_json' => 'nullable|array',
            'payment_terms' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'tax_id' => 'nullable|string|max:50',
            'rating' => 'nullable|integer|min:0|max:5',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();

            // Generate code if not provided
            if (!isset($data['code'])) {
                $data['code'] = Supplier::generateCode();
            }

            $supplier = Supplier::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Supplier created successfully',
                'data' => $supplier,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create supplier: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified supplier
     */
    public function show(int $id): JsonResponse
    {
        $supplier = Supplier::with(['purchaseOrders' => function ($query) {
            $query->orderBy('order_date', 'desc')->limit(10);
        }])->find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:suppliers,code,' . $id,
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'contact_json' => 'nullable|array',
            'payment_terms' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'tax_id' => 'nullable|string|max:50',
            'rating' => 'nullable|integer|min:0|max:5',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $supplier->update($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Supplier updated successfully',
                'data' => $supplier->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update supplier: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified supplier
     */
    public function destroy(int $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier not found',
            ], 404);
        }

        // Check if supplier has active purchase orders
        $activePOs = $supplier->activePurchaseOrders()->count();
        if ($activePOs > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete supplier with {$activePOs} active purchase orders",
            ], 422);
        }

        try {
            $supplier->delete();

            return response()->json([
                'success' => true,
                'message' => 'Supplier deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete supplier: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get supplier statistics
     */
    public function stats(int $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier not found',
            ], 404);
        }

        $stats = [
            'total_purchase_orders' => $supplier->purchaseOrders()->count(),
            'active_purchase_orders' => $supplier->activePurchaseOrders()->count(),
            'total_value' => $supplier->purchaseOrders()->sum('total_amount'),
            'active_value' => $supplier->activePurchaseOrders()->sum('total_amount'),
            'credit_available' => $supplier->credit_limit
                ? $supplier->credit_limit - $supplier->getActivePurchaseOrdersValueAttribute()
                : null,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
