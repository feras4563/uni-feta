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
        Schema::create('rooms', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('room_number')->unique();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->enum('room_type', ['lecture', 'lab', 'seminar', 'conference']);
            $table->integer('capacity');
            $table->integer('floor')->nullable();
            $table->string('building')->nullable();
            $table->json('equipment')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('room_type');
            $table->index('building');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
