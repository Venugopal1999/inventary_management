<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use App\Models\Location;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Uom;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding master data...');

        // Get or create default UOM
        $uom = Uom::firstOrCreate(['name' => 'Unit'], [
            'symbol' => 'EA',
            'base_ratio' => 1.0,
        ]);

        // Create warehouses
        $mainWarehouse = Warehouse::create([
            'code' => 'WH-001',
            'name' => 'Main Warehouse',
            'address_json' => json_encode([
                'street' => '123 Warehouse Ave',
                'city' => 'New York',
                'state' => 'NY',
                'zip' => '10001',
            ]),
            'is_active' => true,
        ]);

        $secondaryWarehouse = Warehouse::create([
            'code' => 'WH-002',
            'name' => 'Secondary Warehouse',
            'address_json' => json_encode([
                'street' => '456 Storage Blvd',
                'city' => 'Los Angeles',
                'state' => 'CA',
                'zip' => '90001',
            ]),
            'is_active' => true,
        ]);

        $this->command->info('Created warehouses');

        // Create locations for main warehouse
        Location::create([
            'warehouse_id' => $mainWarehouse->id,
            'code' => 'A-01',
            'type' => 'bin',
            'is_pickable' => true,
        ]);

        Location::create([
            'warehouse_id' => $mainWarehouse->id,
            'code' => 'A-02',
            'type' => 'bin',
            'is_pickable' => true,
        ]);

        Location::create([
            'warehouse_id' => $mainWarehouse->id,
            'code' => 'B-01',
            'type' => 'bulk',
            'is_pickable' => false,
        ]);

        $this->command->info('Created locations');

        // Create categories
        $electronics = Category::create([
            'name' => 'Electronics',
            'parent_id' => null,
        ]);

        $clothing = Category::create([
            'name' => 'Clothing',
            'parent_id' => null,
        ]);

        $food = Category::create([
            'name' => 'Food & Beverage',
            'parent_id' => null,
        ]);

        $this->command->info('Created categories');

        // Create products
        $products = [
            [
                'name' => 'Wireless Mouse',
                'description' => 'Ergonomic wireless mouse with USB receiver',
                'category_id' => $electronics->id,
                'sku_policy' => 'simple',
                'variants' => [
                    [
                        'sku' => 'MOUSE-001',
                        'barcode' => '1234567890123',
                        'reorder_min' => 20,
                        'reorder_max' => 100,
                        'cost' => 15.00,
                        'price' => 29.99,
                    ],
                ],
            ],
            [
                'name' => 'Bluetooth Keyboard',
                'description' => 'Compact bluetooth keyboard',
                'category_id' => $electronics->id,
                'sku_policy' => 'simple',
                'variants' => [
                    [
                        'sku' => 'KB-001',
                        'barcode' => '1234567890124',
                        'reorder_min' => 15,
                        'reorder_max' => 75,
                        'cost' => 25.00,
                        'price' => 49.99,
                    ],
                ],
            ],
            [
                'name' => 'T-Shirt',
                'description' => 'Cotton t-shirt',
                'category_id' => $clothing->id,
                'sku_policy' => 'variant',
                'variants' => [
                    [
                        'sku' => 'TSHIRT-S-BLU',
                        'attributes_json' => ['size' => 'S', 'color' => 'Blue'],
                        'reorder_min' => 30,
                        'reorder_max' => 150,
                        'cost' => 5.00,
                        'price' => 19.99,
                    ],
                    [
                        'sku' => 'TSHIRT-M-BLU',
                        'attributes_json' => ['size' => 'M', 'color' => 'Blue'],
                        'reorder_min' => 50,
                        'reorder_max' => 200,
                        'cost' => 5.00,
                        'price' => 19.99,
                    ],
                    [
                        'sku' => 'TSHIRT-L-RED',
                        'attributes_json' => ['size' => 'L', 'color' => 'Red'],
                        'reorder_min' => 40,
                        'reorder_max' => 180,
                        'cost' => 5.00,
                        'price' => 19.99,
                    ],
                ],
            ],
            [
                'name' => 'Organic Coffee Beans',
                'description' => '1kg bag of organic coffee beans',
                'category_id' => $food->id,
                'sku_policy' => 'simple',
                'variants' => [
                    [
                        'sku' => 'COFFEE-ORG-001',
                        'barcode' => '1234567890125',
                        'reorder_min' => 50,
                        'reorder_max' => 300,
                        'cost' => 8.00,
                        'price' => 15.99,
                    ],
                ],
            ],
            [
                'name' => 'Protein Powder',
                'description' => 'Whey protein powder 2kg',
                'category_id' => $food->id,
                'sku_policy' => 'simple',
                'variants' => [
                    [
                        'sku' => 'PROTEIN-WHY-2K',
                        'barcode' => '1234567890126',
                        'reorder_min' => 25,
                        'reorder_max' => 120,
                        'cost' => 20.00,
                        'price' => 39.99,
                    ],
                ],
            ],
        ];

        foreach ($products as $productData) {
            $variants = $productData['variants'];
            unset($productData['variants']);

            $product = Product::create([
                'name' => $productData['name'],
                'description' => $productData['description'],
                'category_id' => $productData['category_id'],
                'sku_policy' => $productData['sku_policy'],
                'uom_id' => $uom->id,
                'status' => 'active',
            ]);

            foreach ($variants as $variantData) {
                ProductVariant::create(array_merge($variantData, [
                    'product_id' => $product->id,
                ]));
            }

            $this->command->info("Created product: {$product->name}");
        }

        $this->command->info('✓ Master data seeding completed!');

        // Show summary
        $this->command->info("\nMaster Data Summary:");
        $this->command->table(
            ['Entity', 'Count'],
            [
                ['Warehouses', Warehouse::count()],
                ['Locations', Location::count()],
                ['Categories', Category::count()],
                ['Products', Product::count()],
                ['Product Variants', ProductVariant::count()],
            ]
        );
    }
}
