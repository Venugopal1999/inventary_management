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
        Schema::create('po_items', function (Blueprint $table) {
            $table->id();

            // Purchase order relationship
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');

            // Product variant
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('restrict');

            // Unit of measure
            $table->foreignId('uom_id')->constrained('uoms')->onDelete('restrict');

            // Quantities
            $table->decimal('ordered_qty', 15, 2)->comment('Quantity ordered from supplier');
            $table->decimal('received_qty', 15, 2)->default(0)->comment('Quantity received so far');
            $table->decimal('cancelled_qty', 15, 2)->default(0)->comment('Quantity cancelled');

            // Pricing
            $table->decimal('unit_cost', 15, 4)->comment('Cost per unit');
            $table->decimal('discount_percent', 5, 2)->default(0)->comment('Line item discount percentage');
            $table->decimal('discount_amount', 15, 2)->default(0)->comment('Calculated discount amount');
            $table->decimal('tax_percent', 5, 2)->default(0)->comment('Tax percentage for this line');
            $table->decimal('tax_amount', 15, 2)->default(0)->comment('Calculated tax amount');
            $table->decimal('line_total', 15, 2)->comment('Total for this line (qty * unit_cost - discount + tax)');

            // Notes for this specific line item
            $table->text('notes')->nullable();

            // Expected delivery date for this specific item (can override PO expected date)
            $table->date('expected_date')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('purchase_order_id');
            $table->index('product_variant_id');
            $table->index(['purchase_order_id', 'product_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('po_items');
    }
};
