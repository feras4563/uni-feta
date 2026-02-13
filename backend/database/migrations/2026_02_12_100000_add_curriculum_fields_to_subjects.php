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
        Schema::table('subjects', function (Blueprint $table) {
            // Hours breakdown: theoretical (lectures) and practical (lab/studio)
            $table->integer('theoretical_hours')->default(0)->after('weekly_hours');
            $table->integer('practical_hours')->default(0)->after('theoretical_hours');

            // Subject type: required, elective, university_requirement, etc.
            $table->string('subject_type')->default('required')->after('is_required');

            // Minimum completed units required before enrolling (e.g., "100 units completed")
            $table->integer('min_units_required')->nullable()->after('prerequisites');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['theoretical_hours', 'practical_hours', 'subject_type', 'min_units_required']);
        });
    }
};
