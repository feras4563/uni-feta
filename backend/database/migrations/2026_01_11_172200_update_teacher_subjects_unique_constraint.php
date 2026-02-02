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
        Schema::table('teacher_subjects', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique('teacher_subj_sem_unique');
            
            // Add new unique constraint that includes department_id
            $table->unique(['teacher_id', 'subject_id', 'semester_id', 'department_id'], 'teacher_subj_sem_dept_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_subjects', function (Blueprint $table) {
            // Drop the new unique constraint
            $table->dropUnique('teacher_subj_sem_dept_unique');
            
            // Add back the old unique constraint
            $table->unique(['teacher_id', 'subject_id', 'semester_id'], 'teacher_subj_sem_unique');
        });
    }
};
