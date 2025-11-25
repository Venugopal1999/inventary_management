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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->enum('reason', [
                'damage',
                'writeoff',
                'found',
                'loss',
                'expired',
                'quality_issue',
                'miscellaneous'
            ]);
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'posted', 'rejected'])->default('draft');
            $table->text('reason_notes')->nullable();
            $table->timestamp('adjusted_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->boolean('requires_approval')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('adjustment_number');
            $table->index('warehouse_id');
            $table->index('status');
            $table->index('reason');
            $table->index('adjusted_at');
        });

        Schema::create('stock_adjustment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_adjustment_id')->constrained('stock_adjustments')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->foreignId('lot_id')->nullable()->constrained('inventory_lots')->onDelete('set null');
            $table->foreignId('uom_id')->constrained('uoms')->onDelete('cascade');
            $table->decimal('qty_delta', 15, 2); // Can be positive (found) or negative (damage/loss)
            $table->decimal('unit_cost', 10, 4)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('stock_adjustment_id');
            $table->index('product_variant_id');
            $table->index('lot_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_items');
        Schema::dropIfExists('stock_adjustments');
    }
};
