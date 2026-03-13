<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Models\User;
use App\Models\AppUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     * Note: In Laravel 11, middleware is applied in routes, not in constructor
     */
    public function __construct()
    {
        // Middleware is now applied in routes/api.php
    }

    /**
     * Register a new user
     */
    public function register(RegisterRequest $request)
    {

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Create app_user record
        $appUser = AppUser::create([
            'auth_user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $request->name,
            'role' => $request->role ?? 'staff',
            'status' => 'active',
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'User successfully registered',
            'user' => $user,
            'app_user' => $appUser,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60
        ], 201);
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(LoginRequest $request)
    {

        $credentials = $request->only('email', 'password');
        \Log::info('Attempting authentication', [
            'email' => $credentials['email'],
            'password_provided' => isset($credentials['password']),
            'password_length' => strlen($credentials['password'] ?? '')
        ]);

        if (!$token = auth('api')->attempt($credentials)) {
            \Log::error('Authentication failed', ['email' => $credentials['email']]);
            return response()->json([
                'error' => 'بيانات الدخول غير صحيحة',
                'message' => 'The provided credentials are incorrect.'
            ], 401);
        }
        
        \Log::info('Authentication successful', ['email' => $credentials['email']]);

        $user = auth('api')->user();
        
        // Get app_user data
        $appUser = AppUser::where('auth_user_id', $user->id)->first();
        
        // Update last login
        if ($appUser) {
            $appUser->update(['last_login' => now()]);
        }

        return $this->respondWithToken($token, $user, $appUser);
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        $user = auth('api')->user();
        $appUser = AppUser::where('auth_user_id', $user->id)->first();

        return response()->json([
            'user' => $user,
            'app_user' => $this->enrichAppUserData($appUser),
            'permissions' => $appUser ? $this->getUserPermissions($appUser) : []
        ]);
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        auth('api')->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        $token = auth('api')->refresh();
        $user = auth('api')->user();
        $appUser = AppUser::where('auth_user_id', $user->id)->first();

        return $this->respondWithToken($token, $user, $appUser);
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token, $user = null, $appUser = null)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user ?? auth('api')->user(),
            'app_user' => $this->enrichAppUserData($appUser),
            'permissions' => $appUser ? $this->getUserPermissions($appUser) : []
        ]);
    }

    /**
     * Enrich app_user data with teacher or student profile information.
     */
    private function enrichAppUserData(?AppUser $appUser): ?array
    {
        if (!$appUser) {
            return null;
        }

        $data = $appUser->toArray();

        if ($appUser->role === 'teacher' && $appUser->teacher_id) {
            $teacher = \App\Models\Teacher::with('department:id,name,name_en')->find($appUser->teacher_id);
            if ($teacher) {
                $data['teacher_id'] = $teacher->id;
                $data['teacher_name'] = $teacher->name;
                $data['teacher_campus_id'] = $teacher->campus_id;
                $data['department_id'] = $teacher->department_id;
                $data['department_name'] = $teacher->department?->name;
            }
        }

        if ($appUser->role === 'student' && $appUser->student_id) {
            $student = \App\Models\Student::with('department:id,name,name_en')->find($appUser->student_id);
            if ($student) {
                $data['student_id'] = $student->id;
                $data['student_name'] = $student->name;
                $data['student_campus_id'] = $student->campus_id;
                $data['department_id'] = $student->department_id;
                $data['department_name'] = $student->department?->name;
                $data['student_year'] = $student->year;
            }
        }

        return $data;
    }

    /**
     * Get user permissions from the DB role
     */
    protected function getUserPermissions($appUser)
    {
        if (!$appUser) return [];

        // Load role if not loaded
        if (!$appUser->relationLoaded('roleModel')) {
            $appUser->load('roleModel');
        }

        return $appUser->getPermissions();
    }

    /**
     * Change password
     */
    public function changePassword(ChangePasswordRequest $request)
    {

        $user = auth('api')->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Password successfully changed']);
    }

    /**
     * Update profile
     */
    public function updateProfile(Request $request)
    {
        $user = auth('api')->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only('name', 'email'));

        // Update app_user if exists
        $appUser = AppUser::where('auth_user_id', $user->id)->first();
        if ($appUser) {
            $appUser->update([
                'full_name' => $request->name ?? $appUser->full_name,
                'email' => $request->email ?? $appUser->email,
            ]);
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
            'app_user' => $appUser
        ]);
    }
}
