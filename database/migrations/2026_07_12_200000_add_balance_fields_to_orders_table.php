<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('previous_balance', 12, 2)->default(0)->after('paid_amount');
            $table->decimal('credit_used', 12, 2)->default(0)->after('previous_balance');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['previous_balance', 'credit_used']);
        });
    }
};
