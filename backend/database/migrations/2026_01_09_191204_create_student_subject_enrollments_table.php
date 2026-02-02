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
        Schema::create('student_subject_enrollments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('subject_id');
            $table->string('semester_id');
            $table->string('study_year_id');
            $table->string('department_id');
            $table->integer('semester_number');
            $table->date('enrollment_date')->default(DB::raw('CURRENT_DATE'));
            $table->enum('status', ['enrolled', 'completed', 'dropped', 'failed'])->default('enrolled');
            $table->decimal('grade', 5, 2)->nullable();
            $table->enum('grade_letter', ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'])->nullable();
            $table->boolean('passed')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            $table->foreign('study_year_id')->references('id')->on('study_years')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            
            $table->unique(['student_id', 'subject_id', 'semester_id'], 'stu_subj_sem_unique');
            $table->index(['student_id', 'semester_id']);
            $table->index(['subject_id', 'semester_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_subject_enrollments');
    }
};
