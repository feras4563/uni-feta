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
        Schema::create('class_schedules', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('teacher_id');
            $table->string('subject_id');
            $table->string('department_id');
            
            // Schedule details
            $table->integer('day_of_week'); // 0=Sunday, 6=Saturday
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room', 100)->nullable();
            
            // Academic period
            $table->string('academic_year', 20);
            $table->enum('semester', ['fall', 'spring', 'summer']);
            
            // Schedule metadata
            $table->enum('class_type', ['lecture', 'lab', 'tutorial', 'seminar'])->default('lecture');
            $table->integer('max_students')->default(50);
            $table->boolean('is_recurring')->default(true);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->default(DB::raw('CURRENT_DATE'));
            $table->date('effective_to')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            
            $table->index('teacher_id');
            $table->index(['day_of_week', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_schedules');
    }
};
