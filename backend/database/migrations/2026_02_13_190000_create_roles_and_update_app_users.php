<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50)->unique();       // e.g. manager, staff, teacher
            $table->string('name_ar', 100);              // Arabic display name
            $table->string('name_en', 100);              // English display name
            $table->text('description')->nullable();
            $table->json('permissions')->default('{}');   // { "students": ["view","create","edit","delete"], ... }
            $table->boolean('is_system')->default(false); // System roles can't be deleted
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Seed default roles
        $managerId = Str::uuid()->toString();
        $staffId = Str::uuid()->toString();
        $teacherId = Str::uuid()->toString();

        DB::table('roles')->insert([
            [
                'id' => $managerId,
                'name' => 'manager',
                'name_ar' => 'مدير النظام',
                'name_en' => 'System Manager',
                'description' => 'Full access to all system features',
                'permissions' => json_encode([
                    'students' => ['view', 'create', 'edit', 'delete'],
                    'fees' => ['view', 'create', 'edit', 'delete'],
                    'teachers' => ['view', 'create', 'edit', 'delete'],
                    'departments' => ['view', 'create', 'edit', 'delete'],
                    'subjects' => ['view', 'create', 'edit', 'delete'],
                    'finance' => ['view', 'create', 'edit', 'delete'],
                    'users' => ['view', 'create', 'edit', 'delete'],
                    'roles' => ['view', 'create', 'edit', 'delete'],
                    'sessions' => ['view', 'create', 'edit', 'delete'],
                    'attendance' => ['view', 'create', 'edit', 'delete'],
                    'grades' => ['view', 'create', 'edit', 'delete'],
                    'schedule' => ['view', 'create', 'edit', 'delete'],
                    'settings' => ['view', 'create', 'edit', 'delete'],
                    'reports' => ['view', 'create', 'edit', 'delete'],
                    'student-registration' => ['view', 'create', 'edit', 'delete'],
                    'student-enrollments' => ['view', 'create', 'edit', 'delete'],
                    'student-groups' => ['view', 'create', 'edit', 'delete'],
                    'rooms' => ['view', 'create', 'edit', 'delete'],
                    'timetable' => ['view', 'create', 'edit', 'delete'],
                    'study-years' => ['view', 'create', 'edit', 'delete'],
                    'semesters' => ['view', 'create', 'edit', 'delete'],
                    'fee-structure' => ['view', 'create', 'edit', 'delete'],
                    'action-logs' => ['view'],
                ]),
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $staffId,
                'name' => 'staff',
                'name_ar' => 'موظف',
                'name_en' => 'Staff',
                'description' => 'Limited access for administrative staff',
                'permissions' => json_encode([
                    'students' => ['view', 'create'],
                    'fees' => ['view'],
                    'student-registration' => ['view', 'create'],
                    'student-enrollments' => ['view', 'create'],
                ]),
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $teacherId,
                'name' => 'teacher',
                'name_ar' => 'مدرس',
                'name_en' => 'Teacher',
                'description' => 'Access for teaching staff',
                'permissions' => json_encode([
                    'sessions' => ['view', 'create', 'edit', 'delete'],
                    'attendance' => ['view', 'create', 'edit'],
                    'grades' => ['view', 'create', 'edit', 'delete'],
                    'students' => ['view'],
                    'subjects' => ['view'],
                    'schedule' => ['view', 'edit'],
                    'departments' => ['view'],
                ]),
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 3. Add role_id to app_users
        Schema::table('app_users', function (Blueprint $table) {
            $table->uuid('role_id')->nullable()->after('role');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
            $table->index('role_id');
        });

        // 4. Migrate existing app_users role enum to role_id FK
        $roles = DB::table('roles')->pluck('id', 'name');
        
        foreach (['manager', 'staff', 'teacher'] as $roleName) {
            if (isset($roles[$roleName])) {
                DB::table('app_users')
                    ->where('role', $roleName)
                    ->update(['role_id' => $roles[$roleName]]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('app_users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropIndex(['role_id']);
            $table->dropColumn('role_id');
        });

        Schema::dropIfExists('roles');
    }
};
