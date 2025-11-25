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
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_id')->constrained('goods_receipts')->onDelete('cascade');
            $table->foreignId('po_item_id')->constrained('po_items')->onDelete('restrict');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('restrict');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('restrict');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('restrict');
            $table->foreignId('lot_id')->nullable()->constrained('inventory_lots')->onDelete('restrict');
            $table->decimal('received_qty', 15, 4);
            $table->decimal('unit_cost', 15, 4);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes for better query performance
            $table->index('goods_receipt_id');
            $table->index('po_item_id');
            $table->index('product_variant_id');
            $table->index(['warehouse_id', 'location_id']);
            $table->index('lot_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};
