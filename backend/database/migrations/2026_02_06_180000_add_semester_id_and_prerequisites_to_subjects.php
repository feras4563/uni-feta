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
        // Add semester_id FK to subjects table (links to opened semesters)
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('semester_id')->nullable()->after('semester');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('set null');
            $table->index('semester_id');
        });

        // Create subject_prerequisites pivot table
        Schema::create('subject_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->string('subject_id');
            $table->string('prerequisite_id');
            $table->timestamps();

            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('prerequisite_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->unique(['subject_id', 'prerequisite_id']);
            $table->index('subject_id');
            $table->index('prerequisite_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_prerequisites');

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropIndex(['semester_id']);
            $table->dropColumn('semester_id');
        });
    }
};
