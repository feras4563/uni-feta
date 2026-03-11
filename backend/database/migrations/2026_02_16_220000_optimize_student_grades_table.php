<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optimize student_grades table:
     * - Add semester_id for efficient semester-based queries (if not present)
     * - Add composite indexes for common query patterns
     * - Add is_published index for student portal filtering
     */
    public function up(): void
    {
        // Add semester_id only if it doesn't already exist
        if (!Schema::hasColumn('student_grades', 'semester_id')) {
            Schema::table('student_grades', function (Blueprint $table) {
                $table->string('semester_id')->nullable()->after('teacher_id');
                $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('set null');
            });
        }

        Schema::table('student_grades', function (Blueprint $table) {
            // Composite index: student portal grades query (student + published + date)
            $table->index(['student_id', 'is_published', 'grade_date'], 'idx_student_published_date');

            // Composite index: teacher subject grades query (subject + teacher)
            $table->index(['subject_id', 'teacher_id'], 'idx_subject_teacher');

            // Semester-based queries
            $table->index('semester_id', 'idx_semester');
        });

        // Upsert lookup index with prefix lengths to fit within key size limit
        DB::statement('CREATE INDEX idx_grade_upsert ON student_grades (student_id(36), subject_id(36), teacher_id(36), grade_type(50))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropIndex('idx_student_published_date');
            $table->dropIndex('idx_subject_teacher');
            $table->dropIndex('idx_grade_upsert');
            $table->dropIndex('idx_semester');
        });

        if (Schema::hasColumn('student_grades', 'semester_id')) {
            Schema::table('student_grades', function (Blueprint $table) {
                $table->dropForeign(['semester_id']);
                $table->dropColumn('semester_id');
            });
        }
    }
};
