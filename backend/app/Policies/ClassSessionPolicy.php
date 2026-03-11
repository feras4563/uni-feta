<?php

namespace App\Policies;

use App\Models\AppUser;
use App\Models\ClassSession;
use App\Models\User;

class ClassSessionPolicy
{
    public function markAttendance(User $user, ClassSession $session): bool
    {
        $appUser = AppUser::with('roleModel')->where('auth_user_id', $user->id)->first();

        if (!$appUser) {
            return false;
        }

        $roleName = $appUser->roleModel?->name ?? $appUser->role;

        if ($roleName === 'manager') {
            return true;
        }

        if ($roleName !== 'teacher') {
            return false;
        }

        return (string) $appUser->teacher_id === (string) $session->teacher_id
            && $session->status !== 'completed';
    }
}
