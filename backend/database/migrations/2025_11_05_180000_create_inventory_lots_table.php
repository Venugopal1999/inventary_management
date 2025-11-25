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
        Schema::create('inventory_lots', function (Blueprint $table) {
            $table->id();

            // Product identification
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');

            // Lot/Batch information
            $table->string('lot_no')->comment('Lot or batch number');
            $table->date('mfg_date')->nullable()->comment('Manufacturing date');
            $table->date('exp_date')->nullable()->comment('Expiry date');

            // Current quantity (denormalized for performance)
            $table->decimal('qty_on_hand', 15, 4)->default(0)->comment('Current stock quantity in this lot');

            $table->timestamps();

            // Indexes
            $table->unique(['product_variant_id', 'lot_no']);
            $table->index('exp_date'); // For FEFO queries
            $table->index(['product_variant_id', 'exp_date']); // For product-specific FEFO
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_lots');
    }
};
