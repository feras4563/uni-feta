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
        Schema::create('account_defaults', function (Blueprint $table) {
            $table->id();
            $table->string('category')->unique(); // e.g., 'sales_revenue', 'accounts_receivable'
            $table->foreignId('account_id')->nullable()->constrained('accounts')->onDelete('set null');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_defaults');
    }
};
