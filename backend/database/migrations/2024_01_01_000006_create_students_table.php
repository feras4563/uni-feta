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
        Schema::create('students', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('email')->unique();
            $table->string('national_id_passport')->unique();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('department_id')->nullable();
            
            // Academic Information
            $table->integer('year')->default(1);
            $table->enum('status', ['active', 'inactive', 'graduated', 'suspended'])->default('active');
            
            // Personal Information
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('nationality')->default('سعودي');
            $table->date('birth_date')->nullable();
            $table->date('enrollment_date')->default(DB::raw('CURRENT_DATE'));
            
            // Sponsor Information
            $table->string('sponsor_name')->nullable();
            $table->string('sponsor_contact')->nullable();
            
            // Academic Records
            $table->text('academic_history')->nullable();
            $table->decimal('academic_score', 5, 2)->nullable();
            $table->string('transcript_file')->nullable();
            $table->string('qr_code')->nullable();
            
            $table->timestamps();
            
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->index('email');
            $table->index('national_id_passport');
            $table->index('department_id');
            $table->index('status');
            $table->index('year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
