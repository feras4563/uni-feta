<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Role extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'name_ar',
        'name_en',
        'description',
        'permissions',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function appUsers()
    {
        return $this->hasMany(AppUser::class, 'role_id');
    }

    /**
     * Check if this role has a specific permission
     */
    public function hasPermission(string $resource, string $action): bool
    {
        $permissions = $this->permissions ?? [];
        $resourcePerms = $permissions[$resource] ?? [];
        return in_array($action, $resourcePerms);
    }

    /**
     * Get all available resources and actions for the permission matrix
     */
    public static function getAvailablePermissions(): array
    {
        return [
            'students' => [
                'label_ar' => 'الطلاب',
                'label_en' => 'Students',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'teachers' => [
                'label_ar' => 'هيئة التدريس',
                'label_en' => 'Teachers',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'departments' => [
                'label_ar' => 'الأقسام',
                'label_en' => 'Departments',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'subjects' => [
                'label_ar' => 'المقررات',
                'label_en' => 'Subjects',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'fees' => [
                'label_ar' => 'الرسوم',
                'label_en' => 'Fees',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'fee-structure' => [
                'label_ar' => 'هيكل الرسوم',
                'label_en' => 'Fee Structure',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'finance' => [
                'label_ar' => 'النظام المالي',
                'label_en' => 'Finance',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'student-registration' => [
                'label_ar' => 'تسجيل الطلاب',
                'label_en' => 'Student Registration',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'student-enrollments' => [
                'label_ar' => 'تسجيل المواد',
                'label_en' => 'Subject Enrollment',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'student-groups' => [
                'label_ar' => 'مجموعات الطلاب',
                'label_en' => 'Student Groups',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'sessions' => [
                'label_ar' => 'الحصص',
                'label_en' => 'Sessions',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'attendance' => [
                'label_ar' => 'الحضور والغياب',
                'label_en' => 'Attendance',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'grades' => [
                'label_ar' => 'الدرجات',
                'label_en' => 'Grades',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'schedule' => [
                'label_ar' => 'الجدول الدراسي',
                'label_en' => 'Schedule',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'timetable' => [
                'label_ar' => 'الجدول الزمني',
                'label_en' => 'Timetable',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'rooms' => [
                'label_ar' => 'القاعات',
                'label_en' => 'Rooms',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'study-years' => [
                'label_ar' => 'السنوات الدراسية',
                'label_en' => 'Study Years',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'semesters' => [
                'label_ar' => 'الفصول الدراسية',
                'label_en' => 'Semesters',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'users' => [
                'label_ar' => 'المستخدمين',
                'label_en' => 'Users',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'roles' => [
                'label_ar' => 'الأدوار والصلاحيات',
                'label_en' => 'Roles & Permissions',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'settings' => [
                'label_ar' => 'الإعدادات',
                'label_en' => 'Settings',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'reports' => [
                'label_ar' => 'التقارير',
                'label_en' => 'Reports',
                'actions' => ['view', 'create', 'edit', 'delete'],
            ],
            'action-logs' => [
                'label_ar' => 'سجل العمليات',
                'label_en' => 'Action Logs',
                'actions' => ['view'],
            ],
        ];
    }
}
