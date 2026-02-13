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
        Schema::table('students', function (Blueprint $table) {
            // Common fields (both Libyan and Foreign)
            $table->string('birth_place')->nullable()->after('birth_date');
            $table->string('certification_type')->nullable()->after('academic_history');
            $table->date('certification_date')->nullable()->after('certification_type');
            $table->string('certification_school')->nullable()->after('certification_date');
            $table->string('certification_specialization')->nullable()->after('certification_school');

            // Foreign student specific fields
            $table->string('port_of_entry')->nullable()->after('nationality');
            $table->string('visa_type')->nullable()->after('port_of_entry');
            $table->string('mother_name')->nullable()->after('visa_type');
            $table->string('mother_nationality')->nullable()->after('mother_name');

            // Passport details (for foreign students)
            $table->string('passport_number')->nullable()->after('mother_nationality');
            $table->date('passport_issue_date')->nullable()->after('passport_number');
            $table->date('passport_expiry_date')->nullable()->after('passport_issue_date');
            $table->string('passport_place_of_issue')->nullable()->after('passport_expiry_date');
        });

        // Update default nationality from سعودي to ليبيا
        \Illuminate\Support\Facades\DB::table('students')
            ->where('nationality', 'سعودي')
            ->update(['nationality' => 'ليبيا']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'birth_place',
                'certification_type',
                'certification_date',
                'certification_school',
                'certification_specialization',
                'port_of_entry',
                'visa_type',
                'mother_name',
                'mother_nationality',
                'passport_number',
                'passport_issue_date',
                'passport_expiry_date',
                'passport_place_of_issue',
            ]);
        });
    }
};
