<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding customers...');

        $customers = [
            [
                'code' => 'CUST-000001',
                'name' => 'Acme Corporation',
                'email' => 'orders@acme.com',
                'phone' => '+1-555-123-4567',
                'contact_json' => [
                    'primary_contact' => 'John Smith',
                    'address' => [
                        'street' => '100 Industrial Way',
                        'city' => 'Chicago',
                        'state' => 'IL',
                        'zip' => '60601',
                        'country' => 'USA',
                    ],
                ],
                'terms' => 'Net 30',
                'status' => 'active',
            ],
            [
                'code' => 'CUST-000002',
                'name' => 'TechStart Inc.',
                'email' => 'purchasing@techstart.io',
                'phone' => '+1-555-234-5678',
                'contact_json' => [
                    'primary_contact' => 'Sarah Johnson',
                    'address' => [
                        'street' => '250 Innovation Drive',
                        'city' => 'San Francisco',
                        'state' => 'CA',
                        'zip' => '94105',
                        'country' => 'USA',
                    ],
                ],
                'terms' => 'Net 15',
                'status' => 'active',
            ],
            [
                'code' => 'CUST-000003',
                'name' => 'Global Retail Partners',
                'email' => 'procurement@globalretail.com',
                'phone' => '+1-555-345-6789',
                'contact_json' => [
                    'primary_contact' => 'Michael Chen',
                    'address' => [
                        'street' => '789 Commerce Blvd',
                        'city' => 'New York',
                        'state' => 'NY',
                        'zip' => '10001',
                        'country' => 'USA',
                    ],
                ],
                'terms' => 'Net 45',
                'status' => 'active',
            ],
            [
                'code' => 'CUST-000004',
                'name' => 'Sunrise Distributors',
                'email' => 'orders@sunrisedist.com',
                'phone' => '+1-555-456-7890',
                'contact_json' => [
                    'primary_contact' => 'Emily Davis',
                    'address' => [
                        'street' => '456 Warehouse Lane',
                        'city' => 'Dallas',
                        'state' => 'TX',
                        'zip' => '75201',
                        'country' => 'USA',
                    ],
                ],
                'terms' => 'Net 30',
                'status' => 'active',
            ],
            [
                'code' => 'CUST-000005',
                'name' => 'Pacific Coast Supplies',
                'email' => 'buy@pacificcoast.com',
                'phone' => '+1-555-567-8901',
                'contact_json' => [
                    'primary_contact' => 'Robert Wilson',
                    'address' => [
                        'street' => '321 Harbor View',
                        'city' => 'Seattle',
                        'state' => 'WA',
                        'zip' => '98101',
                        'country' => 'USA',
                    ],
                ],
                'terms' => 'Net 30',
                'status' => 'active',
            ],
        ];

        foreach ($customers as $customerData) {
            Customer::firstOrCreate(
                ['code' => $customerData['code']],
                $customerData
            );
            $this->command->info("Created/verified customer: {$customerData['name']}");
        }

        $this->command->info('Customers seeding completed!');
    }
}
