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
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->unsignedBigInteger('marked_by_id')->nullable()->after('student_id');
            $table->boolean('is_override')->default(false)->after('is_manual_entry');

            $table->foreign('marked_by_id')->references('id')->on('users')->nullOnDelete();
            $table->index('marked_by_id');
            $table->index('is_override');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropForeign(['marked_by_id']);
            $table->dropIndex(['marked_by_id']);
            $table->dropIndex(['is_override']);
            $table->dropColumn(['marked_by_id', 'is_override']);
        });
    }
};
