<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('semester_id')->nullable()->after('department_id');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('set null');
            $table->index('semester_id');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropIndex(['semester_id']);
            $table->dropColumn('semester_id');
        });
    }
};
