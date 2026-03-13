<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add academic_standing to student_academic_progress
        Schema::table('student_academic_progress', function (Blueprint $table) {
            $table->enum('academic_standing', [
                'good_standing',
                'probation',
                'dismissed',
                'deans_list',
            ])->default('good_standing')->after('status');
            $table->text('progression_notes')->nullable()->after('academic_standing');
            $table->timestamp('last_evaluated_at')->nullable()->after('progression_notes');
        });

        // Add is_retake + original_enrollment_id to student_subject_enrollments
        Schema::table('student_subject_enrollments', function (Blueprint $table) {
            $table->boolean('is_retake')->default(false)->after('notes');
            $table->string('original_enrollment_id')->nullable()->after('is_retake');

            $table->foreign('original_enrollment_id')
                ->references('id')
                ->on('student_subject_enrollments')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('student_subject_enrollments', function (Blueprint $table) {
            $table->dropForeign(['original_enrollment_id']);
            $table->dropColumn(['is_retake', 'original_enrollment_id']);
        });

        Schema::table('student_academic_progress', function (Blueprint $table) {
            $table->dropColumn(['academic_standing', 'progression_notes', 'last_evaluated_at']);
        });
    }
};
