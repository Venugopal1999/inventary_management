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
        Schema::table('inventory_lots', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('product_variant_id')->constrained()->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->after('warehouse_id')->constrained()->onDelete('set null');
            $table->decimal('qty_reserved', 15, 4)->default(0)->after('qty_on_hand')->comment('Reserved quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_lots', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropForeign(['location_id']);
            $table->dropColumn(['warehouse_id', 'location_id', 'qty_reserved']);
        });
    }
};
