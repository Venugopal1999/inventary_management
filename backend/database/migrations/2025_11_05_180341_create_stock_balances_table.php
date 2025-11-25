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
        Schema::create('stock_balances', function (Blueprint $table) {
            $table->id();

            // Unique combination of product + warehouse + location
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained()->onDelete('cascade');

            // Balance quantities
            $table->decimal('qty_on_hand', 15, 4)->default(0)->comment('Physical stock available');
            $table->decimal('qty_reserved', 15, 4)->default(0)->comment('Reserved for sales orders');
            $table->decimal('qty_available', 15, 4)->default(0)->comment('Available to promise (on_hand - reserved)');
            $table->decimal('qty_incoming', 15, 4)->default(0)->comment('On order (pending POs)');

            $table->timestamps();

            // Unique constraint - one balance record per product/warehouse/location
            $table->unique(['product_variant_id', 'warehouse_id', 'location_id'], 'stock_balance_unique');

            // Indexes for fast queries
            $table->index(['product_variant_id', 'warehouse_id']);
            $table->index('warehouse_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_balances');
    }
};
