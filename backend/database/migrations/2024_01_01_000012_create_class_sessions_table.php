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
        Schema::create('class_sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('teacher_id');
            $table->string('subject_id');
            $table->string('department_id');
            
            // Session details
            $table->string('session_name');
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room', 100)->nullable();
            
            // QR Code system
            $table->text('qr_code_data')->nullable();
            $table->timestamp('qr_generated_at')->nullable();
            $table->timestamp('qr_expires_at')->nullable();
            $table->string('qr_signature')->nullable();
            
            // Session status
            $table->enum('status', ['scheduled', 'active', 'completed', 'cancelled'])->default('scheduled');
            $table->integer('max_students')->default(50);
            
            // Metadata
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            
            $table->index('teacher_id');
            $table->index('subject_id');
            $table->index('session_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_sessions');
    }
};
