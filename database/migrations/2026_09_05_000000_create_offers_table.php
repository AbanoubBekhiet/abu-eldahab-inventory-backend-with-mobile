<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('offer_price', 10, 2);
            $table->decimal('original_price', 10, 2);
            $table->integer('offer_max_quantity')->nullable();
            $table->integer('original_max_quantity')->nullable();
            $table->dateTime('expires_at');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'expires_at']);
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
