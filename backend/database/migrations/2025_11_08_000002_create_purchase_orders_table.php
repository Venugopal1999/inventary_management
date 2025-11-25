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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number', 50)->unique()->comment('Purchase order number (auto-generated)');

            // Supplier relationship
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');

            // Warehouse destination (where goods will be received)
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('restrict');

            // Status flow: draft → submitted → approved → ordered → partial → received → closed → cancelled
            $table->enum('status', [
                'draft',
                'submitted',
                'approved',
                'ordered',
                'partial',
                'received',
                'closed',
                'cancelled'
            ])->default('draft');

            // Dates
            $table->date('order_date')->comment('Date when PO was created');
            $table->date('expected_date')->nullable()->comment('Expected delivery date');
            $table->date('approved_date')->nullable()->comment('Date when PO was approved');
            $table->date('ordered_date')->nullable()->comment('Date when PO was sent to supplier');

            // Currency and totals
            $table->string('currency', 3)->default('USD');
            $table->decimal('subtotal', 15, 2)->default(0)->comment('Sum of all line items');
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0)->comment('Subtotal + tax + shipping');

            // Approval workflow
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');

            // Notes and terms
            $table->text('notes')->nullable();
            $table->text('terms_and_conditions')->nullable();

            // Tracking
            $table->string('supplier_reference', 100)->nullable()->comment('Supplier\'s PO confirmation number');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('po_number');
            $table->index('supplier_id');
            $table->index('warehouse_id');
            $table->index('status');
            $table->index('order_date');
            $table->index('expected_date');
            $table->index(['supplier_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
