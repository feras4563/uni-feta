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
        Schema::table('teachers', function (Blueprint $table) {
            // Academic Information
            $table->enum('qualification', ['رئيس قسم', 'محاضر', 'متعاون'])->nullable()->after('specialization');
            $table->string('education_level')->nullable()->after('qualification');
            $table->integer('years_experience')->nullable()->after('education_level');
            $table->json('specializations')->nullable()->after('years_experience');
            
            // Teaching Information
            $table->integer('teaching_hours')->nullable()->after('specializations');
            $table->text('academic_records')->nullable()->after('teaching_hours');
            
            // Financial Information
            $table->decimal('basic_salary', 10, 2)->nullable()->after('academic_records');
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('basic_salary');
            
            // Additional Information
            $table->text('bio')->nullable()->after('hourly_rate');
            $table->string('office_location')->nullable()->after('bio');
            $table->string('office_hours')->nullable()->after('office_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn([
                'qualification',
                'education_level',
                'years_experience',
                'specializations',
                'teaching_hours',
                'academic_records',
                'basic_salary',
                'hourly_rate',
                'bio',
                'office_location',
                'office_hours',
            ]);
        });
    }
};
