<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReorderRule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReorderRuleController extends Controller
{
    /**
     * Display a listing of reorder rules
     */
    public function index(Request $request)
    {
        $query = ReorderRule::with(['productVariant.product', 'warehouse', 'preferredSupplier']);

        // Filter by warehouse
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Filter by product variant
        if ($request->has('product_variant_id')) {
            $query->where('product_variant_id', $request->product_variant_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $rules = $query->paginate($perPage);

        return response()->json($rules);
    }

    /**
     * Store a newly created reorder rule
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_variant_id' => 'required|exists:product_variants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'min_qty' => 'required|numeric|min:0',
            'max_qty' => 'required|numeric|min:0|gt:min_qty',
            'reorder_qty' => 'nullable|numeric|min:0',
            'preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'lead_time_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check for duplicate rule (same variant + warehouse)
        $existing = ReorderRule::where('product_variant_id', $request->product_variant_id)
            ->where('warehouse_id', $request->warehouse_id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Reorder rule already exists for this product variant and warehouse',
            ], 409);
        }

        $rule = ReorderRule::create($request->all());
        $rule->load(['productVariant.product', 'warehouse', 'preferredSupplier']);

        return response()->json([
            'message' => 'Reorder rule created successfully',
            'data' => $rule,
        ], 201);
    }

    /**
     * Display the specified reorder rule
     */
    public function show($id)
    {
        $rule = ReorderRule::with(['productVariant.product', 'warehouse', 'preferredSupplier'])
            ->findOrFail($id);

        return response()->json($rule);
    }

    /**
     * Update the specified reorder rule
     */
    public function update(Request $request, $id)
    {
        $rule = ReorderRule::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'min_qty' => 'sometimes|numeric|min:0',
            'max_qty' => 'sometimes|numeric|min:0|gt:min_qty',
            'reorder_qty' => 'nullable|numeric|min:0',
            'preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'lead_time_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rule->update($request->all());
        $rule->load(['productVariant.product', 'warehouse', 'preferredSupplier']);

        return response()->json([
            'message' => 'Reorder rule updated successfully',
            'data' => $rule,
        ]);
    }

    /**
     * Remove the specified reorder rule
     */
    public function destroy($id)
    {
        $rule = ReorderRule::findOrFail($id);
        $rule->delete();

        return response()->json([
            'message' => 'Reorder rule deleted successfully',
        ]);
    }

    /**
     * Bulk create reorder rules
     */
    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'rules' => 'required|array',
            'rules.*.product_variant_id' => 'required|exists:product_variants,id',
            'rules.*.warehouse_id' => 'required|exists:warehouses,id',
            'rules.*.min_qty' => 'required|numeric|min:0',
            'rules.*.max_qty' => 'required|numeric|min:0',
            'rules.*.reorder_qty' => 'nullable|numeric|min:0',
            'rules.*.preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'rules.*.lead_time_days' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $created = [];
        $skipped = [];

        foreach ($request->rules as $ruleData) {
            // Check for duplicate
            $existing = ReorderRule::where('product_variant_id', $ruleData['product_variant_id'])
                ->where('warehouse_id', $ruleData['warehouse_id'])
                ->first();

            if ($existing) {
                $skipped[] = $ruleData;
                continue;
            }

            $created[] = ReorderRule::create($ruleData);
        }

        return response()->json([
            'message' => 'Bulk reorder rules creation completed',
            'created' => count($created),
            'skipped' => count($skipped),
            'data' => $created,
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive($id)
    {
        $rule = ReorderRule::findOrFail($id);
        $rule->update(['is_active' => !$rule->is_active]);

        return response()->json([
            'message' => 'Reorder rule status updated',
            'data' => $rule,
        ]);
    }

    /**
     * Import reorder rules from CSV
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($csvData);

        $imported = 0;
        $errors = [];

        foreach ($csvData as $index => $row) {
            try {
                $data = array_combine($header, $row);

                // Check for duplicate
                $existing = ReorderRule::where('product_variant_id', $data['product_variant_id'])
                    ->where('warehouse_id', $data['warehouse_id'])
                    ->first();

                if ($existing) {
                    $errors[] = "Row " . ($index + 2) . ": Duplicate rule";
                    continue;
                }

                ReorderRule::create([
                    'product_variant_id' => $data['product_variant_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'min_qty' => $data['min_qty'],
                    'max_qty' => $data['max_qty'],
                    'reorder_qty' => $data['reorder_qty'] ?? null,
                    'preferred_supplier_id' => $data['preferred_supplier_id'] ?? null,
                    'lead_time_days' => $data['lead_time_days'] ?? 0,
                    'is_active' => $data['is_active'] ?? true,
                    'notes' => $data['notes'] ?? null,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Import completed',
            'imported' => $imported,
            'errors' => $errors,
        ]);
    }
}
