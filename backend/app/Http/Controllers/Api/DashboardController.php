<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics()
    {
        $totalProducts = Product::count();
        $totalWarehouses = Warehouse::count();

        // Low stock items - products with variants that have low stock
        // For now, we'll set this to 0 since we need inventory tracking setup
        $lowStockItems = 0;

        // Pending orders - placeholder for when purchase/sales orders are implemented
        $pendingOrders = 0;

        return response()->json([
            'total_products' => $totalProducts,
            'total_warehouses' => $totalWarehouses,
            'low_stock_items' => $lowStockItems,
            'pending_orders' => $pendingOrders,
        ]);
    }
}
