<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\AppUser;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Manager User
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@university.edu'],
            [
                'name' => 'System Manager',
                'password' => Hash::make('password123'),
            ]
        );

        AppUser::updateOrCreate(
            ['auth_user_id' => $managerUser->id],
            [
                'email' => $managerUser->email,
                'full_name' => 'System Manager',
                'role' => 'manager',
                'status' => 'active',
            ]
        );

        // Create Staff Users
        $staffUsers = [
            [
                'email' => 'abrar@university.edu',
                'name' => 'Abrar',
                'full_name' => 'أبرار',
            ],
            [
                'email' => 'raneem@university.edu',
                'name' => 'Raneem',
                'full_name' => 'رنيم',
            ],
            [
                'email' => 'lujine@university.edu',
                'name' => 'Lujine',
                'full_name' => 'لجين',
            ],
            [
                'email' => 'staff@university.edu',
                'name' => 'Staff',
                'full_name' => 'موظف عام',
            ],
        ];

        foreach ($staffUsers as $staffData) {
            $staffUser = User::updateOrCreate(
                ['email' => $staffData['email']],
                [
                    'name' => $staffData['name'],
                    'password' => Hash::make('password123'),
                ]
            );

            AppUser::updateOrCreate(
                ['auth_user_id' => $staffUser->id],
                [
                    'email' => $staffUser->email,
                    'full_name' => $staffData['full_name'],
                    'role' => 'staff',
                    'status' => 'active',
                ]
            );
        }

        $this->command->info('✅ Manager and Staff users created successfully!');
        $this->command->info('📧 Manager: manager@university.edu / password123');
        $this->command->info('📧 Staff (Abrar): abrar@university.edu / password123');
        $this->command->info('📧 Staff (Raneem): raneem@university.edu / password123');
        $this->command->info('📧 Staff (Lujine): lujine@university.edu / password123');
        $this->command->info('📧 Staff (General): staff@university.edu / password123');
    }
}
