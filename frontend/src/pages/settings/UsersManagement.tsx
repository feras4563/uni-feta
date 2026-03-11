import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";

interface Role {
  id: string;
  name: string;
  name_ar: string;
  name_en: string;
  permissions: Record<string, string[]>;
  is_system: boolean;
  is_active: boolean;
  app_users_count?: number;
}

interface AppUserRecord {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: string;
  role_id: string | null;
  status: "active" | "inactive" | "suspended";
  last_login: string | null;
  created_at: string;
  teacher_id: string | null;
  department_id: string | null;
  role_model: Role | null;
  teacher: { id: string; name: string; campus_id: string } | null;
  department: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

export default function UsersManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUserRecord | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role_id: "",
    status: "active" as string,
    department_id: "",
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery<AppUserRecord[]>({
    queryKey: ["user-management", searchQuery, filterRole, filterStatus],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (filterRole) params.role_id = filterRole;
      if (filterStatus) params.status = filterStatus;
      return api.get("/user-management", params);
    },
  });

  // Fetch roles for dropdown
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles"),
  });

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments-list"],
    queryFn: () => api.get("/departments"),
  });

  // Create user
  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/user-management", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      closeModal();
    },
  });

  // Update user
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) =>
      api.put(`/user-management/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      closeModal();
    },
  });

  // Delete user
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/user-management/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      setShowDeleteConfirm(null);
    },
  });

  // Toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => api.post(`/user-management/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post(`/user-management/${id}/reset-password`, { password }),
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordUserId(null);
      setNewPassword("");
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      full_name: "",
      email: "",
      password: "",
      role_id: "",
      status: "active",
      department_id: "",
    });
    setShowModal(true);
  };

  const openEditModal = (user: AppUserRecord) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role_id: user.role_id || "",
      status: user.status,
      department_id: user.department_id || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({
      full_name: "",
      email: "",
      password: "",
      role_id: "",
      status: "active",
      department_id: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const data: any = { ...form };
      if (!data.password) delete data.password;
      if (!data.department_id) data.department_id = null;
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      const data: any = { ...form };
      if (!data.department_id) data.department_id = null;
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1.5"></span>
            نشط
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1.5"></span>
            معطل
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5"></span>
            موقوف
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (user: AppUserRecord) => {
    const roleName = user.role_model?.name_ar || user.role;
    const colors: Record<string, string> = {
      manager: "bg-purple-100 text-purple-800",
      staff: "bg-blue-100 text-blue-800",
      teacher: "bg-emerald-100 text-emerald-800",
    };
    const colorClass = colors[user.role] || "bg-gray-100 text-gray-800";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {roleName}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg ml-4">
                <i className="fas fa-users-cog text-indigo-600 text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
                <p className="text-sm text-gray-600 mt-1">
                  إنشاء وإدارة حسابات المستخدمين وتعيين الأدوار
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <i className="fas fa-user-plus"></i>
              إضافة مستخدم
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="بحث بالاسم أو البريد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">جميع الأدوار</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name_ar}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    القسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر دخول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <i className="fas fa-users text-4xl text-gray-300 mb-3 block"></i>
                      <p>لا يوجد مستخدمون</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {user.full_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department?.name || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "لم يسجل دخول"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50 transition-colors"
                            title="تعديل"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => toggleStatusMutation.mutate(user.id)}
                            className={`p-1.5 rounded transition-colors ${
                              user.status === "active"
                                ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                : "text-green-600 hover:text-green-800 hover:bg-green-50"
                            }`}
                            title={user.status === "active" ? "تعطيل" : "تفعيل"}
                          >
                            <i className={`fas ${user.status === "active" ? "fa-ban" : "fa-check-circle"}`}></i>
                          </button>
                          <button
                            onClick={() => {
                              setPasswordUserId(user.id);
                              setNewPassword("");
                              setShowPasswordModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="إعادة تعيين كلمة المرور"
                          >
                            <i className="fas fa-key"></i>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="حذف"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeModal}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="example@university.edu"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    كلمة المرور {!editingUser && <span className="text-red-500">*</span>}
                    {editingUser && <span className="text-gray-400 text-xs">(اتركها فارغة للإبقاء)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    dir="ltr"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الدور <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">اختر الدور</option>
                    {roles
                      .filter((r) => r.is_active)
                      .map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name_ar} ({role.name_en})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                  <select
                    value={form.department_id}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">بدون قسم</option>
                    {departments.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">معطل</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </div>

                {/* Error display */}
                {(createMutation.error || updateMutation.error) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <i className="fas fa-exclamation-circle ml-2"></i>
                    {(createMutation.error as Error)?.message ||
                      (updateMutation.error as Error)?.message}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin ml-2"></i>
                        جاري الحفظ...
                      </>
                    ) : editingUser ? (
                      "تحديث"
                    ) : (
                      "إنشاء المستخدم"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && passwordUserId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowPasswordModal(false)}
            ></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm z-10">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">إعادة تعيين كلمة المرور</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    dir="ltr"
                    minLength={6}
                  />
                </div>
                {resetPasswordMutation.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {(resetPasswordMutation.error as Error)?.message}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() =>
                      resetPasswordMutation.mutate({
                        id: passwordUserId,
                        password: newPassword,
                      })
                    }
                    disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? "جاري..." : "تعيين"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowDeleteConfirm(null)}
            ></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm z-10">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">تأكيد الحذف</h3>
                <p className="text-sm text-gray-500 mb-6">
                  هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
                {deleteMutation.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
                    {(deleteMutation.error as Error)?.message}
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
                    onClick={() => deleteMutation.mutate(showDeleteConfirm)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? "جاري..." : "حذف"}
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
