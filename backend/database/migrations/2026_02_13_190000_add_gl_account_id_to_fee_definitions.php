<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_definitions', function (Blueprint $table) {
            $table->unsignedBigInteger('gl_account_id')->nullable()->after('description');
            $table->foreign('gl_account_id')->references('id')->on('accounts')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('fee_definitions', function (Blueprint $table) {
            $table->dropForeign(['gl_account_id']);
            $table->dropColumn('gl_account_id');
        });
    }
};
