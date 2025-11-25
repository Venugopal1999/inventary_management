<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_item_id')->constrained('so_items')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('restrict');
            $table->foreignId('warehouse_id')->constrained()->onDelete('restrict');
            $table->foreignId('location_id')->nullable()->constrained()->onDelete('restrict');
            $table->foreignId('lot_id')->nullable()->constrained('inventory_lots')->onDelete('restrict');
            $table->decimal('qty_reserved', 15, 4);
            $table->timestamp('reserved_at');
            $table->foreignId('reserved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Index for quick ATP (Available to Promise) calculations
            $table->index(['product_variant_id', 'warehouse_id']);
            $table->index(['lot_id']);
        });

        // Add qty_reserved to stock_balances if not exists
        if (!Schema::hasColumn('stock_balances', 'qty_reserved')) {
            Schema::table('stock_balances', function (Blueprint $table) {
                $table->decimal('qty_reserved', 15, 4)->default(0)->after('qty_on_hand');
                $table->decimal('qty_available', 15, 4)->default(0)->after('qty_reserved');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');

        if (Schema::hasColumn('stock_balances', 'qty_reserved')) {
            Schema::table('stock_balances', function (Blueprint $table) {
                $table->dropColumn(['qty_reserved', 'qty_available']);
            });
        }
    }
};
