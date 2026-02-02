<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Auth;

echo "Testing JWT authentication...\n\n";

$credentials = [
    'email' => 'manager@university.edu',
    'password' => 'password123',
];

echo "Attempting login with:\n";
echo "  Email: {$credentials['email']}\n";
echo "  Password: {$credentials['password']}\n\n";

try {
    $token = auth('api')->attempt($credentials);
    
    if ($token) {
        echo "✅ Authentication successful!\n";
        echo "Token: " . substr($token, 0, 50) . "...\n\n";
        
        $user = auth('api')->user();
        echo "User details:\n";
        echo "  ID: {$user->id}\n";
        echo "  Name: {$user->name}\n";
        echo "  Email: {$user->email}\n";
    } else {
        echo "❌ Authentication failed!\n";
        echo "Credentials are incorrect or JWT is not configured properly.\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
