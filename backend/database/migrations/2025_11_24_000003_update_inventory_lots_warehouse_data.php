<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update inventory_lots with warehouse_id and location_id from stock_balances
        // Match based on product_variant_id
        DB::statement("
            UPDATE inventory_lots
            SET warehouse_id = (
                SELECT sb.warehouse_id
                FROM stock_balances sb
                WHERE sb.product_variant_id = inventory_lots.product_variant_id
                LIMIT 1
            ),
            location_id = (
                SELECT sb.location_id
                FROM stock_balances sb
                WHERE sb.product_variant_id = inventory_lots.product_variant_id
                LIMIT 1
            )
            WHERE warehouse_id IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed
    }
};
