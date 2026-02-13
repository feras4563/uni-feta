<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedBigInteger('auth_user_id')->nullable()->after('id');
            $table->foreign('auth_user_id')->references('id')->on('users')->onDelete('set null');
            $table->index('auth_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['auth_user_id']);
            $table->dropIndex(['auth_user_id']);
            $table->dropColumn('auth_user_id');
        });
    }
};
