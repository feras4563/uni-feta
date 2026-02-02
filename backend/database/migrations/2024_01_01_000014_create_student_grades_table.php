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
        Schema::create('student_grades', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('subject_id');
            $table->string('teacher_id');
            
            // Grade details
            $table->enum('grade_type', ['midterm', 'final', 'assignment', 'quiz', 'project', 'participation', 'homework']);
            $table->string('grade_name');
            $table->decimal('grade_value', 5, 2);
            $table->decimal('max_grade', 5, 2)->default(100);
            $table->decimal('weight', 3, 2)->default(1.0);
            
            // Timing
            $table->date('grade_date')->default(DB::raw('CURRENT_DATE'));
            $table->date('due_date')->nullable();
            
            // Metadata
            $table->text('description')->nullable();
            $table->text('feedback')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
            
            $table->index('student_id');
            $table->index('subject_id');
            $table->index('teacher_id');
            $table->index('grade_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_grades');
    }
};
