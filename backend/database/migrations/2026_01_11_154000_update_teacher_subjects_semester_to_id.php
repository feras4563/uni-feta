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
            // Drop the unique constraint that includes semester
            $table->dropUnique('teacher_subj_year_sem_unique');
            
            // Drop the old semester enum column
            $table->dropColumn('semester');
            
            // Add semester_id as foreign key
            $table->string('semester_id')->nullable()->after('academic_year');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('set null');
            
            // Add study_year_id as foreign key
            $table->string('study_year_id')->nullable()->after('department_id');
            $table->foreign('study_year_id')->references('id')->on('study_years')->onDelete('set null');
            
            // Add new unique constraint
            $table->unique(['teacher_id', 'subject_id', 'semester_id'], 'teacher_subj_sem_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_subjects', function (Blueprint $table) {
            // Drop the new unique constraint
            $table->dropUnique('teacher_subj_sem_unique');
            
            // Drop foreign keys and columns
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
            
            $table->dropForeign(['study_year_id']);
            $table->dropColumn('study_year_id');
            
            // Add back the old semester enum column
            $table->enum('semester', ['fall', 'spring', 'summer'])->after('academic_year');
            
            // Add back the old unique constraint
            $table->unique(['teacher_id', 'subject_id', 'academic_year', 'semester'], 'teacher_subj_year_sem_unique');
        });
    }
};
