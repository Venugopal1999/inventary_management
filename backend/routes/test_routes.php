<?php

use Illuminate\Support\Facades\Route;
use App\Models\StockBalance;

// Test route to create low stock scenario
Route::get('/test/create-low-stock', function () {
    $balance = StockBalance::where('product_variant_id', 1)->first();

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
