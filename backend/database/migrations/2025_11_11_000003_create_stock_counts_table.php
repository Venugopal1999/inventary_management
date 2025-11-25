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
        Schema::create('stock_counts', function (Blueprint $table) {
            $table->id();
            $table->string('count_number')->unique();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->enum('scope', ['cycle', 'full'])->default('cycle');
            $table->enum('status', [
                'draft',
                'in_progress',
                'completed',
                'reviewed',
                'posted',
                'cancelled'
            ])->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('counted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('posted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->boolean('auto_post_if_no_variance')->default(false);
            $table->decimal('variance_threshold', 10, 2)->nullable(); // Auto-approve if variance below threshold
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('count_number');
            $table->index('warehouse_id');
            $table->index('status');
            $table->index('scope');
            $table->index('scheduled_at');
        });

        Schema::create('stock_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_count_id')->constrained('stock_counts')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->foreignId('lot_id')->nullable()->constrained('inventory_lots')->onDelete('set null');
            $table->foreignId('uom_id')->constrained('uoms')->onDelete('cascade');
            $table->decimal('expected_qty', 15, 2)->default(0); // System qty at count time
            $table->decimal('counted_qty', 15, 2)->nullable(); // Physical count
            $table->decimal('variance', 15, 2)->nullable(); // counted - expected
            $table->decimal('variance_percentage', 10, 2)->nullable();
            $table->enum('variance_status', ['match', 'over', 'under', 'missing'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('counted_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('stock_count_id');
            $table->index('product_variant_id');
            $table->index('lot_id');
            $table->index('variance_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_count_items');
        Schema::dropIfExists('stock_counts');
    }
};
