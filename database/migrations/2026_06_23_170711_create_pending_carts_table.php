<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the legacy carts table (replaced by pending_carts workflow)
        Schema::dropIfExists('carts');

        // Pending cart header — customer + summary totals only
        Schema::create('pending_carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('total', 10, 2)->default(0);
            $table->integer('items_count')->default(0);
            $table->timestamps();
        });

        // Pending cart line-items — one row per product
        Schema::create('pending_cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pending_cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_cart_items');
        Schema::dropIfExists('pending_carts');
    }
};
