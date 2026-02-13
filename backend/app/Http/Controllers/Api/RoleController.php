<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * List all roles
     */
    public function index()
    {
        $roles = Role::withCount('appUsers')
            ->orderBy('is_system', 'desc')
            ->orderBy('name_ar')
            ->get();

        return response()->json($roles);
    }

    /**
     * Create a new role
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:roles,name',
            'name_ar' => 'required|string|max:100',
            'name_en' => 'required|string|max:100',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'name_ar' => $request->name_ar,
            'name_en' => $request->name_en,
            'description' => $request->description,
            'permissions' => $request->permissions ?? [],
            'is_system' => false,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'تم إنشاء الدور بنجاح',
            'role' => $role,
        ], 201);
    }

    /**
     * Show a single role
     */
    public function show($id)
    {
        $role = Role::withCount('appUsers')->findOrFail($id);
        return response()->json($role);
    }

    /**
     * Update a role
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:50|unique:roles,name,' . $id,
            'name_ar' => 'sometimes|required|string|max:100',
            'name_en' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'permissions' => 'sometimes|required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // System roles: can update permissions but not name
        if ($role->is_system && $request->has('name') && $request->name !== $role->name) {
            return response()->json([
                'error' => 'لا يمكن تغيير اسم الأدوار الأساسية'
            ], 422);
        }

        $role->update($request->only([
            'name', 'name_ar', 'name_en', 'description', 'permissions', 'is_active'
        ]));

        return response()->json([
            'message' => 'تم تحديث الدور بنجاح',
            'role' => $role->fresh(),
        ]);
    }

    /**
     * Delete a role
     */
    public function destroy($id)
    {
        $role = Role::withCount('appUsers')->findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'error' => 'لا يمكن حذف الأدوار الأساسية'
            ], 422);
        }

        if ($role->app_users_count > 0) {
            return response()->json([
                'error' => 'لا يمكن حذف دور مرتبط بمستخدمين. قم بنقل المستخدمين أولاً.'
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'تم حذف الدور بنجاح'
        ]);
    }

    /**
     * Get available permissions matrix
     */
    public function availablePermissions()
    {
        return response()->json(Role::getAvailablePermissions());
    }
}
