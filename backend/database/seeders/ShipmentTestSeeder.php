<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SalesOrder;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\Shipment;
use App\Services\SalesOrderService;
use App\Services\ShipmentService;

class ShipmentTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder creates test data for the shipment flow including:
     * - A customer
     * - A sales order with items
     * - Stock allocation
     * - A shipment ready to be processed
     */
    public function run(): void
    {
        $this->command->info('Creating test data for shipment flow...');

        // Get services
        $salesOrderService = app(SalesOrderService::class);
        $shipmentService = app(ShipmentService::class);

        // Get or create a customer
        $customer = Customer::firstOrCreate(
            ['email' => 'testcustomer@example.com'],
            [
                'name' => 'Test Customer for Shipment',
                'code' => 'CUST-SHIP-001',
                'phone' => '+1234567890',
                'address_json' => json_encode([
                    'street' => '123 Test Street',
                    'city' => 'Test City',
                    'state' => 'TS',
                    'zip' => '12345',
                    'country' => 'USA',
                ]),
            ]
        );

        $this->command->info("Customer created: {$customer->name}");

        // Get some product variants that have stock
        $variants = ProductVariant::whereHas('stockBalances', function ($query) {
            $query->where('qty_available', '>', 0);
        })->limit(3)->get();

        if ($variants->isEmpty()) {
            $this->command->error('No product variants with available stock found. Please run DatabaseSeeder first.');
            return;
        }

        // Create a sales order
        $salesOrderData = [
            'customer_id' => $customer->id,
            'order_date' => now(),
            'promise_date' => now()->addDays(7),
            'currency' => 'USD',
            'tax_rate' => 10,
            'notes' => 'Test sales order for shipment flow',
            'items' => [],
        ];

        // Add items to the sales order
        foreach ($variants as $variant) {
            $salesOrderData['items'][] = [
                'product_variant_id' => $variant->id,
                'uom_id' => $variant->product->uom_id,
                'ordered_qty' => 2,
                'unit_price' => 99.99,
            ];
        }

        // Create the sales order
        $salesOrder = $salesOrderService->createSalesOrder($salesOrderData);
        $this->command->info("Sales Order created: {$salesOrder->so_number}");

        // Confirm the sales order and allocate stock
        try {
            $salesOrder = $salesOrderService->confirmSalesOrder($salesOrder, true);
            $this->command->info("Sales Order confirmed and stock allocated");
        } catch (\Exception $e) {
            $this->command->error("Failed to allocate stock: {$e->getMessage()}");
            $this->command->info("You may need to adjust quantities or add more stock");
        }

        // Create a draft shipment for this sales order
        try {
            $shipment = $shipmentService->createShipment($salesOrder, [
                'carrier' => 'FedEx',
                'notes' => 'Test shipment for Week 6 testing',
            ]);

            // Add items from reservations
            $shipment = $shipmentService->addItemsFromReservations($shipment);

            $this->command->info("Shipment created: #{$shipment->id}");
            $this->command->info("Shipment items count: {$shipment->items->count()}");
        } catch (\Exception $e) {
            $this->command->error("Failed to create shipment: {$e->getMessage()}");
        }

        $this->command->info('');
        $this->command->info('===========================================');
        $this->command->info('Test Data Summary:');
        $this->command->info('===========================================');
        $this->command->info("Customer: {$customer->name} (ID: {$customer->id})");
        $this->command->info("Sales Order: {$salesOrder->so_number} (ID: {$salesOrder->id})");
        $this->command->info("Status: {$salesOrder->status}");
        $this->command->info("Items: {$salesOrder->items->count()}");
        if (isset($shipment)) {
            $this->command->info("Shipment: #{$shipment->id}");
            $this->command->info("Shipment Status: {$shipment->status}");
        }
        $this->command->info('===========================================');
        $this->command->info('');
        $this->command->info('You can now test the shipment flow:');
        $this->command->info('1. Visit /shipments in the frontend');
        if (isset($shipment)) {
            $this->command->info("2. Process shipment #{$shipment->id}");
        }
        $this->command->info('3. Go through Pick > Pack > Ship steps');
        $this->command->info('4. Verify stock is reduced after shipping');
        $this->command->info('');
    }
}
