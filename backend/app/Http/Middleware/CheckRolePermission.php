<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AppUser;

class CheckRolePermission
{
    /**
     * Permission matrix matching frontend PERMISSIONS constant.
     * Manager has full access to everything (handled separately).
     */
    protected $permissions = [
        'staff' => [
            'students' => ['view', 'create'],
            'fees' => ['view'],
            'student-registration' => ['view', 'create'],
            'student-enrollments' => ['view', 'create'],
        ],
        'teacher' => [
            'sessions' => ['view', 'create', 'edit', 'delete'],
            'attendance' => ['view', 'create', 'edit'],
            'grades' => ['view', 'create', 'edit', 'delete'],
            'students' => ['view'],
            'subjects' => ['view'],
            'schedule' => ['view', 'edit'],
            'departments' => ['view'],
        ],
    ];

    /**
     * Handle an incoming request.
     *
     * @param string $resource The resource being accessed
     * @param string $action The action being performed (view, create, edit, delete)
     */
    public function handle(Request $request, Closure $next, string $resource, string $action): Response
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $appUser = AppUser::where('auth_user_id', $user->id)->first();

        if (!$appUser) {
            return response()->json(['error' => 'User profile not found'], 404);
        }

        // Manager has full access
        if ($appUser->role === 'manager') {
            return $next($request);
        }

        $rolePerms = $this->permissions[$appUser->role] ?? [];
        $resourcePerms = $rolePerms[$resource] ?? [];

        if (!in_array($action, $resourcePerms)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "ليس لديك صلاحية {$action} على {$resource}"
            ], 403);
        }

        return $next($request);
    }
}
