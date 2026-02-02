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
        Schema::create('payment_entries', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('payment_mode_id');
            $table->string('party_type'); // student, teacher, supplier, etc.
            $table->string('party_id'); // ID of the party
            $table->enum('payment_type', ['receive', 'pay']); // receive money or pay money
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->string('reference_number')->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('journal_entry_id')->nullable(); // Link to generated journal entry
            $table->boolean('is_posted')->default(false);
            $table->timestamps();
            
            $table->foreign('payment_mode_id')->references('id')->on('payment_modes')->onDelete('restrict');
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->onDelete('set null');
            $table->index('party_type');
            $table->index('party_id');
            $table->index('payment_type');
            $table->index('payment_date');
            $table->index('is_posted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_entries');
    }
};
