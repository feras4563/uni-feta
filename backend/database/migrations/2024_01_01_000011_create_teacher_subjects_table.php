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
        Schema::create('teacher_subjects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('teacher_id');
            $table->string('subject_id');
            $table->string('department_id');
            
            // Academic period
            $table->string('academic_year', 20);
            $table->enum('semester', ['fall', 'spring', 'summer']);
            
            // Assignment details
            $table->boolean('is_primary_teacher')->default(true);
            $table->boolean('can_edit_grades')->default(true);
            $table->boolean('can_take_attendance')->default(true);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->date('start_date')->default(DB::raw('CURRENT_DATE'));
            $table->date('end_date')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            
            // Prevent duplicate assignments
            $table->unique(['teacher_id', 'subject_id', 'academic_year', 'semester'], 'teacher_subj_year_sem_unique');
            $table->index('teacher_id');
            $table->index('subject_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_subjects');
    }
};
