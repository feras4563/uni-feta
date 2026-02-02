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
        Schema::create('subject_titles', function (Blueprint $table) {
            $table->id();
            $table->string('subject_id');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->string('title');
            $table->string('title_en')->nullable();
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
            
            $table->index('subject_id');
            $table->index('order_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_titles');
    }
};
