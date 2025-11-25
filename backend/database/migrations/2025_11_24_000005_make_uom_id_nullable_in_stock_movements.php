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
        Schema::table('stock_movements', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['uom_id']);

            // Modify column to be nullable
            $table->foreignId('uom_id')->nullable()->change();

            // Re-add foreign key constraint
            $table->foreign('uom_id')->references('id')->on('uoms')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['uom_id']);
            $table->foreignId('uom_id')->nullable(false)->change();
            $table->foreign('uom_id')->references('id')->on('uoms')->onDelete('restrict');
        });
    }
};
