import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";

interface Role {
  id: string;
  name: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  permissions: Record<string, string[]>;
  is_system: boolean;
  is_active: boolean;
  app_users_count?: number;
}

interface PermissionDef {
  label_ar: string;
  label_en: string;
  actions: string[];
}

const ACTION_LABELS: Record<string, string> = {
  view: "عرض",
  create: "إنشاء",
  edit: "تعديل",
  delete: "حذف",
};

export default function RolesPermissions() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for create/edit role
  const [roleForm, setRoleForm] = useState({
    name: "",
    name_ar: "",
    name_en: "",
    description: "",
  });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles"),
  });

  // Fetch available permissions matrix
  const { data: availablePermissions = {} } = useQuery<Record<string, PermissionDef>>({
    queryKey: ["available-permissions"],
    queryFn: () => api.get("/roles/available-permissions"),
  });

  // Auto-select first role
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
      setLocalPermissions(roles[0].permissions || {});
    }
  }, [roles, selectedRole]);

  // Update local permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setLocalPermissions(selectedRole.permissions || {});
      setHasChanges(false);
    }
  }, [selectedRole]);

  // Create role
  const createRoleMutation = useMutation({
    mutationFn: (data: any) => api.post<{ role: Role }>("/roles", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowRoleModal(false);
      setSelectedRole(response.role);
      setLocalPermissions(response.role.permissions || {});
    },
  });

  // Update role permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Record<string, string[]> }) =>
      api.put<{ role: Role }>(`/roles/${id}`, { permissions }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setSelectedRole(response.role);
      setHasChanges(false);
    },
  });

  // Update role details
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put<{ role: Role }>(`/roles/${id}`, data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowRoleModal(false);
      setEditingRole(null);
      if (selectedRole?.id === response.role.id) {
        setSelectedRole(response.role);
      }
    },
  });

  // Delete role
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowDeleteConfirm(null);
      if (selectedRole && roles.length > 1) {
        const remaining = roles.filter((r) => r.id !== selectedRole.id);
        setSelectedRole(remaining[0] || null);
      } else {
        setSelectedRole(null);
      }
    },
  });

  const togglePermission = (resource: string, action: string) => {
    setLocalPermissions((prev) => {
      const current = prev[resource] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];

      const newPerms = { ...prev };
      if (updated.length === 0) {
        delete newPerms[resource];
      } else {
        newPerms[resource] = updated;
      }
      return newPerms;
    });
    setHasChanges(true);
  };

  const toggleAllForResource = (resource: string, actions: string[]) => {
    setLocalPermissions((prev) => {
      const current = prev[resource] || [];
      const allChecked = actions.every((a) => current.includes(a));

      const newPerms = { ...prev };
      if (allChecked) {
        delete newPerms[resource];
      } else {
        newPerms[resource] = [...actions];
      }
      return newPerms;
    });
    setHasChanges(true);
  };

  const toggleAllForAction = (action: string) => {
    const resources = Object.keys(availablePermissions);
    setLocalPermissions((prev) => {
      const allHaveAction = resources.every((r) => {
        const def = availablePermissions[r];
        if (!def.actions.includes(action)) return true;
        return (prev[r] || []).includes(action);
      });

      const newPerms = { ...prev };
      resources.forEach((r) => {
        const def = availablePermissions[r];
        if (!def.actions.includes(action)) return;
        const current = newPerms[r] || [];
        if (allHaveAction) {
          newPerms[r] = current.filter((a) => a !== action);
          if (newPerms[r].length === 0) delete newPerms[r];
        } else {
          if (!current.includes(action)) {
            newPerms[r] = [...current, action];
          }
        }
      });
      return newPerms;
    });
    setHasChanges(true);
  };

  const selectAll = () => {
    const allPerms: Record<string, string[]> = {};
    Object.entries(availablePermissions).forEach(([resource, def]) => {
      allPerms[resource] = [...def.actions];
    });
    setLocalPermissions(allPerms);
    setHasChanges(true);
  };

  const deselectAll = () => {
    setLocalPermissions({});
    setHasChanges(true);
  };

  const savePermissions = () => {
    if (selectedRole) {
      updatePermissionsMutation.mutate({
        id: selectedRole.id,
        permissions: localPermissions,
      });
    }
  };

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm({ name: "", name_ar: "", name_en: "", description: "" });
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      name_ar: role.name_ar,
      name_en: role.name_en,
      description: role.description || "",
    });
    setShowRoleModal(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        data: roleForm,
      });
    } else {
      createRoleMutation.mutate({
        ...roleForm,
        permissions: {},
      });
    }
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل الأدوار والصلاحيات...</p>
        </div>
      </div>
    );
  }

  const permissionEntries = Object.entries(availablePermissions);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg ml-4">
                <i className="fas fa-shield-alt text-purple-600 text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">الأدوار والصلاحيات</h1>
                <p className="text-sm text-gray-600 mt-1">
                  إدارة أدوار المستخدمين وتحديد صلاحيات كل دور
                </p>
              </div>
            </div>
            <button
              onClick={openCreateRoleModal}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              إضافة دور جديد
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="flex gap-6">
          {/* Roles Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">الأدوار المتاحة</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      selectedRole?.id === role.id
                        ? "bg-purple-50 border-r-4 border-purple-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{role.name_ar}</span>
                          {role.is_system && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                              أساسي
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{role.name_en}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {role.app_users_count !== undefined && (
                          <span className="text-xs text-gray-400">
                            {role.app_users_count} <i className="fas fa-user text-[10px]"></i>
                          </span>
                        )}
                        {!role.is_system && (
                          <div className="flex gap-0.5 mr-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditRoleModal(role);
                              }}
                              className="text-gray-400 hover:text-indigo-600 p-1"
                              title="تعديل"
                            >
                              <i className="fas fa-edit text-xs"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(role.id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="حذف"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="flex-1">
            {selectedRole ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Role Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        صلاحيات: {selectedRole.name_ar}
                      </h3>
                      {selectedRole.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{selectedRole.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={selectAll}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <i className="fas fa-check-double ml-1"></i>
                        تحديد الكل
                      </button>
                      <button
                        onClick={deselectAll}
                        className="text-xs text-gray-600 hover:text-gray-800 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <i className="fas fa-times ml-1"></i>
                        إلغاء الكل
                      </button>
                      {hasChanges && (
                        <button
                          onClick={savePermissions}
                          disabled={updatePermissionsMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {updatePermissionsMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i>
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save"></i>
                              حفظ التغييرات
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {updatePermissionsMutation.isSuccess && !hasChanges && (
                  <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center">
                    <i className="fas fa-check-circle ml-2"></i>
                    تم حفظ الصلاحيات بنجاح
                  </div>
                )}
                {updatePermissionsMutation.error && (
                  <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center">
                    <i className="fas fa-exclamation-circle ml-2"></i>
                    {(updatePermissionsMutation.error as Error)?.message}
                  </div>
                )}

                {/* Permissions Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 w-64">
                          المورد
                        </th>
                        {["view", "create", "edit", "delete"].map((action) => (
                          <th
                            key={action}
                            className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 w-24"
                          >
                            <button
                              onClick={() => toggleAllForAction(action)}
                              className="hover:text-purple-600 transition-colors cursor-pointer"
                              title={`تبديل الكل - ${ACTION_LABELS[action]}`}
                            >
                              {ACTION_LABELS[action]}
                            </button>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 w-20">
                          الكل
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {permissionEntries.map(([resource, def]) => {
                        const currentPerms = localPermissions[resource] || [];
                        const allChecked = def.actions.every((a) => currentPerms.includes(a));
                        const someChecked = def.actions.some((a) => currentPerms.includes(a));

                        return (
                          <tr key={resource} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {def.label_ar}
                                </span>
                                <span className="text-xs text-gray-400 mr-2">
                                  {def.label_en}
                                </span>
                              </div>
                            </td>
                            {["view", "create", "edit", "delete"].map((action) => {
                              const isAvailable = def.actions.includes(action);
                              const isChecked = currentPerms.includes(action);
                              return (
                                <td key={action} className="px-4 py-3 text-center">
                                  {isAvailable ? (
                                    <label className="inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePermission(resource, action)}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                      />
                                    </label>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={allChecked}
                                  ref={(el) => {
                                    if (el) el.indeterminate = someChecked && !allChecked;
                                  }}
                                  onChange={() => toggleAllForResource(resource, def.actions)}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                />
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Permission Summary */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      <i className="fas fa-info-circle ml-1"></i>
                      إجمالي الصلاحيات المفعلة:{" "}
                      <strong className="text-gray-700">
                        {Object.values(localPermissions).reduce(
                          (sum, actions) => sum + actions.length,
                          0
                        )}
                      </strong>{" "}
                      من{" "}
                      <strong className="text-gray-700">
                        {Object.values(availablePermissions).reduce(
                          (sum, def) => sum + def.actions.length,
                          0
                        )}
                      </strong>
                    </span>
                    {hasChanges && (
                      <span className="text-amber-600 font-medium">
                        <i className="fas fa-exclamation-triangle ml-1"></i>
                        يوجد تغييرات غير محفوظة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <i className="fas fa-shield-alt text-5xl text-gray-300 mb-4 block"></i>
                <p className="text-gray-500 text-lg">اختر دوراً من القائمة لعرض وتعديل صلاحياته</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRoleModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRole ? "تعديل الدور" : "إضافة دور جديد"}
                </h3>
                <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المعرف (بالإنجليزية) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g. registrar"
                    dir="ltr"
                    disabled={editingRole?.is_system}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم بالعربية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.name_ar}
                    onChange={(e) => setRoleForm({ ...roleForm, name_ar: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="مثال: مسجل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم بالإنجليزية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.name_en}
                    onChange={(e) => setRoleForm({ ...roleForm, name_en: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g. Registrar"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    placeholder="وصف مختصر لهذا الدور..."
                  />
                </div>

                {(createRoleMutation.error || updateRoleMutation.error) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <i className="fas fa-exclamation-circle ml-2"></i>
                    {(createRoleMutation.error as Error)?.message ||
                      (updateRoleMutation.error as Error)?.message}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {createRoleMutation.isPending || updateRoleMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin ml-2"></i>
                        جاري الحفظ...
                      </>
                    ) : editingRole ? (
                      "تحديث"
                    ) : (
                      "إنشاء الدور"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(null)}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm z-10">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">تأكيد حذف الدور</h3>
                <p className="text-sm text-gray-500 mb-6">
                  هل أنت متأكد من حذف هذا الدور؟ تأكد من عدم وجود مستخدمين مرتبطين به.
                </p>
                {deleteRoleMutation.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
                    {(deleteRoleMutation.error as Error)?.message}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => deleteRoleMutation.mutate(showDeleteConfirm)}
                    disabled={deleteRoleMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteRoleMutation.isPending ? "جاري..." : "حذف"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
