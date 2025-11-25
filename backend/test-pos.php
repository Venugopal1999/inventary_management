<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Test query
$pos = \App\Models\PurchaseOrder::with(['supplier', 'warehouse', 'creator'])->get();

echo "Found: " . $pos->count() . " purchase orders\n\n";

foreach ($pos->take(5) as $po) {
    echo "PO: " . $po->po_number . "\n";
    echo "  Supplier: " . ($po->supplier->name ?? 'N/A') . "\n";
    echo "  Status: " . $po->status . "\n";
    echo "  Total: $" . $po->total_amount . "\n\n";
}
