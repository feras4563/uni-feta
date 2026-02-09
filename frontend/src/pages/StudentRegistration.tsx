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
import { Plus, Search, Edit, UserCheck, DollarSign, Users, CheckCircle, Clock, AlertCircle, Building, Calendar, Filter, X } from "lucide-react";

export default function StudentRegistration() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [feeFilter, setFeeFilter] = useState("");
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

  // Check if any filter is active (table only shows when filters are applied)
  const hasActiveFilter = searchTerm.trim() !== "" || departmentFilter !== "" || semesterFilter !== "" || statusFilter !== "" || feeFilter !== "";

  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    if (!hasActiveFilter) return [];
    return registrations.filter((reg: any) => {
      const studentName = reg.student?.name || reg.students?.name || '';
      const studentEmail = reg.student?.email || reg.students?.email || '';
      const deptId = reg.department_id || reg.departments?.id;
      const semId = reg.semester_id || reg.semesters?.id;
      
      const matchesSearch = !searchTerm || 
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !departmentFilter || deptId === departmentFilter;
      const matchesSemester = !semesterFilter || semId === semesterFilter;
      const matchesStatus = !statusFilter || reg.status === statusFilter;
      const matchesFee = !feeFilter || 
        (feeFilter === 'paid' && reg.tuition_paid) ||
        (feeFilter === 'unpaid' && !reg.tuition_paid);
      
      return matchesSearch && matchesDepartment && matchesSemester && matchesStatus && matchesFee;
    });
  }, [registrations, searchTerm, departmentFilter, semesterFilter, statusFilter, feeFilter, hasActiveFilter]);

  const stats = useMemo(() => {
    if (!registrations) return { total: 0, active: 0, paid: 0, unpaid: 0 };
    return {
      total: registrations.length,
      active: registrations.filter((r: any) => r.status === 'active').length,
      paid: registrations.filter((r: any) => r.tuition_paid).length,
      unpaid: registrations.filter((r: any) => !r.tuition_paid).length,
    };
  }, [registrations]);

  const handleAdd = () => {
    setEditingRegistration(null);
    setShowModal(true);
  };

  const handleEdit = (registration: any) => {
    setEditingRegistration(registration);
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setSemesterFilter("");
    setStatusFilter("");
    setFeeFilter("");
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
      active: { label: 'نشط', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      suspended: { label: 'موقوف', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      completed: { label: 'مكتمل', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      dropped: { label: 'منسحب', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return configs[status] || configs.active;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات التسجيلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تسجيل الطلاب</h1>
              <p className="mt-1 text-sm text-gray-600">إدارة تسجيل الطلاب في الفصول الدراسية</p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              تسجيل طالب جديد
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي التسجيلات</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">التسجيلات النشطة</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الرسوم المدفوعة</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.paid}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">رسوم غير مدفوعة</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{stats.unpaid}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">تصفية التسجيلات</h3>
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="mr-auto inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="h-3 w-3" />
                مسح الفلاتر
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">البحث عن طالب</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="اسم الطالب أو البريد..."
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

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">الحالة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
                <option value="completed">مكتمل</option>
                <option value="dropped">منسحب</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">حالة الرسوم</label>
              <select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">الكل</option>
                <option value="paid">مدفوعة</option>
                <option value="unpaid">غير مدفوعة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registrations Table - Only shown when filters are active */}
        {!hasActiveFilter ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-center py-16">
              <Filter className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">استخدم الفلاتر لعرض التسجيلات</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                ابحث عن طالب بالاسم أو اختر القسم أو الفصل الدراسي لعرض التسجيلات المطابقة
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">قائمة التسجيلات</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    عرض {filteredRegistrations.length} من {registrations?.length || 0} تسجيل
                  </p>
                </div>
              </div>
            </div>

            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد تسجيلات</h3>
                <p className="mt-2 text-sm text-gray-500">لم يتم العثور على تسجيلات تطابق معايير البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطالب</th>
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
                    {filteredRegistrations.map((registration: any) => {
                      const studentName = registration.student?.name || registration.students?.name || '-';
                      const studentEmail = registration.student?.email || registration.students?.email || '';
                      const deptName = registration.department?.name || registration.departments?.name || '-';
                      const semName = registration.semester?.name || registration.semesters?.name || '-';
                      const groupName = registration.group?.group_name || registration.student_groups?.group_name || '-';
                      const statusCfg = getStatusConfig(registration.status);
                      
                      return (
                        <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-700">
                                  {studentName.charAt(0)?.toUpperCase() || 'ط'}
                                </span>
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-gray-900">{studentName}</div>
                                {studentEmail && <div className="text-xs text-gray-500">{studentEmail}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deptName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{semName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{groupName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.registration_date 
                              ? new Date(registration.registration_date).toLocaleDateString('ar-SA') 
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              registration.tuition_paid 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {registration.tuition_paid 
                                ? <><CheckCircle className="h-3 w-3" /> مدفوعة</>
                                : <><Clock className="h-3 w-3" /> غير مدفوعة</>
                              }
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleEdit(registration)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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

  const availableGroups = studentGroups.filter((group: any) => 
    group.department_id === form.department_id && group.semester_id === form.semester_id
  );

  // Show warning if group selected but fees not paid
  const showFeeWarning = form.group_id && !form.tuition_paid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {registration ? "تعديل التسجيل" : "تسجيل طالب جديد"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الطالب <span className="text-red-500">*</span></label>
              <select
                value={form.student_id}
                onChange={(e) => setForm(prev => ({ ...prev, student_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">اختر الطالب</option>
                {students.map((student: any) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية <span className="text-red-500">*</span></label>
                <select
                  value={form.study_year_id}
                  onChange={(e) => setForm(prev => ({ ...prev, study_year_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">اختر السنة</option>
                  {studyYears.map((year: any) => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي <span className="text-red-500">*</span></label>
                <select
                  value={form.semester_id}
                  onChange={(e) => setForm(prev => ({ ...prev, semester_id: e.target.value, group_id: "" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">اختر الفصل</option>
                  {semesters.map((semester: any) => (
                    <option key={semester.id} value={semester.id}>{semester.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم <span className="text-red-500">*</span></label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm(prev => ({ ...prev, department_id: e.target.value, group_id: "" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">اختر القسم</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفصل <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={form.semester_number}
                  onChange={(e) => setForm(prev => ({ ...prev, semester_number: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  min="1"
                  max="8"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة</label>
              <select
                value={form.group_id}
                onChange={(e) => setForm(prev => ({ ...prev, group_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">بدون مجموعة</option>
                {availableGroups.map((group: any) => (
                  <option key={group.id} value={group.id}>
                    {group.group_name} ({group.current_students}/{group.max_students})
                  </option>
                ))}
              </select>
              {form.department_id && form.semester_id && availableGroups.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">لا توجد مجموعات متاحة لهذا القسم والفصل</p>
              )}
            </div>

            {/* Fee warning when group is selected but fees not paid */}
            {showFeeWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">تنبيه: الرسوم غير مدفوعة</p>
                    <p className="text-xs mt-1">لن يتم قبول تعيين الطالب في مجموعة إلا إذا كانت الرسوم مدفوعة أو يوجد تجاوز إداري من صفحة الرسوم.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="completed">مكتمل</option>
                  <option value="dropped">منسحب</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tuition_paid}
                    onChange={(e) => setForm(prev => ({ ...prev, tuition_paid: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">الرسوم مدفوعة</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={2}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? "جاري الحفظ..." : (registration ? "تحديث" : "تسجيل")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
