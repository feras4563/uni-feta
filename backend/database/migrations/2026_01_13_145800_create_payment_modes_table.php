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
        Schema::create('payment_modes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('account_id'); // Linked account for journal entries
            $table->enum('type', ['cash', 'bank', 'card', 'check', 'other'])->default('cash');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('restrict');
            $table->index('is_active');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_modes');
    }
};
