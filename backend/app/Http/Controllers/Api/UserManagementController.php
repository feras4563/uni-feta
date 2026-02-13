<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AppUser;
use App\Models\Role;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserManagementController extends Controller
{
    use LogsUserActions;
    /**
     * List all users with their roles
     */
    public function index(Request $request)
    {
        $query = AppUser::with(['roleModel', 'teacher:id,name,campus_id', 'department:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->get();

        return response()->json($users);
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|uuid|exists:roles,id',
            'status' => 'nullable|in:active,inactive,suspended',
            'department_id' => 'nullable|uuid|exists:departments,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get the role to determine the role name
        $role = Role::findOrFail($request->role_id);

        // Create auth user
        $authUser = User::create([
            'name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Get current authenticated user for created_by
        $currentUser = auth('api')->user();
        $currentAppUser = AppUser::where('auth_user_id', $currentUser->id)->first();

        // Create app user
        $appUser = AppUser::create([
            'auth_user_id' => $authUser->id,
            'email' => $request->email,
            'full_name' => $request->full_name,
            'role' => $role->name,
            'role_id' => $request->role_id,
            'status' => $request->status ?? 'active',
            'created_by' => $currentAppUser?->id,
            'department_id' => $request->department_id,
        ]);

        $appUser->load(['roleModel', 'teacher:id,name,campus_id', 'department:id,name']);

        $this->logAction('create', 'users', $appUser->id, [
            'user_name_target' => $appUser->full_name,
            'role' => $appUser->role,
        ]);

        return response()->json([
            'message' => 'تم إنشاء المستخدم بنجاح',
            'user' => $appUser,
        ], 201);
    }

    /**
     * Show a single user
     */
    public function show($id)
    {
        $user = AppUser::with(['roleModel', 'teacher:id,name,campus_id', 'department:id,name', 'creator:id,full_name'])
            ->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update a user
     */
    public function update(Request $request, $id)
    {
        $appUser = AppUser::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $appUser->auth_user_id,
            'password' => 'nullable|string|min:6',
            'role_id' => 'sometimes|required|uuid|exists:roles,id',
            'status' => 'sometimes|required|in:active,inactive,suspended',
            'department_id' => 'nullable|uuid|exists:departments,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update auth user if email or password changed
        if ($appUser->auth_user_id) {
            $authUser = User::find($appUser->auth_user_id);
            if ($authUser) {
                $authUpdates = [];
                if ($request->has('full_name')) {
                    $authUpdates['name'] = $request->full_name;
                }
                if ($request->has('email')) {
                    $authUpdates['email'] = $request->email;
                }
                if ($request->filled('password')) {
                    $authUpdates['password'] = Hash::make($request->password);
                }
                if (!empty($authUpdates)) {
                    $authUser->update($authUpdates);
                }
            }
        }

        // Build app user updates
        $updates = [];
        if ($request->has('full_name')) $updates['full_name'] = $request->full_name;
        if ($request->has('email')) $updates['email'] = $request->email;
        if ($request->has('status')) $updates['status'] = $request->status;
        if ($request->has('department_id')) $updates['department_id'] = $request->department_id;

        if ($request->has('role_id')) {
            $role = Role::findOrFail($request->role_id);
            $updates['role_id'] = $request->role_id;
            $updates['role'] = $role->name;
        }

        $appUser->update($updates);
        $appUser->load(['roleModel', 'teacher:id,name,campus_id', 'department:id,name']);

        $this->logAction('update', 'users', $appUser->id, [
            'user_name_target' => $appUser->full_name,
            'updated_fields' => array_keys($updates),
        ]);

        return response()->json([
            'message' => 'تم تحديث المستخدم بنجاح',
            'user' => $appUser,
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        $appUser = AppUser::findOrFail($id);

        // Prevent deleting yourself
        $currentUser = auth('api')->user();
        $currentAppUser = AppUser::where('auth_user_id', $currentUser->id)->first();
        
        if ($currentAppUser && $currentAppUser->id === $appUser->id) {
            return response()->json([
                'error' => 'لا يمكنك حذف حسابك الخاص'
            ], 422);
        }

        // Delete auth user too
        if ($appUser->auth_user_id) {
            User::where('id', $appUser->auth_user_id)->delete();
        }

        $this->logAction('delete', 'users', $appUser->id, [
            'user_name_target' => $appUser->full_name,
            'role' => $appUser->role,
        ]);

        $appUser->delete();

        return response()->json([
            'message' => 'تم حذف المستخدم بنجاح'
        ]);
    }

    /**
     * Toggle user status (active/inactive)
     */
    public function toggleStatus($id)
    {
        $appUser = AppUser::findOrFail($id);

        $newStatus = $appUser->status === 'active' ? 'inactive' : 'active';
        $appUser->update(['status' => $newStatus]);

        $this->logAction('update', 'users', $appUser->id, [
            'action_type' => 'toggle_status',
            'user_name_target' => $appUser->full_name,
            'new_status' => $newStatus,
        ]);

        return response()->json([
            'message' => $newStatus === 'active' ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
            'user' => $appUser->fresh()->load('roleModel'),
        ]);
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, $id)
    {
        $appUser = AppUser::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($appUser->auth_user_id) {
            $authUser = User::find($appUser->auth_user_id);
            if ($authUser) {
                $authUser->update([
                    'password' => Hash::make($request->password),
                ]);
            }
        }

        $this->logAction('update', 'users', $appUser->id, [
            'action_type' => 'reset_password',
            'user_name_target' => $appUser->full_name,
        ]);

        return response()->json([
            'message' => 'تم إعادة تعيين كلمة المرور بنجاح'
        ]);
    }
}
