<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Services\StockService;

class VerifyStockCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:verify';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify stock balance accuracy by comparing with sum of movements';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $stockService = new StockService();

        $this->info('Verifying stock balances...');
        $this->newLine();

        $balances = StockBalance::with(['productVariant.product', 'warehouse', 'location'])->get();

        $results = [];
        $totalVariances = 0;

        foreach ($balances as $balance) {
            $verification = $stockService->verifyBalance(
                $balance->product_variant_id,
                $balance->warehouse_id,
                $balance->location_id
            );

            $sku = $balance->productVariant->sku;
            $warehouse = $balance->warehouse->code;
            $location = $balance->location?->code ?? 'Default';

            $results[] = [
                'Product' => $sku,
                'Warehouse' => $warehouse,
                'Location' => $location,
                'Balance' => number_format($verification['balance'], 2),
                'Movements Sum' => number_format($verification['movements_sum'], 2),
                'Variance' => number_format($verification['variance'], 4),
                'Status' => $verification['is_accurate'] ? '✓' : '✗',
            ];

            if (!$verification['is_accurate']) {
                $totalVariances++;
            }
        }

        $this->table(
            ['Product', 'Warehouse', 'Location', 'Balance', 'Movements Sum', 'Variance', 'Status'],
            $results
        );

        $this->newLine();

        if ($totalVariances === 0) {
            $this->info("✓ All stock balances are accurate! ({$balances->count()} balances verified)");
        } else {
            $this->error("✗ Found {$totalVariances} balance(s) with variances out of {$balances->count()} total");
        }

        // Show stock states
        $this->newLine();
        $this->info('Stock States Summary:');
        $this->newLine();

        $variants = ProductVariant::with('product')->take(10)->get();
        $stateResults = [];

        foreach ($variants as $variant) {
            $summary = $stockService->getStockSummary($variant->id);

            $stateResults[] = [
                'SKU' => $variant->sku,
                'Product' => $variant->product->name,
                'On Hand' => number_format($summary['qty_on_hand'], 2),
                'Available' => number_format($summary['qty_available'], 2),
                'Reserved' => number_format($summary['qty_reserved'], 2),
                'State' => $this->formatState($summary['state']),
            ];
        }

        $this->table(
            ['SKU', 'Product', 'On Hand', 'Available', 'Reserved', 'State'],
            $stateResults
        );

        return Command::SUCCESS;
    }

    /**
     * Format stock state with color.
     */
    protected function formatState(string $state): string
    {
        return match($state) {
            'in_stock' => '<fg=green>In Stock</>',
            'low_stock' => '<fg=yellow>Low Stock</>',
            'out_of_stock' => '<fg=red>Out of Stock</>',
            'on_order' => '<fg=blue>On Order</>',
            'allocated' => '<fg=magenta>Allocated</>',
            default => $state,
        };
    }
}
