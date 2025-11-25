<?php

use App\Http\Controllers\Api\StockController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Stock API Routes
|--------------------------------------------------------------------------
|
| These routes handle stock inventory queries and operations.
| All routes are prefixed with /api/stock and protected by authentication.
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Get stock summary for a product variant
    Route::get('/variants/{variantId}/summary', [StockController::class, 'getStockSummary'])
        ->name('api.stock.summary');

    // Get stock breakdown by warehouse
    Route::get('/variants/{variantId}/by-warehouse', [StockController::class, 'getStockByWarehouse'])
        ->name('api.stock.by-warehouse');

    // Get stock on hand
    Route::get('/variants/{variantId}/on-hand', [StockController::class, 'getStockOnHand'])
        ->name('api.stock.on-hand');

    // Get available stock (on hand minus reserved)
    Route::get('/variants/{variantId}/available', [StockController::class, 'getAvailableStock'])
        ->name('api.stock.available');

    // Get stock state (in_stock, low_stock, out_of_stock, etc.)
    Route::get('/variants/{variantId}/state', [StockController::class, 'getStockState'])
        ->name('api.stock.state');

    // Verify stock balance accuracy
    Route::post('/variants/{variantId}/verify', [StockController::class, 'verifyBalance'])
        ->name('api.stock.verify');

    // Get low stock products
    Route::get('/low-stock', [StockController::class, 'getLowStock'])
        ->name('api.stock.low-stock');

    // Get out of stock products
    Route::get('/out-of-stock', [StockController::class, 'getOutOfStock'])
        ->name('api.stock.out-of-stock');
});
