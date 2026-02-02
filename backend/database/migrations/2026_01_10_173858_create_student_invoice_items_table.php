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
        Schema::create('student_invoice_items', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('invoice_id');
            $table->string('subject_id');
            $table->string('enrollment_id')->nullable();
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 3)->default(0);
            $table->decimal('amount', 10, 3)->default(0);
            $table->timestamps();
            
            $table->foreign('invoice_id')->references('id')->on('student_invoices')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('enrollment_id')->references('id')->on('student_subject_enrollments')->onDelete('set null');
            
            $table->index('invoice_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_invoice_items');
    }
};
