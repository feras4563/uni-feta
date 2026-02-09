<?php

namespace App\Traits;

use App\Models\AppUser;
use App\Models\UserActionLog;
use Illuminate\Support\Facades\Log;

trait LogsUserActions
{
    /**
     * Log a user action to the user_actions_log table.
     *
     * @param string $action  The action performed (create, update, delete, view, enroll, register)
     * @param string $resource  The resource type (students, fees, student-registration, student-enrollments)
     * @param string|null $resourceId  The ID of the affected resource
     * @param array|null $details  Additional details about the action
     */
    protected function logAction(string $action, string $resource, ?string $resourceId = null, ?array $details = null): void
    {
        try {
            $user = auth('api')->user();
            if (!$user) return;

            $appUser = AppUser::where('auth_user_id', $user->id)->first();
            if (!$appUser) return;

            $log = new UserActionLog();
            $log->user_id = $appUser->id;
            $log->action = $action;
            $log->resource = $resource;
            $log->resource_id = $resourceId;
            $log->details = $details ? array_merge($details, [
                'user_name' => $appUser->full_name,
                'user_role' => $appUser->role,
            ]) : [
                'user_name' => $appUser->full_name,
                'user_role' => $appUser->role,
            ];
            $log->ip_address = request()->ip();
            $log->user_agent = request()->userAgent();
            $log->created_at = now();
            $log->save();
        } catch (\Exception $e) {
            Log::error('Failed to log user action: ' . $e->getMessage());
        }
    }
}
