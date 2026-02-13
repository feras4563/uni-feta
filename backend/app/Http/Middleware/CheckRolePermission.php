<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AppUser;

class CheckRolePermission
{
    /**
     * Handle an incoming request.
     * Permissions are now loaded dynamically from the roles table.
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

        $appUser = AppUser::with('roleModel')->where('auth_user_id', $user->id)->first();

        if (!$appUser) {
            return response()->json(['error' => 'User profile not found'], 404);
        }

        // Check permission from the role's permissions JSON
        if ($appUser->hasPermission($resource, $action)) {
            return $next($request);
        }

        return response()->json([
            'error' => 'Forbidden',
            'message' => "ليس لديك صلاحية {$action} على {$resource}"
        ], 403);
    }
}
