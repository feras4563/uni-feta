<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'pdf_file_url')) {
                $table->string('pdf_file_url')->nullable()->after('max_students');
            }

            if (!Schema::hasColumn('subjects', 'pdf_file_name')) {
                $table->string('pdf_file_name')->nullable()->after('pdf_file_url');
            }

            if (!Schema::hasColumn('subjects', 'pdf_file_size')) {
                $table->unsignedBigInteger('pdf_file_size')->nullable()->after('pdf_file_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('subjects', 'pdf_file_size')) {
                $columns[] = 'pdf_file_size';
            }

            if (Schema::hasColumn('subjects', 'pdf_file_name')) {
                $columns[] = 'pdf_file_name';
            }

            if (Schema::hasColumn('subjects', 'pdf_file_url')) {
                $columns[] = 'pdf_file_url';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
