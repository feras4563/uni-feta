<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('app_name')->default('UniERP Horizon');
            $table->text('app_logo_url')->nullable();
            $table->string('app_logo_name')->nullable();
            $table->string('theme_color', 20)->default('#059669');
            $table->string('language', 5)->default('ar');
            $table->string('timezone', 50)->default('Asia/Riyadh');
            $table->timestamps();
        });

        // Insert default settings
        DB::table('system_settings')->insert([
            'app_name' => 'UniERP Horizon',
            'app_logo_url' => null,
            'app_logo_name' => null,
            'theme_color' => '#059669',
            'language' => 'ar',
            'timezone' => 'Asia/Riyadh',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
