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
        Schema::create('holidays', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();

            $table->index(['start_date', 'end_date']);
            $table->index('is_recurring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
