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
        Schema::create('student_semester_registrations', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('semester_id');
            $table->string('study_year_id');
            $table->string('department_id');
            $table->string('group_id')->nullable();
            $table->integer('semester_number');
            $table->date('registration_date')->default(DB::raw('CURRENT_DATE'));
            $table->enum('status', ['active', 'suspended', 'completed', 'dropped'])->default('active');
            $table->boolean('tuition_paid')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            $table->foreign('study_year_id')->references('id')->on('study_years')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('student_groups')->onDelete('set null');
            
            $table->unique(['student_id', 'semester_id']);
            $table->index(['student_id', 'semester_id']);
            $table->index('status');
            $table->index('group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_semester_registrations');
    }
};
