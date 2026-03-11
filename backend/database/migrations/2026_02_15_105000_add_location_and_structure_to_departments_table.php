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
        if (!Schema::hasColumn('departments', 'location')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->string('location')->nullable()->after('description');
            });
        }

        if (!Schema::hasColumn('departments', 'structure')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->string('structure')->nullable()->after('location');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('departments', 'structure')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('structure');
            });
        }

        if (Schema::hasColumn('departments', 'location')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('location');
            });
        }
    }
};
