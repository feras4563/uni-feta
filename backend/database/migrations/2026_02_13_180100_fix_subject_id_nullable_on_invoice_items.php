<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Use raw SQL to make subject_id nullable without doctrine/dbal
        // This is needed because fee-based invoice items don't have a subject_id
        DB::statement('ALTER TABLE student_invoice_items MODIFY COLUMN subject_id VARCHAR(255) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE student_invoice_items MODIFY COLUMN subject_id VARCHAR(255) NOT NULL');
    }
};
