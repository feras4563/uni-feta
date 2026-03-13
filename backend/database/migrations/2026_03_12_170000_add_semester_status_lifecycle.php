<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->enum('status', [
                'registration_open',
                'in_progress',
                'grade_entry',
                'finalized',
            ])->default('registration_open')->after('is_active');
            $table->timestamp('finalized_at')->nullable()->after('status');
            $table->string('finalized_by')->nullable()->after('finalized_at');
        });
    }

    public function down(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->dropColumn(['status', 'finalized_at', 'finalized_by']);
        });
    }
};
