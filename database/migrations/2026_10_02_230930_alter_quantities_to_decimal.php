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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('stock', 10, 3)->default(0)->change();
        });

        Schema::table('products_orders', function (Blueprint $table) {
            $table->decimal('quantity', 10, 3)->change();
        });

        Schema::table('order_returns', function (Blueprint $table) {
            $table->decimal('quantity', 10, 3)->change();
        });

        Schema::table('pending_cart_items', function (Blueprint $table) {
            $table->decimal('quantity', 10, 3)->change();
        });

        Schema::table('customer_carts', function (Blueprint $table) {
            $table->decimal('quantity', 10, 3)->default(1)->change();
        });

        Schema::table('received_order_items', function (Blueprint $table) {
            $table->decimal('quantity', 10, 3)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock')->default(0)->change();
        });

        Schema::table('products_orders', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });

        Schema::table('order_returns', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });

        Schema::table('pending_cart_items', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });

        Schema::table('customer_carts', function (Blueprint $table) {
            $table->integer('quantity')->default(1)->change();
        });

        Schema::table('received_order_items', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });
    }
};
