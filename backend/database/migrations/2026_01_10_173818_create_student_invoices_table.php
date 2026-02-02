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
        Schema::create('student_invoices', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('invoice_number')->unique();
            $table->string('student_id');
            $table->string('semester_id');
            $table->string('study_year_id');
            $table->string('department_id');
            $table->integer('semester_number');
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 10, 3)->default(0);
            $table->decimal('discount', 10, 3)->default(0);
            $table->decimal('tax', 10, 3)->default(0);
            $table->decimal('total_amount', 10, 3)->default(0);
            $table->decimal('paid_amount', 10, 3)->default(0);
            $table->decimal('balance', 10, 3)->default(0);
            $table->enum('status', ['draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->timestamps();
            
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            $table->foreign('study_year_id')->references('id')->on('study_years')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->onDelete('set null');
            
            $table->index(['student_id', 'semester_id']);
            $table->index('status');
            $table->index('invoice_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_invoices');
    }
};
