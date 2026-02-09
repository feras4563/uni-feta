<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add campus_id to students table
        Schema::table('students', function (Blueprint $table) {
            $table->string('campus_id', 10)->unique()->nullable()->after('id');
            $table->index('campus_id');
        });

        // Add campus_id to teachers table
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('campus_id', 10)->unique()->nullable()->after('id');
            $table->index('campus_id');
        });

        // Generate campus IDs for existing students
        $students = DB::table('students')->orderBy('created_at')->get();
        $counter = 1;
        foreach ($students as $student) {
            DB::table('students')
                ->where('id', $student->id)
                ->update(['campus_id' => 'S' . str_pad($counter, 6, '0', STR_PAD_LEFT)]);
            $counter++;
        }

        // Generate campus IDs for existing teachers
        $teachers = DB::table('teachers')->orderBy('created_at')->get();
        $counter = 1;
        foreach ($teachers as $teacher) {
            DB::table('teachers')
                ->where('id', $teacher->id)
                ->update(['campus_id' => 'T' . str_pad($counter, 6, '0', STR_PAD_LEFT)]);
            $counter++;
        }

        // Make campus_id NOT NULL after populating existing records
        Schema::table('students', function (Blueprint $table) {
            $table->string('campus_id', 10)->nullable(false)->change();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('campus_id', 10)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['campus_id']);
            $table->dropColumn('campus_id');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropIndex(['campus_id']);
            $table->dropColumn('campus_id');
        });
    }
};
