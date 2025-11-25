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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();

            // What & Where
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('lot_id')->nullable()->constrained('inventory_lots')->onDelete('set null');

            // Quantity change (+ for receipt/found, - for shipment/loss)
            $table->decimal('qty_delta', 15, 4); // Supports negative values
            $table->foreignId('uom_id')->constrained()->onDelete('restrict');

            // Costing
            $table->decimal('unit_cost', 15, 4)->nullable()->comment('Cost per unit at time of movement');

            // Reference (what triggered this movement)
            $table->string('ref_type')->comment('PO, GRN, SO, SHIPMENT, ADJUSTMENT, TRANSFER, COUNT');
            $table->unsignedBigInteger('ref_id')->comment('ID of the reference record');

            // Audit
            $table->text('note')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');

            // Timestamps - using created_at as movement timestamp
            $table->timestamps();

            // Indexes for performance
            $table->index(['product_variant_id', 'warehouse_id', 'created_at']);
            $table->index(['ref_type', 'ref_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
