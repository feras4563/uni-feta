<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_definitions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->decimal('default_amount', 10, 3)->default(0);
            $table->boolean('is_refundable')->default(false);
            $table->enum('frequency', ['one_time', 'per_semester', 'per_credit', 'annual'])->default('one_time');
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_definitions');
    }
};
