<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StockBalance;
use App\Models\ProductVariant;

echo "Updating Wireless Mouse to Low Stock...\n";

$variant = ProductVariant::find(1);
if ($variant) {
    echo "Product: {$variant->product->name}\n";
    echo "Reorder Min: {$variant->reorder_min}\n";
    echo "Low Stock Threshold (20%): " . ($variant->reorder_min * 0.2) . "\n";
}

$balance = StockBalance::where('product_variant_id', 1)->first();

if ($balance) {
    $balance->qty_on_hand = 8;
    $balance->qty_available = 8;
    $balance->qty_reserved = 0;
    $balance->save();

    echo "\n✓ Stock updated!\n";
    echo "On Hand: 8 units\n";
    echo "Available: 8 units\n";
    echo "This should trigger LOW STOCK badge (8 < 20 × 0.2 = 4 is false...)\n";
    echo "Wait, let me set it to 3 units instead...\n";

    $balance->qty_on_hand = 3;
    $balance->qty_available = 3;
    $balance->save();

    echo "\n✓ Stock updated again!\n";
    echo "On Hand: 3 units\n";
    echo "Available: 3 units\n";
    echo "This WILL trigger LOW STOCK badge (3 <= 20 × 0.2 = 4) ✓\n";
} else {
    echo "Error: Stock balance not found\n";
}
