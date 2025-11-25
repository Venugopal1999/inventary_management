<?php

namespace Database\Seeders;

use App\Models\ProductVariant;
use App\Models\ReorderRule;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\LowStockAlertService;
use App\Services\ReplenishmentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class ReplenishmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🔄 Seeding reorder rules...');

        // Get warehouses
        $warehouses = Warehouse::all();
        if ($warehouses->isEmpty()) {
            $this->command->warn('⚠️  No warehouses found. Skipping reorder rules seeding.');
            return;
        }

        // Get product variants
        $variants = ProductVariant::with('product')->get();
        if ($variants->isEmpty()) {
            $this->command->warn('⚠️  No product variants found. Skipping reorder rules seeding.');
            return;
        }

        // Get suppliers
        $suppliers = Supplier::where('is_active', true)->get();

        $rulesCreated = 0;

        // Create reorder rules for a subset of products (about 30% of variants)
        $variantsToProcess = $variants->random(min(15, $variants->count()));

        foreach ($variantsToProcess as $variant) {
            foreach ($warehouses as $warehouse) {
                // Skip some combinations randomly (about 50%)
                if (rand(0, 100) > 50) {
                    continue;
                }

                // Check if rule already exists
                $existing = ReorderRule::where('product_variant_id', $variant->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->first();

                if ($existing) {
                    continue;
                }

                // Random quantities
                $minQty = rand(10, 50);
                $maxQty = $minQty + rand(50, 200);
                $reorderQty = rand($minQty, $maxQty);

                // Random supplier
                $preferredSupplier = $suppliers->random();

                ReorderRule::create([
                    'product_variant_id' => $variant->id,
                    'warehouse_id' => $warehouse->id,
                    'min_qty' => $minQty,
                    'max_qty' => $maxQty,
                    'reorder_qty' => $reorderQty,
                    'preferred_supplier_id' => $preferredSupplier->id,
                    'lead_time_days' => rand(3, 21), // 3-21 days lead time
                    'is_active' => true,
                    'notes' => 'Auto-generated reorder rule for ' . ($variant->product->name ?? 'product'),
                ]);

                $rulesCreated++;
            }
        }

        $this->command->info("✓ Created {$rulesCreated} reorder rules");

        // Generate replenishment suggestions
        $this->command->info('🔄 Generating replenishment suggestions...');

        try {
            $replenishmentService = app(ReplenishmentService::class);
            $suggestions = $replenishmentService->generateSuggestions();
            $this->command->info('✓ Generated ' . count($suggestions) . ' replenishment suggestions');
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Could not generate replenishment suggestions: ' . $e->getMessage());
            Log::error('Replenishment suggestions generation failed', ['error' => $e->getMessage()]);
        }

        // Generate low stock alerts
        $this->command->info('🔄 Generating low stock alerts...');

        try {
            $lowStockAlertService = app(LowStockAlertService::class);
            $alerts = $lowStockAlertService->checkAndGenerateAlerts();
            $this->command->info('✓ Generated ' . count($alerts) . ' low stock alerts');
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Could not generate low stock alerts: ' . $e->getMessage());
            Log::error('Low stock alerts generation failed', ['error' => $e->getMessage()]);
        }

        // Summary
        $this->command->info('');
        $this->command->info('📊 Replenishment Summary:');
        $this->command->table(
            ['Item', 'Count'],
            [
                ['Reorder Rules', $rulesCreated],
                ['Replenishment Suggestions', count($suggestions ?? [])],
                ['Low Stock Alerts', count($alerts ?? [])],
            ]
        );

        $this->command->info('');
        $this->command->info('✅ Replenishment seeding completed!');
    }
}
