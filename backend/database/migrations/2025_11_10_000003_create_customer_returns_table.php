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
        Schema::create('customer_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number')->unique();
            $table->foreignId('shipment_id')->constrained('shipments')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'received', 'refunded', 'rejected', 'cancelled'])->default('pending');
            $table->enum('reason', [
                'defective',
                'wrong_item',
                'damaged',
                'not_as_described',
                'customer_changed_mind',
                'other'
            ]);
            $table->text('reason_notes')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('received_by')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->enum('refund_method', ['original_payment', 'store_credit', 'replacement'])->nullable();
            $table->boolean('restock')->default(false); // Whether to restock items
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('return_number');
            $table->index('shipment_id');
            $table->index('customer_id');
            $table->index('status');
            $table->index('requested_at');
        });

        // Customer return items table
        Schema::create('customer_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_return_id')->constrained('customer_returns')->onDelete('cascade');
            $table->foreignId('shipment_item_id')->constrained('shipment_items')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->decimal('return_qty', 15, 2);
            $table->foreignId('uom_id')->constrained('uoms')->onDelete('cascade');
            $table->enum('condition', ['new', 'used', 'damaged', 'defective'])->default('new');
            $table->boolean('restockable')->default(true);
            $table->decimal('refund_unit_price', 10, 4)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('customer_return_id');
            $table->index('shipment_item_id');
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_return_items');
        Schema::dropIfExists('customer_returns');
    }
};
