<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('student_invoices', 'discount_type')) {
                $table->string('discount_type')->default('none')->after('discount');
            }
            if (!Schema::hasColumn('student_invoices', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)->nullable()->after('discount_type');
            }
            if (!Schema::hasColumn('student_invoices', 'discount_reason')) {
                $table->text('discount_reason')->nullable()->after('discount_percentage');
            }
            if (!Schema::hasColumn('student_invoices', 'discount_approved_by')) {
                $table->unsignedBigInteger('discount_approved_by')->nullable()->after('discount_reason');
            }
        });

        // Add FK in separate call to handle partial migration state
        try {
            Schema::table('student_invoices', function (Blueprint $table) {
                $table->foreign('discount_approved_by')->references('id')->on('users')->onDelete('set null');
            });
        } catch (\Exception $e) {
            // FK might already exist or column type mismatch - skip
        }
    }

    public function down(): void
    {
        Schema::table('student_invoices', function (Blueprint $table) {
            $table->dropForeign(['discount_approved_by']);
            $table->dropColumn([
                'discount_type',
                'discount_percentage',
                'discount_reason',
                'discount_approved_by',
            ]);
        });
    }
};
