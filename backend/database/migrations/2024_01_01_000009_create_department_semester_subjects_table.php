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
        Schema::create('department_semester_subjects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('department_id');
            $table->string('semester_id');
            $table->string('subject_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            
            // Ensure unique combination of department, semester, and subject
            $table->unique(['department_id', 'semester_id', 'subject_id'], 'dept_sem_subj_unique');
            $table->index('department_id');
            $table->index('semester_id');
            $table->index('subject_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_semester_subjects');
    }
};
