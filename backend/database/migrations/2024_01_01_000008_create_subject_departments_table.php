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
        Schema::create('subject_departments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('subject_id');
            $table->string('department_id');
            
            // Additional metadata for the relationship
            $table->boolean('is_primary_department')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            
            // Prevent duplicate relationships
            $table->unique(['subject_id', 'department_id']);
            $table->index('subject_id');
            $table->index('department_id');
            $table->index(['subject_id', 'is_primary_department']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_departments');
    }
};
