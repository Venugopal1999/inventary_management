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
        Schema::create('so_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('restrict');
            $table->foreignId('uom_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('ordered_qty', 15, 4);
            $table->decimal('allocated_qty', 15, 4)->default(0); // Quantity reserved in stock
            $table->decimal('shipped_qty', 15, 4)->default(0);   // Quantity shipped
            $table->decimal('unit_price', 15, 4);                 // Selling price
            $table->decimal('line_total', 15, 4);                 // ordered_qty * unit_price
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('so_items');
    }
};
