<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Expand the role enum to include 'student'
        DB::statement("ALTER TABLE app_users MODIFY COLUMN role ENUM('manager', 'staff', 'teacher', 'student') DEFAULT 'staff'");

        Schema::table('app_users', function (Blueprint $table) {
            $table->string('student_id')->nullable()->after('teacher_id');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('set null');
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::table('app_users', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropIndex(['student_id']);
            $table->dropColumn('student_id');
        });

        DB::statement("ALTER TABLE app_users MODIFY COLUMN role ENUM('manager', 'staff', 'teacher') DEFAULT 'staff'");
    }
};
