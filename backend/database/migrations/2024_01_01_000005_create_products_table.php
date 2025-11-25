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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('sku_policy', ['simple', 'variant'])->default('simple');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('uom_id')->constrained()->restrictOnDelete();
            $table->string('barcode')->nullable()->unique();
            $table->boolean('track_serial')->default(false);
            $table->boolean('track_batch')->default(false);
            $table->integer('shelf_life_days')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->enum('status', ['active', 'inactive', 'discontinued'])->default('active');
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('category_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
