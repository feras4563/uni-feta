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
        if (!Schema::hasColumn('students', 'specialization_track')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('specialization_track')->nullable()->after('department_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('students', 'specialization_track')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('specialization_track');
            });
        }
    }
};
