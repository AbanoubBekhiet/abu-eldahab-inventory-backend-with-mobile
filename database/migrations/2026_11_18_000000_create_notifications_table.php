<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->comment('NULL = broadcast to all');
            $table->string('title');
            $table->text('body');
            $table->string('type')->default('custom')->comment('custom, offer, order');
            $table->json('data')->nullable();
            $table->unsignedBigInteger('sent_by')->comment('admin user id who sent');
            $table->timestamps();

            $table->index('user_id');
            $table->index('sent_by');
            $table->index('type');
            $table->index('created_at');
        });

        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notification_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('read_at')->useCurrent();

            $table->unique(['notification_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_reads');
        Schema::dropIfExists('notifications');
    }
};
