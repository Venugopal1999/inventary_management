<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;

/*
|--------------------------------------------------------------------------
| Purchasing API Routes (Week 3)
|--------------------------------------------------------------------------
|
| These routes handle suppliers and purchase orders with authentication.
| All routes are prefixed with /api/purchasing
|
*/

Route::middleware('auth:sanctum')->group(function () {

    // ========================================
    // Suppliers
    // ========================================
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);           // List suppliers
        Route::post('/', [SupplierController::class, 'store']);          // Create supplier
        Route::get('/{id}', [SupplierController::class, 'show']);        // Get supplier details
        Route::put('/{id}', [SupplierController::class, 'update']);      // Update supplier
        Route::delete('/{id}', [SupplierController::class, 'destroy']);  // Delete supplier
        Route::get('/{id}/stats', [SupplierController::class, 'stats']); // Get supplier statistics
    });

    // ========================================
    // Purchase Orders
    // ========================================
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

        // Reports and summaries
        Route::get('/summary/stats', [PurchaseOrderController::class, 'summary']);           // Get summary stats
        Route::get('/items/awaiting-receipt', [PurchaseOrderController::class, 'awaitingReceipt']); // Items awaiting receipt
    });
});
