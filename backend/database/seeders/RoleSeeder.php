<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = [
            'Admin' => 'Full system access',
            'Purchasing' => 'Manage purchase orders and suppliers',
            'Warehouse' => 'Manage inventory, stock movements, and warehouse operations',
            'Sales' => 'Manage sales orders and customers',
            'Auditor' => 'Read-only access for auditing and reporting',
        ];

        foreach ($roles as $roleName => $description) {
            Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web']
            );
        }

        // Create basic permissions
        $permissions = [
            // Product permissions
            'view products',
            'create products',
            'edit products',
            'delete products',

            // Warehouse permissions
            'view warehouses',
            'create warehouses',
            'edit warehouses',
            'delete warehouses',

            // Purchase Order permissions
            'view purchase orders',
            'create purchase orders',
            'edit purchase orders',
            'delete purchase orders',
            'approve purchase orders',

            // Sales Order permissions
            'view sales orders',
            'create sales orders',
            'edit sales orders',
            'delete sales orders',

            // Inventory permissions
            'view inventory',
            'adjust inventory',
            'transfer inventory',
            'count inventory',

            // Reporting permissions
            'view reports',
            'export reports',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // Assign permissions to roles
        $admin = Role::findByName('Admin');
        $admin->givePermissionTo(Permission::all());

        $purchasing = Role::findByName('Purchasing');
        $purchasing->givePermissionTo([
            'view products',
            'view purchase orders',
            'create purchase orders',
            'edit purchase orders',
            'view inventory',
            'view reports',
        ]);

        $warehouse = Role::findByName('Warehouse');
        $warehouse->givePermissionTo([
            'view products',
            'view warehouses',
            'edit warehouses',
            'view inventory',
            'adjust inventory',
            'transfer inventory',
            'count inventory',
            'view reports',
        ]);

        $sales = Role::findByName('Sales');
        $sales->givePermissionTo([
            'view products',
            'view sales orders',
            'create sales orders',
            'edit sales orders',
            'view inventory',
            'view reports',
        ]);

        $auditor = Role::findByName('Auditor');
        $auditor->givePermissionTo([
            'view products',
            'view warehouses',
            'view purchase orders',
            'view sales orders',
            'view inventory',
            'view reports',
            'export reports',
        ]);
    }
}
