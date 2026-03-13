<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // student_semester_registrations: student_id + semester_id + department_id
        if (Schema::hasTable('student_semester_registrations')) {
            Schema::table('student_semester_registrations', function (Blueprint $table) {
                $table->index(['student_id', 'semester_id', 'department_id'], 'ssr_student_semester_dept_idx');
            });
        }

        // student_subject_enrollments: student_id + subject_id
        if (Schema::hasTable('student_subject_enrollments')) {
            Schema::table('student_subject_enrollments', function (Blueprint $table) {
                $table->index(['student_id', 'subject_id'], 'sse_student_subject_idx');
                $table->index(['student_id', 'semester_id'], 'sse_student_semester_idx');
            });
        }

        // attendance_records: session_id + student_id
        if (Schema::hasTable('attendance_records')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->index(['session_id', 'student_id'], 'ar_session_student_idx');
            });
        }

        // class_sessions: teacher_id + session_date
        if (Schema::hasTable('class_sessions')) {
            Schema::table('class_sessions', function (Blueprint $table) {
                $table->index(['teacher_id', 'session_date'], 'cs_teacher_date_idx');
            });
        }

        // student_invoices: student_id + semester_id
        if (Schema::hasTable('student_invoices')) {
            Schema::table('student_invoices', function (Blueprint $table) {
                $table->index(['student_id', 'semester_id'], 'si_student_semester_idx');
            });
        }

        // timetable_entries: teacher_id + day_of_week
        if (Schema::hasTable('timetable_entries')) {
            Schema::table('timetable_entries', function (Blueprint $table) {
                $table->index(['teacher_id', 'day_of_week'], 'te_teacher_day_idx');
                $table->index(['semester_id', 'department_id'], 'te_semester_dept_idx');
            });
        }

        // student_grades: student_id + subject_id
        if (Schema::hasTable('student_grades')) {
            Schema::table('student_grades', function (Blueprint $table) {
                $table->index(['student_id', 'subject_id'], 'sg_student_subject_idx');
                $table->index(['teacher_id', 'subject_id'], 'sg_teacher_subject_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('student_semester_registrations')) {
            Schema::table('student_semester_registrations', function (Blueprint $table) {
                $table->dropIndex('ssr_student_semester_dept_idx');
            });
        }

        if (Schema::hasTable('student_subject_enrollments')) {
            Schema::table('student_subject_enrollments', function (Blueprint $table) {
                $table->dropIndex('sse_student_subject_idx');
                $table->dropIndex('sse_student_semester_idx');
            });
        }

        if (Schema::hasTable('attendance_records')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->dropIndex('ar_session_student_idx');
            });
        }

        if (Schema::hasTable('class_sessions')) {
            Schema::table('class_sessions', function (Blueprint $table) {
                $table->dropIndex('cs_teacher_date_idx');
            });
        }

        if (Schema::hasTable('student_invoices')) {
            Schema::table('student_invoices', function (Blueprint $table) {
                $table->dropIndex('si_student_semester_idx');
            });
        }

        if (Schema::hasTable('timetable_entries')) {
            Schema::table('timetable_entries', function (Blueprint $table) {
                $table->dropIndex('te_teacher_day_idx');
                $table->dropIndex('te_semester_dept_idx');
            });
        }

        if (Schema::hasTable('student_grades')) {
            Schema::table('student_grades', function (Blueprint $table) {
                $table->dropIndex('sg_student_subject_idx');
                $table->dropIndex('sg_teacher_subject_idx');
            });
        }
    }
};
