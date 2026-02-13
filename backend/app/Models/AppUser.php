<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AppUser extends Model
{
    use HasUuids;

    protected $fillable = [
        'auth_user_id',
        'email',
        'full_name',
        'role',
        'role_id',
        'status',
        'last_login',
        'created_by',
        'teacher_id',
        'student_id',
        'department_id',
    ];

    protected $casts = [
        'last_login' => 'datetime',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(AppUser::class, 'created_by');
    }

    public function createdUsers()
    {
        return $this->hasMany(AppUser::class, 'created_by');
    }

    public function actionLogs()
    {
        return $this->hasMany(UserActionLog::class, 'user_id');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get permissions from the role (DB-driven)
     */
    public function getPermissions(): array
    {
        if ($this->roleModel) {
            return $this->roleModel->permissions ?? [];
        }
        return [];
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $resource, string $action): bool
    {
        $permissions = $this->getPermissions();
        $resourcePerms = $permissions[$resource] ?? [];
        return in_array($action, $resourcePerms);
    }

    public function authUser()
    {
        return $this->belongsTo(User::class, 'auth_user_id');
    }
}
