<?php

namespace Database\Seeders;

use App\Models\PurchaseOrder;
use App\Models\POItem;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\ProductVariant;
use App\Models\Uom;
use App\Models\User;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Get required data
        $suppliers = Supplier::active()->get();
        $warehouses = Warehouse::where('is_active', true)->get();
        $productVariants = ProductVariant::all();
        $users = User::all();
        $uom = Uom::where('symbol', 'pcs')->first();

        if ($suppliers->isEmpty() || $warehouses->isEmpty() || $productVariants->isEmpty() || $users->isEmpty()) {
            $this->command->warn('⚠ Skipping PurchaseOrderSeeder: Required data not found. Run SupplierSeeder, MasterDataSeeder first.');
            return;
        }

        $user = $users->first();
        $poCount = 0;

        // Create 15 purchase orders with various statuses
        foreach ($suppliers as $supplier) {
            // Create 2-3 POs per supplier
            $posForSupplier = rand(2, 3);

            for ($i = 0; $i < $posForSupplier; $i++) {
                $warehouse = $warehouses->random();
                $orderDate = $faker->dateTimeBetween('-60 days', 'now');
                $expectedDate = (clone $orderDate)->modify('+' . rand(7, 30) . ' days');

                // Determine status based on iteration
                $statusPool = [
                    PurchaseOrder::STATUS_DRAFT,
                    PurchaseOrder::STATUS_SUBMITTED,
                    PurchaseOrder::STATUS_APPROVED,
                    PurchaseOrder::STATUS_ORDERED,
                    PurchaseOrder::STATUS_PARTIAL,
                    PurchaseOrder::STATUS_RECEIVED,
                ];

                $status = $statusPool[$poCount % count($statusPool)];

                // Create the purchase order
                $po = PurchaseOrder::create([
                    'po_number' => PurchaseOrder::generatePoNumber(),
                    'supplier_id' => $supplier->id,
                    'warehouse_id' => $warehouse->id,
                    'status' => $status,
                    'order_date' => $orderDate,
                    'expected_date' => $expectedDate,
                    'currency' => 'USD',
                    'shipping_cost' => $faker->randomFloat(2, 0, 50),
                    'notes' => $faker->optional(0.5)->sentence(),
                    'terms_and_conditions' => 'Standard terms and conditions apply.',
                    'created_by' => $user->id,
                    'approved_by' => in_array($status, [
                        PurchaseOrder::STATUS_APPROVED,
                        PurchaseOrder::STATUS_ORDERED,
                        PurchaseOrder::STATUS_PARTIAL,
                        PurchaseOrder::STATUS_RECEIVED
                    ]) ? $user->id : null,
                    'approved_date' => in_array($status, [
                        PurchaseOrder::STATUS_APPROVED,
                        PurchaseOrder::STATUS_ORDERED,
                        PurchaseOrder::STATUS_PARTIAL,
                        PurchaseOrder::STATUS_RECEIVED
                    ]) ? $orderDate : null,
                    'ordered_date' => in_array($status, [
                        PurchaseOrder::STATUS_ORDERED,
                        PurchaseOrder::STATUS_PARTIAL,
                        PurchaseOrder::STATUS_RECEIVED
                    ]) ? $orderDate : null,
                    'supplier_reference' => in_array($status, [
                        PurchaseOrder::STATUS_ORDERED,
                        PurchaseOrder::STATUS_PARTIAL,
                        PurchaseOrder::STATUS_RECEIVED
                    ]) ? 'SUP-REF-' . $faker->unique()->numerify('######') : null,
                ]);

                // Add 2-5 line items to each PO
                $itemCount = rand(2, 5);
                $selectedVariants = $productVariants->random($itemCount);

                foreach ($selectedVariants as $variant) {
                    $orderedQty = $faker->numberBetween(10, 200);
                    $unitCost = $faker->randomFloat(2, 5, 100);
                    $discountPercent = $faker->randomElement([0, 0, 0, 5, 10]); // Most items no discount
                    $taxPercent = 8.5; // Standard sales tax

                    // Determine received quantity based on status
                    $receivedQty = 0;
                    if ($status === PurchaseOrder::STATUS_PARTIAL) {
                        $receivedQty = $faker->numberBetween(1, $orderedQty - 1);
                    } elseif ($status === PurchaseOrder::STATUS_RECEIVED) {
                        $receivedQty = $orderedQty;
                    }

                    POItem::create([
                        'purchase_order_id' => $po->id,
                        'product_variant_id' => $variant->id,
                        'uom_id' => $uom->id,
                        'ordered_qty' => $orderedQty,
                        'received_qty' => $receivedQty,
                        'unit_cost' => $unitCost,
                        'discount_percent' => $discountPercent,
                        'tax_percent' => $taxPercent,
                        'notes' => $faker->optional(0.3)->sentence(),
                        'expected_date' => $faker->optional(0.3)->dateTimeBetween($orderDate, $expectedDate),
                    ]);
                }

                // Recalculate totals
                $po->calculateTotals();

                $poCount++;
            }
        }

        $this->command->info("✓ Created {$poCount} purchase orders with line items");

        // Display summary
        $this->displaySummary();
    }

    /**
     * Display summary of created purchase orders
     */
    private function displaySummary(): void
    {
        $this->command->info("\n📊 Purchase Orders Summary:");
        $this->command->table(
            ['Status', 'Count', 'Total Value'],
            [
                ['Draft', PurchaseOrder::status(PurchaseOrder::STATUS_DRAFT)->count(), '$' . number_format(PurchaseOrder::status(PurchaseOrder::STATUS_DRAFT)->sum('total_amount'), 2)],
                ['Submitted', PurchaseOrder::status(PurchaseOrder::STATUS_SUBMITTED)->count(), '$' . number_format(PurchaseOrder::status(PurchaseOrder::STATUS_SUBMITTED)->sum('total_amount'), 2)],
                ['Approved', PurchaseOrder::status(PurchaseOrder::STATUS_APPROVED)->count(), '$' . number_format(PurchaseOrder::status(PurchaseOrder::STATUS_APPROVED)->sum('total_amount'), 2)],
                ['Ordered', PurchaseOrder::status(PurchaseOrder::STATUS_ORDERED)->count(), '$' . number_format(PurchaseOrder::status(PurchaseOrder::STATUS_ORDERED)->sum('total_amount'), 2)],
                ['Partial', PurchaseOrder::status(PurchaseOrder::STATUS_PARTIAL)->count(), '$' . number_format(PurchaseOrder::status(PurchaseOrder::STATUS_PARTIAL)->sum('total_amount'), 2)],
                ['Received', PurchaseOrder::status(PurchaseOrder::STATUS_RECEIVED)->count(), '$' . number_format(PurchaseOrder::status(PurchaseOrder::STATUS_RECEIVED)->sum('total_amount'), 2)],
                ['TOTAL', PurchaseOrder::count(), '$' . number_format(PurchaseOrder::sum('total_amount'), 2)],
            ]
        );
    }
}
