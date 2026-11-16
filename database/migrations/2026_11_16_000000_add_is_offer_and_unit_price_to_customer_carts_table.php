<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_carts', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_carts', 'is_offer')) {
                $table->boolean('is_offer')->default(false)->after('quantity');
            }
            if (!Schema::hasColumn('customer_carts', 'unit_price')) {
                $table->decimal('unit_price', 10, 2)->nullable()->after('is_offer');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_carts', function (Blueprint $table) {
            if (Schema::hasColumn('customer_carts', 'unit_price')) {
                $table->dropColumn('unit_price');
            }
            if (Schema::hasColumn('customer_carts', 'is_offer')) {
                $table->dropColumn('is_offer');
            }
        });
    }
};
