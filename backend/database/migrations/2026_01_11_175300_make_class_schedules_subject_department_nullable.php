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
        Schema::table('class_schedules', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['department_id']);
            
            // Make columns nullable
            $table->string('subject_id')->nullable()->change();
            $table->string('department_id')->nullable()->change();
            
            // Re-add foreign keys
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_schedules', function (Blueprint $table) {
            // Drop foreign keys
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['department_id']);
            
            // Make columns not nullable
            $table->string('subject_id')->nullable(false)->change();
            $table->string('department_id')->nullable(false)->change();
            
            // Re-add foreign keys
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });
    }
};
