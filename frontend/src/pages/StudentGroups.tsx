import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  fetchStudentGroups, 
  createStudentGroup, 
  updateStudentGroup, 
  deleteStudentGroup, 
  fetchDepartments, 
  fetchSemesters,
  createAutoGroupsForDepartment,
  assignStudentsToGroupsAutomatically,
  getStudentsWithoutGroups,
  getRegisteredStudentsBySemester,
  createGroupsForRegisteredStudents
} from "@/lib/api";
import { Plus, Search, Edit, Trash2, Users, GraduationCap, Zap, UserCheck, Eye, Building, Calendar, AlertCircle } from "lucide-react";

export default function StudentGroups() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [showAutoModal, setShowAutoModal] = useState(false);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((group: any) => {
      const matchesSearch = group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !departmentFilter || group.department_id === departmentFilter;
      const matchesSemester = !semesterFilter || group.semester_id === semesterFilter;
      
      return matchesSearch && matchesDepartment && matchesSemester;
    });
  }, [groups, searchTerm, departmentFilter, semesterFilter]);

  const stats = useMemo(() => {
    if (!groups) return { total: 0, students: 0, available: 0, full: 0 };
    return {
      total: groups.length,
      students: groups.reduce((sum: number, g: any) => sum + (g.current_students || 0), 0),
      available: groups.filter((g: any) => g.current_students < g.max_students).length,
      full: groups.filter((g: any) => g.current_students >= g.max_students).length,
    };
  }, [groups]);

  const handleAdd = () => {
    setEditingGroup(null);
    setShowModal(true);
  };

  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
      try {
        await deleteStudentGroup(id);
        queryClient.invalidateQueries({ queryKey: ["student-groups"] });
        alert("تم حذف المجموعة بنجاح!");
      } catch (error: any) {
        alert("خطأ في حذف المجموعة: " + error.message);
      }
    }
  };

  const handleAutoCreate = () => {
    setShowAutoModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات المجموعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة مجموعات الطلاب</h1>
              <p className="mt-1 text-sm text-gray-600">إدارة مجموعات الطلاب لكل فصل دراسي</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAutoCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Zap className="h-4 w-4" />
                إنشاء تلقائي
              </button>
              <button
                onClick={() => navigate('/student-registrations')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <UserCheck className="h-4 w-4" />
                التسجيلات
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                إضافة مجموعة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="اسم المجموعة أو القسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">القسم</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">جميع الأقسام</option>
                {departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">الفصل الدراسي</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">جميع الفصول</option>
                {semesters?.map((semester: any) => (
                  <option key={semester.id} value={semester.id}>{semester.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">قائمة المجموعات</h3>
                <p className="text-sm text-gray-500 mt-1">عرض {filteredGroups.length} من {groups?.length || 0} مجموعة</p>
              </div>
            </div>
          </div>
          
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد مجموعات</h3>
              <p className="mt-2 text-sm text-gray-500">ابدأ بإضافة مجموعة جديدة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المجموعة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفصل الدراسي</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطلاب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGroups.map((group: any) => {
                    const pct = group.max_students > 0 ? Math.round((group.current_students / group.max_students) * 100) : 0;
                    return (
                      <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{group.group_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.department?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.semester?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">{group.current_students}/{group.max_students}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            group.current_students >= group.max_students 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : group.current_students > 0 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {group.current_students >= group.max_students ? 'ممتلئة' :
                             group.current_students > 0 ? 'جزئية' : 'فارغة'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/student-groups/${group.id}`)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض تفاصيل المجموعة"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(group)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {filteredGroups.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
              عرض {filteredGroups.length} من أصل {groups?.length || 0} مجموعة
            </div>
          )}
        </div>
      </div>

      {/* Group Modal */}
      {showModal && (
        <StudentGroupModal
          group={editingGroup}
          departments={departments || []}
          semesters={semesters || []}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["student-groups"] });
          }}
        />
      )}

      {/* Auto Group Creation Modal */}
      {showAutoModal && (
        <AutoGroupCreationModal
          departments={departments || []}
          semesters={semesters || []}
          onClose={() => setShowAutoModal(false)}
          onSave={() => {
            setShowAutoModal(false);
            queryClient.invalidateQueries({ queryKey: ["student-groups"] });
            queryClient.invalidateQueries({ queryKey: ["student-registrations"] });
          }}
        />
      )}
    </div>
  );
}

// Student Group Modal Component
function StudentGroupModal({ group, departments, semesters, onClose, onSave }: { 
  group: any; 
  departments: any[]; 
  semesters: any[]; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [form, setForm] = useState({
    name: group?.name || group?.group_name || "",
    department_id: group?.department_id || "",
    semester_id: group?.semester_id || "",
    semester_number: group?.semester_number || 1,
    max_students: group?.max_students || 30,
    description: group?.description || ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare data with proper types
      const submitData = {
        name: form.name,
        department_id: form.department_id || null,
        semester_id: form.semester_id || null,
        semester_number: form.semester_number,
        max_students: form.max_students,
        description: form.description || null
      };

      if (group) {
        await updateStudentGroup(group.id, submitData);
      } else {
        await createStudentGroup(submitData);
      }
      onSave();
    } catch (error: any) {
      alert("خطأ في حفظ البيانات: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {group ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm(prev => ({ ...prev, department_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر القسم</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي</label>
            <select
              value={form.semester_id}
              onChange={(e) => setForm(prev => ({ ...prev, semester_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر الفصل</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفصل</label>
            <input
              type="number"
              value={form.semester_number}
              onChange={(e) => setForm(prev => ({ ...prev, semester_number: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="8"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السعة القصوى</label>
            <input
              type="number"
              value={form.max_students}
              onChange={(e) => setForm(prev => ({ ...prev, max_students: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : (group ? "تحديث" : "حفظ")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Auto Group Creation Modal Component
function AutoGroupCreationModal({ departments, semesters, onClose, onSave }: { 
  departments: any[]; 
  semesters: any[]; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [form, setForm] = useState({
    department_id: "",
    semester_id: "",
    max_students_per_group: 30,
    use_registered_students_only: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [registeredStudentsCount, setRegisteredStudentsCount] = useState(0);
  const [unassignedStudentsCount, setUnassignedStudentsCount] = useState(0);

  const { data: registeredStudents } = useQuery({
    queryKey: ["registered-students", form.department_id, form.semester_id],
    queryFn: () => getRegisteredStudentsBySemester(form.department_id, form.semester_id),
    enabled: !!form.department_id && !!form.semester_id,
  });

  React.useEffect(() => {
    if (registeredStudents) {
      setRegisteredStudentsCount(registeredStudents.length);
      const unassigned = registeredStudents.filter((s: any) => !s.has_group && !s.group_id).length;
      setUnassignedStudentsCount(unassigned);
    }
  }, [registeredStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (form.use_registered_students_only) {
        // Use new registration-based group creation
        const result = await createGroupsForRegisteredStudents(
          form.department_id,
          form.semester_id,
          form.max_students_per_group
        );

        alert(`تم إنشاء ${result.summary.totalGroups} مجموعة للطلاب المسجلين بنجاح! تم تسجيل ${result.summary.totalStudents} طالب في المجموعات.`);
      } else {
        // Use old method (fallback)
        const groups = await createAutoGroupsForDepartment(
          form.department_id,
          form.semester_id,
          8, // Default groups per semester
          form.max_students_per_group
        );

        await assignStudentsToGroupsAutomatically(form.department_id, form.semester_id);
        alert(`تم إنشاء ${groups.length} مجموعة بنجاح! وتم تسجيل الطلاب تلقائياً.`);
      }

      onSave();
    } catch (error: any) {
      alert("خطأ في إنشاء المجموعات: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          إنشاء مجموعات للطلاب المسجلين
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm(prev => ({ ...prev, department_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر القسم</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي</label>
            <select
              value={form.semester_id}
              onChange={(e) => setForm(prev => ({ ...prev, semester_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر الفصل</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للطلاب في كل مجموعة</label>
            <input
              type="number"
              value={form.max_students_per_group}
              onChange={(e) => setForm(prev => ({ ...prev, max_students_per_group: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="10"
              max="50"
              required
            />
            <p className="text-xs text-gray-500 mt-1">سيتم إنشاء المجموعات بناءً على عدد الطلاب المسجلين</p>
          </div>

          {form.department_id && form.semester_id && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <UserCheck className="h-4 w-4" />
                <span className="text-sm font-medium">
                  الطلاب المسجلين: {registeredStudentsCount} | بدون مجموعة: {unassignedStudentsCount}
                </span>
              </div>
              
              {unassignedStudentsCount > 0 && (
                <div className="text-sm text-green-700">
                  <p className="mb-2">سيتم إنشاء المجموعات كالتالي:</p>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p>• عدد المجموعات المتوقع: {Math.ceil(unassignedStudentsCount / form.max_students_per_group)}</p>
                    <p>• متوسط الطلاب في كل مجموعة: {Math.round(unassignedStudentsCount / Math.ceil(unassignedStudentsCount / form.max_students_per_group))}</p>
                    <p>• الحد الأقصى لكل مجموعة: {form.max_students_per_group}</p>
                  </div>
                </div>
              )}
              
              {registeredStudentsCount === 0 && (
                <div className="text-xs text-green-700">
                  <p className="mb-2">لا يوجد طلاب مسجلين. يرجى:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>تسجيل الطلاب في المقررات أولاً</li>
                    <li>التأكد من اختيار القسم والفصل الصحيح</li>
                    <li>التحقق من أن الطلاب مسجلين في هذا الفصل الدراسي</li>
                  </ul>
                </div>
              )}

              {registeredStudentsCount > 0 && unassignedStudentsCount === 0 && (
                <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                  جميع الطلاب المسجلين مُعينين بالفعل في مجموعات.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.use_registered_students_only}
                onChange={(e) => setForm(prev => ({ ...prev, use_registered_students_only: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="mr-2 text-sm text-gray-700">إنشاء مجموعات للطلاب المسجلين فقط</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">سيتم إنشاء المجموعات فقط للطلاب الذين سجلوا في المقررات</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> سيتم إنشاء المجموعات تلقائياً بناءً على عدد الطلاب المسجلين في كل فصل دراسي. 
              كل مجموعة ستتضمن الطلاب المسجلين فقط.
            </p>
          </div>


          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || (form.use_registered_students_only ? unassignedStudentsCount === 0 : registeredStudentsCount === 0)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? "جاري الإنشاء..." : "إنشاء مجموعات للطلاب المسجلين"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
