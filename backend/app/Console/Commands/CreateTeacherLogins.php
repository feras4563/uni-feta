<?php

namespace App\Console\Commands;

use App\Models\Teacher;
use App\Models\User;
use App\Models\AppUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTeacherLogins extends Command
{
    protected $signature = 'teachers:create-logins';
    protected $description = 'Create login accounts (User + AppUser) for all existing teachers that do not have one';

    public function handle()
    {
        $teachers = Teacher::whereNull('auth_user_id')
            ->orWhereDoesntHave('authUser')
            ->get();

        if ($teachers->isEmpty()) {
            $this->info('All teachers already have login accounts.');
            return 0;
        }

        $this->info("Found {$teachers->count()} teachers without login accounts.");

        $created = 0;
        foreach ($teachers as $teacher) {
            try {
                // Check if User already exists with this email
                $user = User::where('email', $teacher->email)->first();

                if (!$user) {
                    $user = User::create([
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'password' => Hash::make('password123'),
                    ]);
                }

                // Check if AppUser already exists
                $appUser = AppUser::where('auth_user_id', $user->id)->first();

                if (!$appUser) {
                    AppUser::create([
                        'auth_user_id' => $user->id,
                        'email' => $teacher->email,
                        'full_name' => $teacher->name,
                        'role' => 'teacher',
                        'status' => 'active',
                        'teacher_id' => $teacher->id,
                        'department_id' => $teacher->department_id,
                    ]);
                } else {
                    $appUser->update([
                        'role' => 'teacher',
                        'teacher_id' => $teacher->id,
                        'department_id' => $teacher->department_id,
                    ]);
                }

                // Link auth_user_id back to teacher
                $teacher->update(['auth_user_id' => $user->id]);

                $created++;
                $this->line("  ✅ {$teacher->name} ({$teacher->email})");
            } catch (\Exception $e) {
                $this->error("  ❌ Failed for {$teacher->name}: {$e->getMessage()}");
            }
        }

        $this->info("Created {$created} login accounts. Default password: password123");
        return 0;
    }
}
