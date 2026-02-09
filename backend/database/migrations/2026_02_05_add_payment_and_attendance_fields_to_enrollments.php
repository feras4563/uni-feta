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
        Schema::table('student_subject_enrollments', function (Blueprint $table) {
            // Payment status tracking
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid')->after('status');
            
            // Attendance permission - can be overridden by admin even if not fully paid
            $table->boolean('attendance_allowed')->default(false)->after('payment_status');
            
            // Admin override flag - tracks if admin manually allowed attendance despite payment status
            $table->boolean('admin_override')->default(false)->after('attendance_allowed');
            
            // Link to invoice for tracking
            $table->string('invoice_id')->nullable()->after('admin_override');
            
            // Add index for payment queries
            $table->index('payment_status');
            $table->index('attendance_allowed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_subject_enrollments', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['attendance_allowed']);
            $table->dropColumn(['payment_status', 'attendance_allowed', 'admin_override', 'invoice_id']);
        });
    }
};
