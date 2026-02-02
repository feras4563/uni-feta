<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "Testing login credentials...\n\n";

$user = User::where('email', 'manager@university.edu')->first();

if (!$user) {
    echo "❌ User not found!\n";
    exit(1);
}

echo "✅ User found:\n";
echo "   ID: {$user->id}\n";
echo "   Name: {$user->name}\n";
echo "   Email: {$user->email}\n";
echo "   Password hash: " . substr($user->password, 0, 30) . "...\n\n";

$testPassword = 'password123';
$isValid = Hash::check($testPassword, $user->password);

echo "Testing password: '{$testPassword}'\n";
echo "Result: " . ($isValid ? "✅ VALID" : "❌ INVALID") . "\n\n";

if (!$isValid) {
    echo "Attempting to reset password...\n";
    $user->password = Hash::make($testPassword);
    $user->save();
    echo "✅ Password reset successfully!\n";
    echo "New hash: " . substr($user->password, 0, 30) . "...\n";
}
