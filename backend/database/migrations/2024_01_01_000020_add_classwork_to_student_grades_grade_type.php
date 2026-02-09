<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add 'classwork' grade type for درجة اعمال الفصل
     */
    public function up(): void
    {
        // For SQLite (dev) and PostgreSQL/MySQL compatibility
        // Drop the enum constraint and recreate with new value
        Schema::table('student_grades', function (Blueprint $table) {
            $table->string('grade_type', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: changing back to enum would lose data
    }
};
