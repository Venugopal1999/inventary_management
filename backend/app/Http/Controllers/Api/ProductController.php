<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'uom', 'variants']);

        // Search by name or barcode
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('barcode', 'LIKE', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->paginate($request->per_page ?? 15);

        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku_policy' => 'required|in:simple,variant',
            'category_id' => 'nullable|exists:categories,id',
            'uom_id' => 'required|exists:uoms,id',
            'barcode' => 'nullable|string|unique:products,barcode',
            'track_serial' => 'boolean',
            'track_batch' => 'boolean',
            'shelf_life_days' => 'nullable|integer|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'required|in:active,inactive,discontinued',
            'image_url' => 'nullable|url',

            // For simple SKU products
            'sku' => 'required_if:sku_policy,simple|nullable|string|unique:product_variants,sku',
            'cost' => 'nullable|numeric|min:0',
            'price' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::create($request->only([
            'name',
            'description',
            'sku_policy',
            'category_id',
            'uom_id',
            'barcode',
            'track_serial',
            'track_batch',
            'shelf_life_days',
            'tax_rate',
            'status',
            'image_url',
        ]));

        // For simple SKU products, create a default variant
        if ($request->sku_policy === 'simple') {
            ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $request->sku,
                'cost' => $request->cost,
                'price' => $request->price,
            ]);
        }

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product->load(['category', 'uom', 'variants'])
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show($id)
    {
        $product = Product::with(['category', 'uom', 'variants'])->findOrFail($id);
        return response()->json($product);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'uom_id' => 'sometimes|required|exists:uoms,id',
            'barcode' => 'nullable|string|unique:products,barcode,' . $id,
            'track_serial' => 'boolean',
            'track_batch' => 'boolean',
            'shelf_life_days' => 'nullable|integer|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'sometimes|required|in:active,inactive,discontinued',
            'image_url' => 'nullable|url',

            // For simple SKU products
            'sku' => 'nullable|string',
            'cost' => 'nullable|numeric|min:0',
            'price' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product->update($request->only([
            'name',
            'description',
            'category_id',
            'uom_id',
            'barcode',
            'track_serial',
            'track_batch',
            'shelf_life_days',
            'tax_rate',
            'status',
            'image_url',
        ]));

        // Update variant if simple SKU
        if ($product->sku_policy === 'simple' && $product->variants()->count() > 0) {
            $variant = $product->variants()->first();
            $variant->update($request->only(['sku', 'cost', 'price']));
        }

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->load(['category', 'uom', 'variants'])
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Import products from CSV.
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // CSV import skeleton
        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));
        $header = array_shift($data);

        $imported = 0;
        $errors = [];

        foreach ($data as $row) {
            try {
                $productData = array_combine($header, $row);

                // Basic validation and import logic
                // TODO: Implement full CSV import logic

                $imported++;
            } catch (\Exception $e) {
                $errors[] = $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'CSV import completed',
            'imported' => $imported,
            'errors' => $errors
        ]);
    }

    /**
     * Export products to CSV.
     */
    public function export()
    {
        $products = Product::with(['category', 'uom', 'variants'])->get();

        $csv = [];
        $csv[] = ['ID', 'Name', 'SKU', 'Category', 'UOM', 'Barcode', 'Status', 'Cost', 'Price'];

        foreach ($products as $product) {
            $variant = $product->variants()->first();
            $csv[] = [
                $product->id,
                $product->name,
                $variant?->sku ?? '',
                $product->category?->name ?? '',
                $product->uom?->symbol ?? '',
                $product->barcode ?? '',
                $product->status,
                $variant?->cost ?? '',
                $variant?->price ?? '',
            ];
        }

        $filename = 'products_export_' . date('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($csv) {
            $handle = fopen('php://output', 'w');
            foreach ($csv as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
