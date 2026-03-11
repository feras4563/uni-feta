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
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->string('timetable_id')->nullable()->after('id');
            $table->foreign('timetable_id')->references('id')->on('timetable_entries')->nullOnDelete();
            $table->index('timetable_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropForeign(['timetable_id']);
            $table->dropIndex(['timetable_id']);
            $table->dropColumn('timetable_id');
        });
    }
};
