<?php

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\UomController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\GoodsReceiptController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\CustomerReturnController;
use App\Http\Controllers\Api\StockAdjustmentController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\StockCountController;
use App\Http\Controllers\Api\ReorderRuleController;
use App\Http\Controllers\Api\ReplenishmentController;
use App\Http\Controllers\Api\LowStockAlertController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (if needed)
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Test route to create low stock scenario
Route::get('/test/create-low-stock', function () {
    $balance = \App\Models\StockBalance::where('product_variant_id', 1)->first();

    if ($balance) {
        $balance->qty_on_hand = 3;
        $balance->qty_available = 3;
        $balance->qty_reserved = 0;
        $balance->save();

        return response()->json([
            'success' => true,
            'message' => 'Wireless Mouse updated to LOW STOCK',
            'data' => [
                'product_variant_id' => 1,
                'qty_on_hand' => 3,
                'qty_available' => 3,
                'note' => 'This will trigger LOW STOCK badge (3 <= 20 × 0.2 = 4)'
            ]
        ]);
    }

    return response()->json(['success' => false, 'message' => 'Stock balance not found'], 404);
});

// Auth routes (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public reference data (needed for forms)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/uoms', [UomController::class, 'index']);

// Public stock data (read-only for displaying in product lists)
Route::prefix('stock')->group(function () {
    Route::get('/variants/{variantId}/summary', [StockController::class, 'getStockSummary']);
    Route::get('/variants/{variantId}/state', [StockController::class, 'getStockState']);
    Route::get('/variants/{variantId}/on-hand', [StockController::class, 'getStockOnHand']);
    Route::get('/variants/{variantId}/available', [StockController::class, 'getAvailableStock']);
});

// Protected routes (require authentication)
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth user routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('dashboard/metrics', [DashboardController::class, 'metrics']);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::post('products/import', [ProductController::class, 'import']);
    Route::get('products/export', [ProductController::class, 'export']);

    // Categories (create, update, delete require auth)
    Route::post('categories', [CategoryController::class, 'store']);
    Route::get('categories/{id}', [CategoryController::class, 'show']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

    // UOMs (create, update, delete require auth)
    Route::post('uoms', [UomController::class, 'store']);
    Route::get('uoms/{id}', [UomController::class, 'show']);
    Route::put('uoms/{id}', [UomController::class, 'update']);
    Route::delete('uoms/{id}', [UomController::class, 'destroy']);

    // Stock API Routes (Week 2) - Protected endpoints
    Route::prefix('stock')->group(function () {
        Route::get('/variants/{variantId}/by-warehouse', [StockController::class, 'getStockByWarehouse']);
        Route::post('/variants/{variantId}/verify', [StockController::class, 'verifyBalance']);
        Route::get('/low-stock', [StockController::class, 'getLowStock']);
        Route::get('/out-of-stock', [StockController::class, 'getOutOfStock']);
    });

    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // ========================================
    // Purchasing API Routes (Week 3)
    // ========================================

    // Suppliers
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);           // List suppliers
        Route::post('/', [SupplierController::class, 'store']);          // Create supplier
        Route::get('/{id}', [SupplierController::class, 'show']);        // Get supplier details
        Route::put('/{id}', [SupplierController::class, 'update']);      // Update supplier
        Route::delete('/{id}', [SupplierController::class, 'destroy']);  // Delete supplier
        Route::get('/{id}/stats', [SupplierController::class, 'stats']); // Get supplier statistics
    });

    // Purchase Orders
    Route::prefix('purchase-orders')->group(function () {
        // CRUD operations
        Route::get('/', [PurchaseOrderController::class, 'index']);           // List purchase orders
        Route::post('/', [PurchaseOrderController::class, 'store']);          // Create purchase order
        Route::get('/{id}', [PurchaseOrderController::class, 'show']);        // Get PO details
        Route::put('/{id}', [PurchaseOrderController::class, 'update']);      // Update purchase order
        Route::delete('/{id}', [PurchaseOrderController::class, 'destroy']);  // Delete purchase order

        // Status transitions
        Route::post('/{id}/submit', [PurchaseOrderController::class, 'submit']);       // Submit for approval
        Route::post('/{id}/approve', [PurchaseOrderController::class, 'approve']);     // Approve PO
        Route::post('/{id}/mark-ordered', [PurchaseOrderController::class, 'markOrdered']); // Mark as ordered
        Route::post('/{id}/cancel', [PurchaseOrderController::class, 'cancel']);       // Cancel PO
        Route::post('/{id}/close', [PurchaseOrderController::class, 'close']);         // Close PO

        // PDF generation
        Route::get('/{id}/pdf', [PurchaseOrderController::class, 'downloadPdf']);      // Download PO as PDF
    });

    // PO Reports and summaries
    Route::get('/purchase-orders/summary/stats', [PurchaseOrderController::class, 'summary']);           // Get summary stats
    Route::get('/purchase-orders/items/awaiting-receipt', [PurchaseOrderController::class, 'awaitingReceipt']); // Items awaiting receipt

    // ========================================
    // Warehouse API Routes (Week 2)
    // ========================================

    // Warehouses
    Route::prefix('warehouses')->group(function () {
        Route::get('/', [WarehouseController::class, 'index']);                      // List warehouses
        Route::get('/{id}', [WarehouseController::class, 'show']);                   // Get warehouse details
        Route::get('/{warehouseId}/locations', [WarehouseController::class, 'getLocations']); // Get warehouse locations
    });

    // ========================================
    // Goods Receipt (GRN) API Routes (Week 4)
    // ========================================

    // Goods Receipts
    Route::prefix('goods-receipts')->group(function () {
        // CRUD operations
        Route::get('/', [GoodsReceiptController::class, 'index']);           // List goods receipts
        Route::post('/', [GoodsReceiptController::class, 'store']);          // Create goods receipt
        Route::get('/{id}', [GoodsReceiptController::class, 'show']);        // Get GRN details

        // Receiving operations
        Route::post('/{id}/receive-items', [GoodsReceiptController::class, 'receiveItems']);  // Receive items
        Route::post('/{id}/post', [GoodsReceiptController::class, 'post']);                   // Post GRN (complete)
        Route::post('/{id}/cancel', [GoodsReceiptController::class, 'cancel']);               // Cancel GRN
    });

    // Helper endpoints for GRN wizard
    Route::get('/purchase-orders/{purchaseOrderId}/for-receiving', [GoodsReceiptController::class, 'getPurchaseOrder']); // Get PO for receiving

    // ========================================
    // Sales & Customers API Routes (Week 5)
    // ========================================

    // Customers
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);           // List customers
        Route::post('/', [CustomerController::class, 'store']);          // Create customer
        Route::get('/{id}', [CustomerController::class, 'show']);        // Get customer details
        Route::put('/{id}', [CustomerController::class, 'update']);      // Update customer
        Route::delete('/{id}', [CustomerController::class, 'destroy']);  // Delete customer
    });

    // Sales Orders
    Route::prefix('sales-orders')->group(function () {
        // CRUD operations
        Route::get('/', [SalesOrderController::class, 'index']);           // List sales orders
        Route::post('/', [SalesOrderController::class, 'store']);          // Create sales order
        Route::get('/{id}', [SalesOrderController::class, 'show']);        // Get SO details
        Route::put('/{id}', [SalesOrderController::class, 'update']);      // Update sales order
        Route::delete('/{id}', [SalesOrderController::class, 'destroy']);  // Delete sales order

        // Status transitions and operations
        Route::post('/{id}/confirm', [SalesOrderController::class, 'confirm']);                      // Confirm SO
        Route::post('/{id}/allocate', [SalesOrderController::class, 'allocate']);                    // Allocate stock
        Route::post('/{id}/release-reservations', [SalesOrderController::class, 'releaseReservations']); // Release reservations
        Route::post('/{id}/cancel', [SalesOrderController::class, 'cancel']);                        // Cancel SO
    });

    // ATP (Available to Promise) check
    Route::post('/atp/check', [SalesOrderController::class, 'checkATP']);  // Check ATP

    // ========================================
    // Shipments API Routes (Week 6)
    // ========================================

    // Shipments
    Route::prefix('shipments')->group(function () {
        // CRUD operations
        Route::get('/', [ShipmentController::class, 'index']);           // List shipments
        Route::post('/', [ShipmentController::class, 'store']);          // Create shipment
        Route::get('/{id}', [ShipmentController::class, 'show']);        // Get shipment details
        Route::put('/{id}', [ShipmentController::class, 'update']);      // Update shipment
        Route::delete('/{id}', [ShipmentController::class, 'destroy']);  // Delete shipment

        // Shipment workflow operations
        Route::post('/{id}/mark-picked', [ShipmentController::class, 'markAsPicked']);      // Mark as picked
        Route::post('/{id}/mark-packed', [ShipmentController::class, 'markAsPacked']);      // Mark as packed
        Route::post('/{id}/ship', [ShipmentController::class, 'ship']);                     // Ship shipment
        Route::post('/{id}/cancel', [ShipmentController::class, 'cancel']);                 // Cancel shipment

        // Barcode scanning for picking
        Route::post('/{id}/scan', [ShipmentController::class, 'scan']);                     // Scan barcode
    });

    // ========================================
    // Customer Returns API Routes (Week 6)
    // ========================================

    // Customer Returns
    Route::prefix('customer-returns')->group(function () {
        // CRUD operations
        Route::get('/', [CustomerReturnController::class, 'index']);           // List customer returns
        Route::post('/', [CustomerReturnController::class, 'store']);          // Create customer return
        Route::get('/{id}', [CustomerReturnController::class, 'show']);        // Get return details
        Route::put('/{id}', [CustomerReturnController::class, 'update']);      // Update return
        Route::delete('/{id}', [CustomerReturnController::class, 'destroy']);  // Delete return

        // Return workflow operations
        Route::post('/{id}/approve', [CustomerReturnController::class, 'approve']);         // Approve return
        Route::post('/{id}/reject', [CustomerReturnController::class, 'reject']);           // Reject return
        Route::post('/{id}/mark-received', [CustomerReturnController::class, 'markAsReceived']); // Mark as received
        Route::post('/{id}/process-refund', [CustomerReturnController::class, 'processRefund']); // Process refund
        Route::post('/{id}/cancel', [CustomerReturnController::class, 'cancel']);           // Cancel return
    });

    // ========================================
    // Inventory Control API Routes (Week 7)
    // ========================================

    // Stock Adjustments
    Route::prefix('stock-adjustments')->group(function () {
        Route::get('/', [StockAdjustmentController::class, 'index']);           // List adjustments
        Route::post('/', [StockAdjustmentController::class, 'store']);          // Create adjustment
        Route::get('/{id}', [StockAdjustmentController::class, 'show']);        // Get adjustment details
        Route::put('/{id}', [StockAdjustmentController::class, 'update']);      // Update adjustment
        Route::delete('/{id}', [StockAdjustmentController::class, 'destroy']);  // Cancel adjustment

        // Adjustment workflow operations
        Route::post('/{id}/submit', [StockAdjustmentController::class, 'submitForApproval']); // Submit for approval
        Route::post('/{id}/approve', [StockAdjustmentController::class, 'approve']);          // Approve
        Route::post('/{id}/reject', [StockAdjustmentController::class, 'reject']);            // Reject
        Route::post('/{id}/post', [StockAdjustmentController::class, 'post']);                // Post (create movements)
    });

    // Transfers
    Route::prefix('transfers')->group(function () {
        Route::get('/', [TransferController::class, 'index']);           // List transfers
        Route::post('/', [TransferController::class, 'store']);          // Create transfer
        Route::get('/{id}', [TransferController::class, 'show']);        // Get transfer details
        Route::put('/{id}', [TransferController::class, 'update']);      // Update transfer
        Route::delete('/{id}', [TransferController::class, 'destroy']);  // Delete transfer

        // Transfer workflow operations
        Route::post('/{id}/approve', [TransferController::class, 'approve']);   // Approve transfer
        Route::post('/{id}/ship', [TransferController::class, 'ship']);         // Ship transfer (remove from source)
        Route::post('/{id}/receive', [TransferController::class, 'receive']);   // Receive transfer (add to destination)
        Route::post('/{id}/cancel', [TransferController::class, 'cancel']);     // Cancel transfer
    });

    // Stock Counts
    Route::prefix('stock-counts')->group(function () {
        Route::get('/', [StockCountController::class, 'index']);           // List counts
        Route::post('/', [StockCountController::class, 'store']);          // Create count
        Route::get('/{id}', [StockCountController::class, 'show']);        // Get count details
        Route::delete('/{id}', [StockCountController::class, 'destroy']);  // Delete count

        // Count workflow operations
        Route::post('/{id}/start', [StockCountController::class, 'start']);           // Start counting
        Route::post('/{id}/items/{itemId}/record', [StockCountController::class, 'recordCount']); // Record count for item
        Route::post('/{id}/complete', [StockCountController::class, 'complete']);     // Complete counting
        Route::post('/{id}/review', [StockCountController::class, 'review']);         // Review count
        Route::post('/{id}/post', [StockCountController::class, 'post']);             // Post variances
        Route::post('/{id}/cancel', [StockCountController::class, 'cancel']);         // Cancel count

        // Get variance summary
        Route::get('/{id}/variance-summary', [StockCountController::class, 'getVarianceSummary']);
    });

    // ========================================
    // Replenishment & Alerts API Routes (Week 8)
    // ========================================

    // Reorder Rules
    Route::prefix('reorder-rules')->group(function () {
        Route::get('/', [ReorderRuleController::class, 'index']);                  // List reorder rules
        Route::post('/', [ReorderRuleController::class, 'store']);                 // Create reorder rule
        Route::get('/{id}', [ReorderRuleController::class, 'show']);               // Get rule details
        Route::put('/{id}', [ReorderRuleController::class, 'update']);             // Update rule
        Route::delete('/{id}', [ReorderRuleController::class, 'destroy']);         // Delete rule

        // Bulk operations
        Route::post('/bulk', [ReorderRuleController::class, 'bulkStore']);         // Bulk create rules
        Route::post('/import', [ReorderRuleController::class, 'import']);          // Import from CSV
        Route::post('/{id}/toggle-active', [ReorderRuleController::class, 'toggleActive']); // Toggle active status
    });

    // Replenishment Suggestions
    Route::prefix('replenishment')->group(function () {
        Route::get('/suggestions', [ReplenishmentController::class, 'index']);              // List suggestions
        Route::post('/suggestions/generate', [ReplenishmentController::class, 'generate']); // Generate suggestions
        Route::get('/suggestions/{id}', [ReplenishmentController::class, 'show']);          // Get suggestion details
        Route::post('/suggestions/{id}/dismiss', [ReplenishmentController::class, 'dismiss']); // Dismiss suggestion
        Route::post('/suggestions/bulk-dismiss', [ReplenishmentController::class, 'bulkDismiss']); // Bulk dismiss

        // Create PO from suggestions
        Route::post('/create-purchase-order', [ReplenishmentController::class, 'createPurchaseOrder']); // Create PO

        // Summary and reports
        Route::get('/summary', [ReplenishmentController::class, 'summary']);                // Get summary stats
    });

    // Low Stock Alerts
    Route::prefix('low-stock-alerts')->group(function () {
        Route::get('/', [LowStockAlertController::class, 'index']);                        // List alerts
        Route::post('/generate', [LowStockAlertController::class, 'generate']);            // Generate alerts
        Route::get('/{id}', [LowStockAlertController::class, 'show']);                     // Get alert details
        Route::post('/{id}/resolve', [LowStockAlertController::class, 'resolve']);         // Resolve alert
        Route::post('/bulk-resolve', [LowStockAlertController::class, 'bulkResolve']);     // Bulk resolve

        // Notifications
        Route::post('/send-notifications', [LowStockAlertController::class, 'sendNotifications']); // Send notifications

        // Summary and reports
        Route::get('/summary', [LowStockAlertController::class, 'summary']);               // Get summary stats
    });

    // ========================================
    // Reports API Routes (Week 9)
    // ========================================

    Route::prefix('reports')->group(function () {
        // List available reports
        Route::get('/', [ReportController::class, 'index']);                              // List all reports

        // Dashboard summary
        Route::get('/dashboard', [ReportController::class, 'dashboard']);                 // Get report dashboard

        // Individual reports (supports ?format=csv or ?format=xlsx)
        Route::get('/stock-on-hand', [ReportController::class, 'stockOnHand']);           // Stock on Hand by Warehouse
        Route::get('/inventory-valuation', [ReportController::class, 'inventoryValuation']); // Inventory Valuation (FIFO)
        Route::get('/stock-movement', [ReportController::class, 'stockMovement']);        // Stock Movement History
        Route::get('/expiry-aging', [ReportController::class, 'expiryAging']);            // Expiry Aging Report
        Route::get('/movers-analysis', [ReportController::class, 'moversAnalysis']);      // Top/Slow Movers Analysis

        // Background job routes
        Route::post('/schedule', [ReportController::class, 'scheduleReport']);            // Schedule background report
        Route::get('/job-status/{jobId}', [ReportController::class, 'jobStatus']);        // Check job status
        Route::get('/download/{encodedPath}', [ReportController::class, 'downloadFile']); // Download generated file
        Route::get('/my-jobs', [ReportController::class, 'myJobs']);                      // Get user's recent jobs
    });
});
