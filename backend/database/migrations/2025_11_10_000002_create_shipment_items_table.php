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
        Schema::create('shipment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained('shipments')->onDelete('cascade');
            $table->foreignId('so_item_id')->constrained('so_items')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('lot_id')->nullable()->constrained('inventory_lots')->onDelete('set null');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->decimal('shipped_qty', 15, 2);
            $table->foreignId('uom_id')->constrained('uoms')->onDelete('cascade');
            $table->decimal('unit_cost_fifo_snap', 10, 4); // Snapshot of FIFO cost at shipment time
            $table->timestamp('picked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('shipment_id');
            $table->index('so_item_id');
            $table->index('product_variant_id');
            $table->index('lot_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_items');
    }
};
