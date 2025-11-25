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
        Schema::create('reorder_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->decimal('min_qty', 15, 2); // Reorder point - trigger when stock falls below this
            $table->decimal('max_qty', 15, 2); // Maximum desired stock level
            $table->decimal('reorder_qty', 15, 2)->nullable(); // Specific qty to order (if null, order to max_qty)
            $table->foreignId('preferred_supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->integer('lead_time_days')->default(0); // Expected delivery time in days
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('product_variant_id');
            $table->index('warehouse_id');
            $table->index('is_active');
            $table->unique(['product_variant_id', 'warehouse_id'], 'unique_variant_warehouse');
        });

        Schema::create('replenishment_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reorder_rule_id')->constrained('reorder_rules')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->decimal('current_qty', 15, 2);
            $table->decimal('min_qty', 15, 2);
            $table->decimal('max_qty', 15, 2);
            $table->decimal('suggested_qty', 15, 2);
            $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
            $table->enum('status', ['pending', 'ordered', 'dismissed'])->default('pending');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->onDelete('set null');
            $table->timestamp('ordered_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('reorder_rule_id');
            $table->index('product_variant_id');
            $table->index('warehouse_id');
            $table->index('status');
            $table->index('priority');
        });

        Schema::create('low_stock_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('reorder_rule_id')->nullable()->constrained('reorder_rules')->onDelete('set null');
            $table->decimal('current_qty', 15, 2);
            $table->decimal('min_qty', 15, 2);
            $table->decimal('shortage_qty', 15, 2); // How much below min_qty
            $table->enum('severity', ['critical', 'warning', 'info'])->default('warning');
            $table->boolean('notification_sent')->default(false);
            $table->timestamp('notification_sent_at')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('product_variant_id');
            $table->index('warehouse_id');
            $table->index('is_resolved');
            $table->index('severity');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('low_stock_alerts');
        Schema::dropIfExists('replenishment_suggestions');
        Schema::dropIfExists('reorder_rules');
    }
};
