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
        Schema::create('subjects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('credits')->default(3);
            $table->string('department_id')->nullable();
            
            // Cost Information
            $table->decimal('cost_per_credit', 10, 2)->default(0.00);
            // Note: total_cost is a generated column in PostgreSQL, handled in raw SQL if needed
            
            // Academic Information
            $table->boolean('is_required')->default(false);
            $table->integer('semester_number')->default(1);
            $table->string('semester')->nullable();
            $table->json('prerequisites')->nullable(); // Array in PostgreSQL, JSON in Laravel
            $table->string('teacher_id')->nullable();
            
            // Capacity Information
            $table->integer('max_students')->default(30);
            
            // Status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->index('name');
            $table->index('code');
            $table->index('department_id');
            $table->index('is_active');
            $table->index('semester_number');
            $table->index('is_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
