<?php

// Run this file with: php create_test_user.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\AppUser;
use Illuminate\Support\Facades\Hash;

echo "Creating test users...\n\n";

// Create Manager User
$managerUser = User::firstOrCreate(
    ['email' => 'manager@test.com'],
    [
        'name' => 'مدير النظام',
        'password' => Hash::make('password123'),
    ]
);

AppUser::firstOrCreate(
    ['auth_user_id' => $managerUser->id],
    [
        'email' => $managerUser->email,
        'full_name' => 'مدير النظام',
        'role' => 'manager',
        'status' => 'active',
    ]
);

echo "✅ Manager created:\n";
echo "   Email: manager@test.com\n";
echo "   Password: password123\n";
echo "   Role: manager\n\n";

// Create Staff User
$staffUser = User::firstOrCreate(
    ['email' => 'staff@test.com'],
    [
        'name' => 'موظف النظام',
        'password' => Hash::make('password123'),
    ]
);

AppUser::firstOrCreate(
    ['auth_user_id' => $staffUser->id],
    [
        'email' => $staffUser->email,
        'full_name' => 'موظف النظام',
        'role' => 'staff',
        'status' => 'active',
    ]
);

echo "✅ Staff created:\n";
echo "   Email: staff@test.com\n";
echo "   Password: password123\n";
echo "   Role: staff\n\n";

// Create Teacher User
$teacherUser = User::firstOrCreate(
    ['email' => 'teacher@test.com'],
    [
        'name' => 'مدرس النظام',
        'password' => Hash::make('password123'),
    ]
);

AppUser::firstOrCreate(
    ['auth_user_id' => $teacherUser->id],
    [
        'email' => $teacherUser->email,
        'full_name' => 'مدرس النظام',
        'role' => 'teacher',
        'status' => 'active',
    ]
);

echo "✅ Teacher created:\n";
echo "   Email: teacher@test.com\n";
echo "   Password: password123\n";
echo "   Role: teacher\n\n";

echo "🎉 All test users created successfully!\n";
echo "\nYou can now login with any of these accounts.\n";
