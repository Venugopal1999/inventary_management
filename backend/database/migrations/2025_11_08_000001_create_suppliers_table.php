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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Unique supplier code');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();

            // Contact information stored as JSON
            // {
            //   "primary_contact": "John Doe",
            //   "secondary_contact": "Jane Smith",
            //   "address_line1": "123 Main St",
            //   "address_line2": "Suite 100",
            //   "city": "New York",
            //   "state": "NY",
            //   "postal_code": "10001",
            //   "country": "USA"
            // }
            $table->json('contact_json')->nullable();

            // Payment terms (e.g., "Net 30", "Net 60", "COD")
            $table->string('payment_terms', 50)->default('Net 30');

            // Credit limit for the supplier
            $table->decimal('credit_limit', 15, 2)->nullable();

            // Default currency for transactions (ISO code: USD, EUR, etc.)
            $table->string('currency', 3)->default('USD');

            // Tax identification number
            $table->string('tax_id', 50)->nullable();

            // Supplier rating (1-5 stars)
            $table->unsignedTinyInteger('rating')->default(0);

            // Status
            $table->boolean('is_active')->default(true);

            // Notes
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('code');
            $table->index('name');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
