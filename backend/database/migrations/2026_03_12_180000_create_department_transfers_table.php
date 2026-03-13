<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_transfers', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('from_department_id');
            $table->string('to_department_id');
            $table->string('semester_id')->nullable();
            $table->string('approved_by')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $table->text('reason')->nullable();
            $table->text('admin_notes')->nullable();
            $table->integer('credits_transferred')->default(0);
            $table->json('transferred_subjects')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('from_department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('to_department_id')->references('id')->on('departments')->onDelete('cascade');

            $table->index('student_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_transfers');
    }
};
