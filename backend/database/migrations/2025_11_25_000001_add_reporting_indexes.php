<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds indexes for optimizing reporting queries (Week 9)
     */
    public function up(): void
    {
        // Stock Movements - Critical for movement history and FIFO calculations
        Schema::table('stock_movements', function (Blueprint $table) {
            // Composite index for movement history filtering
            $table->index(['warehouse_id', 'created_at'], 'idx_movements_warehouse_date');

            // Index for FIFO calculations (receipts by date)
            $table->index(['product_variant_id', 'warehouse_id', 'created_at'], 'idx_movements_fifo');

            // Index for movement type filtering
            $table->index(['ref_type', 'created_at'], 'idx_movements_ref_type_date');

            // Index for movers analysis (outbound movements)
            $table->index(['product_variant_id', 'ref_type', 'created_at'], 'idx_movements_movers');
        });

        // Stock Balances - Critical for SOH reports
        Schema::table('stock_balances', function (Blueprint $table) {
            // Index for warehouse-level reports
            $table->index(['warehouse_id', 'qty_on_hand'], 'idx_balances_warehouse_qty');

            // Index for low stock detection
            $table->index(['qty_available'], 'idx_balances_available');
        });

        // Inventory Lots - Critical for expiry aging reports
        Schema::table('inventory_lots', function (Blueprint $table) {
            // Index for expiry filtering
            $table->index(['exp_date', 'qty_on_hand'], 'idx_lots_expiry');

            // Composite index for expiry by product
            $table->index(['product_variant_id', 'exp_date'], 'idx_lots_product_expiry');
        });

        // Product Variants - For report joins
        Schema::table('product_variants', function (Blueprint $table) {
            // Index for SKU lookups
            if (!$this->indexExists('product_variants', 'idx_variants_sku')) {
                $table->index(['sku'], 'idx_variants_sku');
            }
        });

        // Products - For category filtering in reports
        Schema::table('products', function (Blueprint $table) {
            // Index for category filtering
            if (!$this->indexExists('products', 'idx_products_category')) {
                $table->index(['category_id', 'status'], 'idx_products_category');
            }
        });

        // Purchase Orders - For purchasing reports
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Index for status filtering with date
            $table->index(['status', 'order_date'], 'idx_po_status_date');

            // Index for supplier reports
            $table->index(['supplier_id', 'status'], 'idx_po_supplier_status');
        });

        // Sales Orders - For sales reports
        Schema::table('sales_orders', function (Blueprint $table) {
            // Index for status filtering with date
            $table->index(['status', 'order_date'], 'idx_so_status_date');

            // Index for customer reports
            $table->index(['customer_id', 'status'], 'idx_so_customer_status');
        });

        // Shipments - For fulfillment reports
        Schema::table('shipments', function (Blueprint $table) {
            // Index for shipment history
            $table->index(['status', 'shipped_at'], 'idx_shipments_status_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('idx_movements_warehouse_date');
            $table->dropIndex('idx_movements_fifo');
            $table->dropIndex('idx_movements_ref_type_date');
            $table->dropIndex('idx_movements_movers');
        });

        Schema::table('stock_balances', function (Blueprint $table) {
            $table->dropIndex('idx_balances_warehouse_qty');
            $table->dropIndex('idx_balances_available');
        });

        Schema::table('inventory_lots', function (Blueprint $table) {
            $table->dropIndex('idx_lots_expiry');
            $table->dropIndex('idx_lots_product_expiry');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            if ($this->indexExists('product_variants', 'idx_variants_sku')) {
                $table->dropIndex('idx_variants_sku');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if ($this->indexExists('products', 'idx_products_category')) {
                $table->dropIndex('idx_products_category');
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropIndex('idx_po_status_date');
            $table->dropIndex('idx_po_supplier_status');
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropIndex('idx_so_status_date');
            $table->dropIndex('idx_so_customer_status');
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->dropIndex('idx_shipments_status_date');
        });
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'pgsql') {
            $result = DB::select("
                SELECT 1 FROM pg_indexes
                WHERE tablename = ? AND indexname = ?
            ", [$table, $indexName]);
        } elseif ($driver === 'mysql') {
            $result = DB::select("
                SHOW INDEX FROM {$table} WHERE Key_name = ?
            ", [$indexName]);
        } else {
            // SQLite or other - assume it doesn't exist
            return false;
        }

        return count($result) > 0;
    }
};
