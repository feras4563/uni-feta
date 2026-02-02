<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Users in Database ===\n\n";

$users = User::all();

foreach ($users as $user) {
    echo "ID: {$user->id}\n";
    echo "Email: {$user->email}\n";
    echo "Name: {$user->name}\n";
    echo "Password Hash: " . substr($user->password, 0, 20) . "...\n";
    
    // Test password
    $testPassword = 'password123';
    $matches = Hash::check($testPassword, $user->password);
    echo "Password 'password123' matches: " . ($matches ? 'YES' : 'NO') . "\n";
    echo "---\n";
}

echo "\nTotal users: " . $users->count() . "\n";
