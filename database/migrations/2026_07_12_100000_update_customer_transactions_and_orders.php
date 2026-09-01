<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // First, convert existing data: make credit amounts negative
        DB::table('customer_transactions')
            ->where('type', 'credit')
            ->update(['amount' => DB::raw('-ABS(amount)')]);

        // Then drop the type column
        Schema::table('customer_transactions', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        // Add paid_amount to orders for partial payments on آجل orders
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('paid_amount', 12, 2)->default(0)->after('payment_type');
        });
    }

    public function down(): void
    {
        Schema::table('customer_transactions', function (Blueprint $table) {
            $table->enum('type', ['debit', 'credit'])->default('debit')->after('order_id');
        });

        // Restore type based on amount sign
        DB::table('customer_transactions')
            ->where('amount', '<', 0)
            ->update(['type' => 'credit', 'amount' => DB::raw('ABS(amount)')]);

        DB::table('customer_transactions')
            ->where('amount', '>=', 0)
            ->update(['type' => 'debit']);

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('paid_amount');
        });
    }
};
