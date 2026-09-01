<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('received_order_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2); // positive = debt I owe to supplier
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Add payment_type to received_orders if not exists
        if (!Schema::hasColumn('received_orders', 'payment_type')) {
            Schema::table('received_orders', function (Blueprint $table) {
                $table->string('payment_type')->default('cash')->after('notes'); // cash | credit
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_transactions');
        Schema::table('received_orders', function (Blueprint $table) {
            if (Schema::hasColumn('received_orders', 'payment_type')) {
                $table->dropColumn('payment_type');
            }
        });
    }
};
