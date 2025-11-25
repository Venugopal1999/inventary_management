<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Models\Location;
use App\Models\Uom;
use App\Models\User;
use App\Models\InventoryLot;
use App\Services\StockMovementService;
use Carbon\Carbon;

class StockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stockService = new StockMovementService();

        // Get first user (or create a system user)
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => 'System',
                'email' => 'system@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        // Get existing data
        $variants = ProductVariant::all();
        $warehouses = Warehouse::all();
        $uom = Uom::first();

        if ($variants->isEmpty() || $warehouses->isEmpty() || !$uom) {
            $this->command->error('Please seed products, warehouses, and UOMs first!');
            return;
        }

        $this->command->info('Creating inventory lots and stock movements...');

        // For each variant, create some lots and movements
        foreach ($variants->take(5) as $variant) {
            $warehouse = $warehouses->first();
            $location = Location::where('warehouse_id', $warehouse->id)->first();

            $this->command->info("Processing variant: {$variant->sku}");

            // Create 2-3 inventory lots per variant
            $lotsCount = rand(2, 3);
            for ($i = 1; $i <= $lotsCount; $i++) {
                $lot = InventoryLot::create([
                    'product_variant_id' => $variant->id,
                    'lot_no' => 'LOT-' . strtoupper($variant->sku) . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'mfg_date' => Carbon::now()->subDays(rand(30, 90)),
                    'exp_date' => Carbon::now()->addDays(rand(180, 365)),
                    'qty_on_hand' => 0, // Will be updated by movements
                ]);

                // Create initial receipt (GRN)
                $receiptQty = rand(50, 200);
                $stockService->receiveStock([
                    'product_variant_id' => $variant->id,
                    'warehouse_id' => $warehouse->id,
                    'location_id' => $location?->id,
                    'lot_id' => $lot->id,
                    'qty_delta' => $receiptQty,
                    'uom_id' => $uom->id,
                    'unit_cost' => rand(10, 100) + (rand(0, 99) / 100),
                    'ref_type' => 'GRN',
                    'ref_id' => rand(1000, 9999),
                    'note' => 'Initial stock receipt',
                    'user_id' => $user->id,
                ]);

                $this->command->info("  - Created lot {$lot->lot_no} with {$receiptQty} units");
            }

            // Create some shipments (reduce stock)
            $shipmentsCount = rand(1, 3);
            for ($i = 1; $i <= $shipmentsCount; $i++) {
                $lot = InventoryLot::where('product_variant_id', $variant->id)
                    ->where('qty_on_hand', '>', 0)
                    ->first();

                if ($lot) {
                    $shipQty = min(rand(10, 30), $lot->qty_on_hand);

                    try {
                        $stockService->shipStock([
                            'product_variant_id' => $variant->id,
                            'warehouse_id' => $warehouse->id,
                            'location_id' => $location?->id,
                            'lot_id' => $lot->id,
                            'qty_delta' => $shipQty,
                            'uom_id' => $uom->id,
                            'unit_cost' => rand(10, 100) + (rand(0, 99) / 100),
                            'ref_type' => 'SHIPMENT',
                            'ref_id' => rand(2000, 2999),
                            'note' => 'Customer shipment',
                            'user_id' => $user->id,
                        ]);

                        $this->command->info("  - Shipped {$shipQty} units from lot {$lot->lot_no}");
                    } catch (\Exception $e) {
                        $this->command->warn("  - Could not ship: {$e->getMessage()}");
                    }
                }
            }

            // Randomly create an adjustment (positive or negative)
            if (rand(1, 2) === 1) {
                $lot = InventoryLot::where('product_variant_id', $variant->id)->first();
                $adjustQty = rand(-5, 15);
                $adjustReason = $adjustQty > 0 ? 'Found during count' : 'Damaged goods';

                try {
                    $stockService->adjustStock([
                        'product_variant_id' => $variant->id,
                        'warehouse_id' => $warehouse->id,
                        'location_id' => $location?->id,
                        'lot_id' => $lot?->id,
                        'qty_delta' => $adjustQty,
                        'uom_id' => $uom->id,
                        'ref_id' => rand(3000, 3999),
                        'note' => $adjustReason,
                        'user_id' => $user->id,
                    ]);

                    $action = $adjustQty > 0 ? 'Added' : 'Removed';
                    $this->command->info("  - {$action} " . abs($adjustQty) . " units: {$adjustReason}");
                } catch (\Exception $e) {
                    $this->command->warn("  - Could not adjust: {$e->getMessage()}");
                }
            }
        }

        $this->command->info('✓ Stock seeding completed successfully!');

        // Show summary
        $this->command->info("\nStock Summary:");
        $this->command->table(
            ['Metric', 'Count'],
            [
                ['Inventory Lots', InventoryLot::count()],
                ['Stock Movements', \App\Models\StockMovement::count()],
                ['Stock Balances', \App\Models\StockBalance::count()],
            ]
        );
    }
}
