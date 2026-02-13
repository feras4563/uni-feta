<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_invoice_items', function (Blueprint $table) {
            $table->string('fee_definition_id')->nullable()->after('enrollment_id');
            $table->string('subject_id')->nullable()->change(); // make subject_id nullable since fee items may not be subject-related

            $table->foreign('fee_definition_id')->references('id')->on('fee_definitions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('student_invoice_items', function (Blueprint $table) {
            $table->dropForeign(['fee_definition_id']);
            $table->dropColumn('fee_definition_id');
        });
    }
};
