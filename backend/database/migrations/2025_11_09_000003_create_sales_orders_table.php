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
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('restrict');
            $table->foreignId('price_list_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', [
                'draft',        // Created but not confirmed
                'confirmed',    // Confirmed, ready for allocation
                'allocated',    // Stock reserved
                'partial',      // Partially shipped
                'shipped',      // Fully shipped
                'closed',       // Completed
                'cancelled'     // Cancelled
            ])->default('draft');
            $table->date('order_date');
            $table->date('promise_date')->nullable(); // Expected delivery date
            $table->string('currency', 3)->default('USD');
            $table->decimal('tax_rate', 5, 2)->default(0); // Simple tax rate percentage
            $table->decimal('subtotal', 15, 4)->default(0);
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('total', 15, 4)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};
