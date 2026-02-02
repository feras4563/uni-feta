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
import { Plus, Search, Edit, Trash2, Users, GraduationCap, Zap, UserCheck, Eye, Building } from "lucide-react";

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
    return groups.filter(group => {
      const matchesSearch = group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !departmentFilter || group.department_id === departmentFilter;
      const matchesSemester = !semesterFilter || group.semester_id === semesterFilter;
      
      return matchesSearch && matchesDepartment && matchesSemester;
    });
  }, [groups, searchTerm, departmentFilter, semesterFilter]);

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

  if (isLoading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة مجموعات الطلاب</h1>
        <p className="text-gray-600">إدارة مجموعات الطلاب لكل فصل دراسي</p>
      </div>


      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{groups?.length || 0}</div>
              <div className="text-sm text-gray-600">إجمالي المجموعات</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {groups?.reduce((sum, group) => sum + group.current_students, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">إجمالي الطلاب المسجلين</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {groups?.filter(group => group.current_students < group.max_students).length || 0}
              </div>
              <div className="text-sm text-gray-600">مجموعات متاحة للتسجيل</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {groups?.filter(group => group.current_students >= group.max_students).length || 0}
              </div>
              <div className="text-sm text-gray-600">مجموعات ممتلئة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="البحث في المجموعات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الأقسام</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الفصول</option>
              {semesters?.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAutoCreate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              إنشاء مجموعات للطلاب المسجلين
            </button>
            <button
              onClick={() => navigate('/student-registrations')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              عرض التسجيلات
            </button>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة مجموعة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">قائمة المجموعات</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المجموعة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفصل الدراسي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطلاب المسجلين</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعة القصوى</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {group.group_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.department?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.semester?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.current_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.max_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.current_students >= group.max_students ? 'bg-red-100 text-red-800' :
                      group.current_students > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {group.current_students >= group.max_students ? 'ممتلئة' :
                       group.current_students > 0 ? 'جزئية' : 'فارغة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/student-groups/${group.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="عرض تفاصيل المجموعة"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-blue-600 hover:text-blue-900"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مجموعات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة مجموعة جديدة.</p>
          </div>
        )}
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
    group_name: group?.group_name || "",
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
      if (group) {
        await updateStudentGroup(group.id, form);
      } else {
        await createStudentGroup(form);
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
              value={form.group_name}
              onChange={(e) => setForm(prev => ({ ...prev, group_name: e.target.value }))}
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

  const { data: registeredStudents } = useQuery({
    queryKey: ["registered-students", form.department_id, form.semester_id],
    queryFn: () => getRegisteredStudentsBySemester(form.department_id, form.semester_id),
    enabled: !!form.department_id && !!form.semester_id,
  });

  React.useEffect(() => {
    if (registeredStudents) {
      setRegisteredStudentsCount(registeredStudents.length);
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
                  الطلاب المسجلين في هذا القسم والفصل: {registeredStudentsCount}
                </span>
              </div>
              
              {registeredStudentsCount > 0 && (
                <div className="text-sm text-green-700">
                  <p className="mb-2">سيتم إنشاء المجموعات كالتالي:</p>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p>• عدد المجموعات المتوقع: {Math.ceil(registeredStudentsCount / form.max_students_per_group)}</p>
                    <p>• متوسط الطلاب في كل مجموعة: {Math.round(registeredStudentsCount / Math.ceil(registeredStudentsCount / form.max_students_per_group))}</p>
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
              disabled={submitting || registeredStudentsCount === 0}
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
