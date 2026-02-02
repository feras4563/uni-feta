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
        Schema::create('student_groups', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('group_name');
            $table->string('department_id')->nullable();
            $table->string('semester_id')->nullable();
            $table->integer('semester_number');
            $table->integer('max_students')->default(30);
            $table->integer('current_students')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            
            $table->unique(['department_id', 'semester_id', 'group_name'], 'dept_sem_group_unique');
            $table->index(['department_id', 'semester_id']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_groups');
    }
};
