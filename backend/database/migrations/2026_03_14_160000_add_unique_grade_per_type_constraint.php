<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enforce one grade per type per student per subject per semester.
     * With only 3 grade types (classwork, midterm, final), each student
     * can have at most 3 grade records per subject per semester.
     *
     * Also cleans up any legacy grade types that are no longer valid.
     */
    public function up(): void
    {
        // 1. Delete legacy grade types that are no longer supported
        DB::table('student_grades')
            ->whereNotIn('grade_type', ['classwork', 'midterm', 'final'])
            ->delete();

        // 2. Deduplicate: keep only the latest grade per student+subject+semester+type
        $duplicates = DB::select("
            SELECT sg.id
            FROM student_grades sg
            INNER JOIN (
                SELECT student_id, subject_id, semester_id, grade_type, MAX(updated_at) as latest
                FROM student_grades
                GROUP BY student_id, subject_id, semester_id, grade_type
                HAVING COUNT(*) > 1
            ) dup ON sg.student_id = dup.student_id
                AND sg.subject_id = dup.subject_id
                AND (sg.semester_id = dup.semester_id OR (sg.semester_id IS NULL AND dup.semester_id IS NULL))
                AND sg.grade_type = dup.grade_type
                AND sg.updated_at < dup.latest
        ");

        $idsToDelete = array_map(fn($row) => $row->id, $duplicates);
        if (!empty($idsToDelete)) {
            DB::table('student_grades')->whereIn('id', $idsToDelete)->delete();
        }

        // 3. Add unique constraint
        Schema::table('student_grades', function (Blueprint $table) {
            $table->unique(
                ['student_id', 'subject_id', 'semester_id', 'grade_type'],
                'uq_student_subject_semester_grade_type'
            );
        });
    }

    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropUnique('uq_student_subject_semester_grade_type');
        });
    }
};
