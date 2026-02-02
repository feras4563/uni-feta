<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AppUser;
use App\Models\Permission;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
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

        // Check if user has permission
        $hasPermission = Permission::where('role', $appUser->role)
            ->where('resource', $resource)
            ->whereJsonContains('actions', $action)
            ->exists();

        if (!$hasPermission) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "You do not have permission to {$action} {$resource}"
            ], 403);
        }

        return $next($request);
    }
}
