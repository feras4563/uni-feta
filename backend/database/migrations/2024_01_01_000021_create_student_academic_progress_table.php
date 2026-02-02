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
        Schema::create('student_academic_progress', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('department_id');
            $table->integer('current_semester');
            $table->string('current_study_year_id');
            $table->integer('total_credits_earned')->default(0);
            $table->decimal('gpa', 3, 2)->nullable();
            $table->enum('status', ['active', 'graduated', 'suspended', 'dropped'])->default('active');
            $table->date('graduation_date')->nullable();
            $table->timestamps();
            
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('current_study_year_id')->references('id')->on('study_years')->onDelete('cascade');
            
            $table->index('student_id');
            $table->index('department_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_academic_progress');
    }
};
