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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('session_id');
            $table->string('student_id');
            
            // Attendance details
            $table->timestamp('scan_time')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->enum('status', ['present', 'late', 'absent', 'excused'])->default('present');
            
            // QR validation data
            $table->text('student_qr_code')->nullable();
            $table->string('class_qr_signature')->nullable();
            
            // Security & tracking
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('location_data')->nullable();
            $table->boolean('is_manual_entry')->default(false);
            
            // Metadata
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('session_id')->references('id')->on('class_sessions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            
            // Prevent duplicate attendance for same session
            $table->unique(['session_id', 'student_id']);
            $table->index('session_id');
            $table->index('student_id');
            $table->index('scan_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
