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
        Schema::table('timetable_entries', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['room_id']);
            $table->dropForeign(['time_slot_id']);
            
            // Make columns nullable
            $table->string('room_id')->nullable()->change();
            $table->string('time_slot_id')->nullable()->change();
            
            // Re-add foreign keys
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('time_slot_id')->references('id')->on('time_slots')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_entries', function (Blueprint $table) {
            // Drop foreign keys
            $table->dropForeign(['room_id']);
            $table->dropForeign(['time_slot_id']);
            
            // Make columns not nullable
            $table->string('room_id')->nullable(false)->change();
            $table->string('time_slot_id')->nullable(false)->change();
            
            // Re-add foreign keys
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('time_slot_id')->references('id')->on('time_slots')->onDelete('cascade');
        });
    }
};
