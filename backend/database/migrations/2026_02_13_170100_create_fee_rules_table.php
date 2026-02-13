<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_rules', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('fee_definition_id');
            $table->string('department_id')->nullable(); // null = applies to all departments
            $table->integer('target_semester')->nullable(); // null = applies to all semesters
            $table->decimal('override_amount', 10, 3)->nullable(); // null = use default_amount from definition
            $table->string('condition_type')->nullable(); // e.g. 'total_credits_gt', 'student_year_eq', 'nationality_eq'
            $table->string('condition_value')->nullable(); // e.g. '12', '3', 'foreign'
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('fee_definition_id')->references('id')->on('fee_definitions')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');

            $table->index('fee_definition_id');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_rules');
    }
};
