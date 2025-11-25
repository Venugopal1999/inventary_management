<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting database seeding...');

        // Seed Roles and Permissions first
        $this->command->info('📋 Seeding roles and permissions...');
        $this->call([
            RoleSeeder::class,
        ]);

        // Seed UOMs (Units of Measure)
        $this->command->info('📏 Seeding units of measure...');
        $this->call([
            UomSeeder::class,
        ]);

        // Seed master data (warehouses, locations, categories, products, variants)
        $this->command->info('📦 Seeding master data (warehouses, products, etc.)...');
        $this->call([
            MasterDataSeeder::class,
        ]);

        // Create a default admin user if not exists
        $user = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
            ]
        );

        // Assign admin role
        if (!$user->hasRole('Admin')) {
            $user->assignRole('Admin');
        }

        $this->command->info('👤 Admin user created/verified: admin@example.com (password: password)');

        // Seed stock data (inventory lots, movements, balances)
        $this->command->info('📊 Seeding inventory data (lots, movements, balances)...');
        $this->call([
            StockSeeder::class,
        ]);

        // Seed suppliers (Week 3)
        $this->command->info('🏢 Seeding suppliers...');
        $this->call([
            SupplierSeeder::class,
        ]);

        // Seed purchase orders (Week 3)
        $this->command->info('📝 Seeding purchase orders...');
        $this->call([
            PurchaseOrderSeeder::class,
        ]);

        // Seed replenishment rules, suggestions, and alerts (Week 8)
        $this->command->info('🔄 Seeding replenishment data (reorder rules, suggestions, alerts)...');
        $this->call([
            ReplenishmentSeeder::class,
        ]);

        $this->command->info('✅ Database seeding completed successfully!');
    }
}
