<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'code' => 'SUP-000001',
                'name' => 'TechGear Wholesale Inc.',
                'email' => 'orders@techgear-wholesale.com',
                'phone' => '+1-555-0101',
                'contact_json' => [
                    'primary_contact' => 'James Martinez',
                    'secondary_contact' => 'Sarah Johnson',
                    'address_line1' => '1250 Technology Drive',
                    'address_line2' => 'Building A',
                    'city' => 'San Jose',
                    'state' => 'CA',
                    'postal_code' => '95110',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 30',
                'credit_limit' => 50000.00,
                'currency' => 'USD',
                'tax_id' => '12-3456789',
                'rating' => 5,
                'is_active' => true,
                'notes' => 'Premium supplier for electronics and computer accessories. Fast shipping, excellent quality.',
            ],
            [
                'code' => 'SUP-000002',
                'name' => 'Global Electronics Supply Co.',
                'email' => 'procurement@global-electronics.com',
                'phone' => '+1-555-0202',
                'contact_json' => [
                    'primary_contact' => 'David Chen',
                    'secondary_contact' => 'Emily Wang',
                    'address_line1' => '5600 Industrial Parkway',
                    'address_line2' => null,
                    'city' => 'Austin',
                    'state' => 'TX',
                    'postal_code' => '78701',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 45',
                'credit_limit' => 75000.00,
                'currency' => 'USD',
                'tax_id' => '98-7654321',
                'rating' => 4,
                'is_active' => true,
                'notes' => 'Large volume supplier with competitive pricing. Slightly longer lead times.',
            ],
            [
                'code' => 'SUP-000003',
                'name' => 'Premium Peripherals Ltd.',
                'email' => 'sales@premiumperipherals.com',
                'phone' => '+1-555-0303',
                'contact_json' => [
                    'primary_contact' => 'Michael Brown',
                    'secondary_contact' => 'Lisa Anderson',
                    'address_line1' => '890 Commerce Street',
                    'address_line2' => 'Suite 500',
                    'city' => 'Seattle',
                    'state' => 'WA',
                    'postal_code' => '98101',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 30',
                'credit_limit' => 30000.00,
                'currency' => 'USD',
                'tax_id' => '45-6789012',
                'rating' => 5,
                'is_active' => true,
                'notes' => 'Specializes in high-end keyboards and mice. Premium quality products.',
            ],
            [
                'code' => 'SUP-000004',
                'name' => 'BudgetTech Distributors',
                'email' => 'orders@budgettech.com',
                'phone' => '+1-555-0404',
                'contact_json' => [
                    'primary_contact' => 'Robert Taylor',
                    'secondary_contact' => null,
                    'address_line1' => '2340 Discount Drive',
                    'address_line2' => null,
                    'city' => 'Phoenix',
                    'state' => 'AZ',
                    'postal_code' => '85001',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 60',
                'credit_limit' => 20000.00,
                'currency' => 'USD',
                'tax_id' => '67-8901234',
                'rating' => 3,
                'is_active' => true,
                'notes' => 'Budget-friendly supplier. Good for cost-conscious purchases.',
            ],
            [
                'code' => 'SUP-000005',
                'name' => 'International Tech Imports',
                'email' => 'import@intltech.com',
                'phone' => '+1-555-0505',
                'contact_json' => [
                    'primary_contact' => 'Jennifer Lee',
                    'secondary_contact' => 'Kevin Park',
                    'address_line1' => '7800 Harbor Boulevard',
                    'address_line2' => 'Warehouse 12',
                    'city' => 'Los Angeles',
                    'state' => 'CA',
                    'postal_code' => '90021',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 30',
                'credit_limit' => 100000.00,
                'currency' => 'USD',
                'tax_id' => '89-0123456',
                'rating' => 4,
                'is_active' => true,
                'notes' => 'Imports from Asia. Large variety of products at competitive prices.',
            ],
            [
                'code' => 'SUP-000006',
                'name' => 'QuickShip Electronics',
                'email' => 'express@quickship.com',
                'phone' => '+1-555-0606',
                'contact_json' => [
                    'primary_contact' => 'Amanda White',
                    'secondary_contact' => 'Chris Martinez',
                    'address_line1' => '450 Express Lane',
                    'address_line2' => null,
                    'city' => 'Denver',
                    'state' => 'CO',
                    'postal_code' => '80201',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 15',
                'credit_limit' => 15000.00,
                'currency' => 'USD',
                'tax_id' => '23-4567890',
                'rating' => 5,
                'is_active' => true,
                'notes' => 'Same-day and next-day shipping available. Premium pricing but excellent service.',
            ],
            [
                'code' => 'SUP-000007',
                'name' => 'Legacy Computer Parts Co.',
                'email' => 'sales@legacyparts.com',
                'phone' => '+1-555-0707',
                'contact_json' => [
                    'primary_contact' => 'George Wilson',
                    'secondary_contact' => null,
                    'address_line1' => '1500 Old Mill Road',
                    'address_line2' => null,
                    'city' => 'Boston',
                    'state' => 'MA',
                    'postal_code' => '02101',
                    'country' => 'USA',
                ],
                'payment_terms' => 'Net 45',
                'credit_limit' => 25000.00,
                'currency' => 'USD',
                'tax_id' => '34-5678901',
                'rating' => 3,
                'is_active' => false,
                'notes' => 'Older supplier with declining quality. Currently inactive.',
            ],
        ];

        foreach ($suppliers as $supplierData) {
            Supplier::create($supplierData);
        }

        $this->command->info('✓ Created ' . count($suppliers) . ' suppliers');
    }
}
