import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchStudentRegistrations, 
  registerStudentForSemester, 
  updateStudentRegistration,
  fetchStudents,
  fetchDepartments, 
  fetchSemesters,
  fetchStudyYears,
  fetchStudentGroups
} from "@/lib/api";
import { Plus, Search, Edit, UserCheck, DollarSign, Users } from "lucide-react";

export default function StudentRegistration() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<any>(null);

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["student-registrations"],
    queryFn: () => fetchStudentRegistrations(),
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: studyYears } = useQuery({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  const { data: studentGroups } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(),
  });

  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    return registrations.filter(reg => {
      const matchesSearch = reg.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reg.students?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSemester = !semesterFilter || reg.semester_id === semesterFilter;
      const matchesStatus = !statusFilter || reg.status === statusFilter;
      
      return matchesSearch && matchesSemester && matchesStatus;
    });
  }, [registrations, searchTerm, semesterFilter, statusFilter]);

  const handleAdd = () => {
    setEditingRegistration(null);
    setShowModal(true);
  };

  const handleEdit = (registration: any) => {
    setEditingRegistration(registration);
    setShowModal(true);
  };

  if (isLoading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الطلاب</h1>
        <p className="text-gray-600">إدارة تسجيل الطلاب في الفصول الدراسية</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{registrations?.length || 0}</div>
              <div className="text-sm text-gray-600">إجمالي التسجيلات</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {registrations?.filter(reg => reg.status === 'active').length || 0}
              </div>
              <div className="text-sm text-gray-600">التسجيلات النشطة</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {registrations?.filter(reg => reg.tuition_paid).length || 0}
              </div>
              <div className="text-sm text-gray-600">الرسوم المدفوعة</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {registrations?.filter(reg => reg.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-600">التسجيلات المكتملة</div>
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
                placeholder="البحث في التسجيلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
              <option value="completed">مكتمل</option>
              <option value="dropped">منسحب</option>
            </select>
          </div>
          
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            تسجيل طالب جديد
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">قائمة التسجيلات</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطالب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفصل الدراسي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المجموعة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرسوم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {registration.students?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {registration.departments?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {registration.semesters?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {registration.student_groups?.group_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(registration.registration_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      registration.tuition_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {registration.tuition_paid ? 'مدفوعة' : 'غير مدفوعة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      registration.status === 'active' ? 'bg-green-100 text-green-800' :
                      registration.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                      registration.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {registration.status === 'active' ? 'نشط' :
                       registration.status === 'suspended' ? 'موقوف' :
                       registration.status === 'completed' ? 'مكتمل' : 'منسحب'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(registration)}
                      className="text-blue-600 hover:text-blue-900"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تسجيلات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بتسجيل طالب جديد.</p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <StudentRegistrationModal
          registration={editingRegistration}
          students={students || []}
          departments={departments || []}
          semesters={semesters || []}
          studyYears={studyYears || []}
          studentGroups={studentGroups || []}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["student-registrations"] });
          }}
        />
      )}
    </div>
  );
}

// Registration Modal Component
function StudentRegistrationModal({ 
  registration, 
  students, 
  departments, 
  semesters, 
  studyYears, 
  studentGroups, 
  onClose, 
  onSave 
}: { 
  registration: any; 
  students: any[]; 
  departments: any[]; 
  semesters: any[]; 
  studyYears: any[]; 
  studentGroups: any[]; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [form, setForm] = useState({
    student_id: registration?.student_id || "",
    semester_id: registration?.semester_id || "",
    study_year_id: registration?.study_year_id || "",
    department_id: registration?.department_id || "",
    group_id: registration?.group_id || "",
    semester_number: registration?.semester_number || 1,
    status: registration?.status || "active",
    tuition_paid: registration?.tuition_paid || false,
    notes: registration?.notes || ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (registration) {
        await updateStudentRegistration(registration.id, form);
      } else {
        await registerStudentForSemester(form);
      }
      onSave();
    } catch (error: any) {
      alert("خطأ في حفظ البيانات: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const availableGroups = studentGroups.filter(group => 
    group.department_id === form.department_id && group.semester_id === form.semester_id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {registration ? "تعديل التسجيل" : "تسجيل طالب جديد"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الطالب</label>
            <select
              value={form.student_id}
              onChange={(e) => setForm(prev => ({ ...prev, student_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر الطالب</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية</label>
            <select
              value={form.study_year_id}
              onChange={(e) => setForm(prev => ({ ...prev, study_year_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر السنة الدراسية</option>
              {studyYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
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
              <option value="">اختر الفصل الدراسي</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة</label>
            <select
              value={form.group_id}
              onChange={(e) => setForm(prev => ({ ...prev, group_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر المجموعة</option>
              {availableGroups.map(group => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={form.status}
              onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
              <option value="completed">مكتمل</option>
              <option value="dropped">منسحب</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.tuition_paid}
                onChange={(e) => setForm(prev => ({ ...prev, tuition_paid: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="mr-2 text-sm text-gray-700">الرسوم مدفوعة</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
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
              {submitting ? "جاري الحفظ..." : (registration ? "تحديث" : "تسجيل")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
