<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSettings;

echo "=== Testing System Settings ===\n\n";

try {
    // Check if table exists
    $settings = SystemSettings::first();
    
    if ($settings) {
        echo "✅ System settings found:\n";
        echo "ID: {$settings->id}\n";
        echo "App Name: {$settings->app_name}\n";
        echo "Logo URL: " . ($settings->app_logo_url ?? 'null') . "\n";
        echo "Logo Name: " . ($settings->app_logo_name ?? 'null') . "\n";
    } else {
        echo "⚠️ No system settings found in database\n";
        echo "Creating default settings...\n";
        
        $settings = SystemSettings::create([
            'app_name' => 'UniERP Horizon',
            'theme_color' => '#059669',
            'language' => 'ar',
            'timezone' => 'Asia/Riyadh',
        ]);
        
        echo "✅ Default settings created!\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
