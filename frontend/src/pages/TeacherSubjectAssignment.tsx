import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchTeachers, 
  fetchSubjects, 
  fetchDepartments, 
  fetchStudyYears,
  fetchSemesters,
  fetchAllTeacherSubjectAssignments,
  createTeacherSubjectAssignment,
  updateTeacherSubjectAssignment,
  deleteTeacherSubjectAssignment,
  fetchSubjectTeachers
} from "@/lib/api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  BookOpen, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck
} from "lucide-react";

export default function TeacherSubjectAssignment() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'assignments' | 'teachers' | 'subjects'>('assignments');

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers(),
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: studyYears, isLoading: studyYearsLoading, error: studyYearsError } = useQuery({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  const { data: semesters, isLoading: semestersLoading, error: semestersError } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  // Fetch all teacher-subject assignments using the new function
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: () => fetchAllTeacherSubjectAssignments(),
  });

  // Debug logging
  React.useEffect(() => {
    if (studyYearsError) {
      console.error("Error loading study years:", studyYearsError);
    }
    if (semestersError) {
      console.error("Error loading semesters:", semestersError);
    }
    if (studyYears) {
      console.log("Study years loaded:", studyYears);
    }
    if (semesters) {
      console.log("Semesters loaded:", semesters);
    }
    if (assignments) {
      console.log("Assignments loaded:", assignments);
    }
  }, [studyYears, semesters, studyYearsError, semestersError, assignments]);

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter(assignment => {
      const matchesSearch = assignment.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || assignment.department_id === departmentFilter;
      const matchesSemester = !semesterFilter || assignment.semester_id === semesterFilter;
      const matchesTeacher = !teacherFilter || assignment.teacher_id === teacherFilter;
      
      return matchesSearch && matchesDepartment && matchesSemester && matchesTeacher;
    });
  }, [assignments, searchTerm, departmentFilter, semesterFilter, teacherFilter]);

  const handleAdd = () => {
    setEditingAssignment(null);
    setShowModal(true);
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التكليف؟")) {
      try {
        await deleteTeacherSubjectAssignment(id);
        queryClient.invalidateQueries({ queryKey: ["teacher-subject-assignments"] });
        alert("تم حذف التكليف بنجاح!");
      } catch (error: any) {
        alert("خطأ في حذف التكليف: " + error.message);
      }
    }
  };

  // Statistics
  const stats = useMemo(() => {
    if (!assignments || !teachers || !subjects) return null;
    
    const activeAssignments = assignments.filter(a => a.is_active);
    const uniqueTeachers = new Set(assignments.map(a => a.teacher_id)).size;
    const uniqueSubjects = new Set(assignments.map(a => a.subject_id)).size;
    const currentSemesterAssignments = assignments.filter(a => a.semesters?.is_current || false);
    
    return {
      totalAssignments: assignments.length,
      activeAssignments: activeAssignments.length,
      assignedTeachers: uniqueTeachers,
      assignedSubjects: uniqueSubjects,
      currentSemester: currentSemesterAssignments.length
    };
  }, [assignments, teachers, subjects]);

  if (teachersLoading || subjectsLoading || assignmentsLoading || studyYearsLoading || semestersLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تكليف المدرسين بالمواد</h1>
        <p className="text-gray-600">إدارة تكليف المدرسين بالمواد الدراسية لكل فصل دراسي</p>
      </div>

      
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="البحث في التكليفات..."
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
              <option value="fall">خريف</option>
              <option value="spring">ربيع</option>
              <option value="summer">صيف</option>
            </select>

            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المدرسين</option>
              {teachers?.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('assignments')}
                className={`px-4 py-2 text-sm ${viewMode === 'assignments' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                التكليفات
              </button>
              <button
                onClick={() => setViewMode('teachers')}
                className={`px-4 py-2 text-sm ${viewMode === 'teachers' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                المدرسين
              </button>
              <button
                onClick={() => setViewMode('subjects')}
                className={`px-4 py-2 text-sm ${viewMode === 'subjects' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                المواد
              </button>
            </div>
            
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              تكليف جديد
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'assignments' && (
        <AssignmentsView 
          assignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {viewMode === 'teachers' && (
        <TeachersView 
          teachers={teachers || []}
          assignments={assignments || []}
          onEdit={handleEdit}
        />
      )}

      {viewMode === 'subjects' && (
        <SubjectsView 
          subjects={subjects || []}
          assignments={assignments || []}
          onEdit={handleEdit}
        />
      )}

      {/* Assignment Modal */}
      {showModal && (
        <AssignmentModal
          assignment={editingAssignment}
          teachers={teachers || []}
          subjects={subjects || []}
          departments={departments || []}
          studyYears={studyYears || []}
          semesters={semesters || []}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["teacher-subject-assignments"] });
          }}
        />
      )}
    </div>
  );
}

// Assignments View Component
function AssignmentsView({ assignments, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">قائمة التكليفات</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدرس</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفصل</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السنة الأكاديمية</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment: any) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {assignment.teacher?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {assignment.subject?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {assignment.department?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {assignment.semester?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {assignment.studyYear?.name || assignment.academic_year || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    assignment.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {assignment.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(assignment)}
                      className="text-blue-600 hover:text-blue-900"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(assignment.id)}
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

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تكليفات</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة تكليف جديد.</p>
        </div>
      )}
    </div>
  );
}

// Teachers View Component
function TeachersView({ teachers, assignments, onEdit }: any) {
  const teachersWithAssignments = teachers.map((teacher: any) => {
    const teacherAssignments = assignments.filter((a: any) => a.teacher_id === teacher.id);
    return {
      ...teacher,
      assignments: teacherAssignments,
      subjectsCount: teacherAssignments.length,
      activeAssignments: teacherAssignments.filter((a: any) => a.is_active).length
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">المدرسين وتكليفاتهم</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {teachersWithAssignments.map((teacher: any) => (
          <div key={teacher.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{teacher.name}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                teacher.activeAssignments > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {teacher.activeAssignments} تكليف نشط
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <p>البريد: {teacher.email}</p>
              <p>التخصص: {teacher.specialization}</p>
              <p>سنوات الخبرة: {teacher.years_experience}</p>
            </div>
            
            {teacher.assignments.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">المواد المكلف بها:</h5>
                {teacher.assignments.slice(0, 3).map((assignment: any) => (
                  <div key={assignment.id} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">{assignment.subject?.name}</div>
                    <div className="text-gray-500">
                      {assignment.department?.name} - {assignment.semester?.name || assignment.semester}
                    </div>
                  </div>
                ))}
                {teacher.assignments.length > 3 && (
                  <div className="text-xs text-gray-500">
                    و {teacher.assignments.length - 3} مواد أخرى...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Subjects View Component
function SubjectsView({ subjects, assignments, onEdit }: any) {
  const subjectsWithAssignments = subjects.map((subject: any) => {
    const subjectAssignments = assignments.filter((a: any) => a.subject_id === subject.id);
    return {
      ...subject,
      assignments: subjectAssignments,
      teachersCount: new Set(subjectAssignments.map((a: any) => a.teacher_id)).size,
      activeAssignments: subjectAssignments.filter((a: any) => a.is_active).length
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">المواد وتكليفاتها</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">كود المادة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المادة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الساعات المعتمدة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد المدرسين</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التكليفات النشطة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjectsWithAssignments.map((subject: any) => (
              <tr key={subject.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {subject.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subject.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subject.credits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subject.teachersCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subject.activeAssignments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subject.activeAssignments > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subject.activeAssignments > 0 ? 'مكلفة' : 'غير مكلفة'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Assignment Modal Component
function AssignmentModal({ 
  assignment, 
  teachers, 
  subjects, 
  departments, 
  studyYears,
  semesters, 
  onClose, 
  onSave 
}: any) {
  const [form, setForm] = useState({
    teacher_id: assignment?.teacher_id || "",
    subject_id: assignment?.subject_id || "",
    department_id: assignment?.department_id || "",
    study_year_id: assignment?.study_year_id || "",
    semester_id: assignment?.semester_id || "",
    is_primary_teacher: assignment?.is_primary_teacher ?? true,
    can_edit_grades: assignment?.can_edit_grades ?? true,
    can_take_attendance: assignment?.can_take_attendance ?? true,
    notes: assignment?.notes || ""
  });
  const [submitting, setSubmitting] = useState(false);

  // When teacher changes, auto-set department and clear subject
  const handleTeacherChange = (teacherId: string) => {
    const selectedTeacher = teachers.find((t: any) => t.id === teacherId);
    setForm(prev => ({
      ...prev,
      teacher_id: teacherId,
      department_id: selectedTeacher?.department_id || prev.department_id,
      subject_id: "", // reset subject since department changed
    }));
  };

  // When department changes manually, clear subject
  const handleDepartmentChange = (departmentId: string) => {
    setForm(prev => ({
      ...prev,
      department_id: departmentId,
      subject_id: "", // reset subject since department changed
    }));
  };

  // Filter subjects by selected department
  const filteredSubjects = form.department_id
    ? subjects.filter((s: any) => s.department_id === form.department_id)
    : subjects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (assignment) {
        await updateTeacherSubjectAssignment(assignment.id, form);
      } else {
        await createTeacherSubjectAssignment(form);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {assignment ? "تعديل التكليف" : "تكليف جديد"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدرس</label>
            <select
              value={form.teacher_id}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر المدرس</option>
              {teachers.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              value={form.department_id}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر القسم</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            {form.teacher_id && form.department_id && (
              <p className="text-xs text-blue-600 mt-1">تم تحديد القسم تلقائياً بناءً على المدرس المختار</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
            <select
              value={form.subject_id}
              onChange={(e) => setForm(prev => ({ ...prev, subject_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!form.department_id}
            >
              <option value="">{form.department_id ? 'اختر المادة' : 'اختر القسم أولاً'}</option>
              {filteredSubjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
              ))}
            </select>
            {form.department_id && filteredSubjects.length === 0 && (
              <p className="text-xs text-red-500 mt-1">لا توجد مواد في هذا القسم</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة الأكاديمية</label>
              <select
                value={form.study_year_id}
                onChange={(e) => setForm(prev => ({ ...prev, study_year_id: e.target.value, semester_id: "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر السنة الأكاديمية</option>
                {studyYears?.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
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
                disabled={!form.study_year_id}
              >
                <option value="">اختر الفصل الدراسي</option>
                {semesters?.filter((semester: any) => semester.study_year_id === form.study_year_id).map((semester: any) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
              {!form.study_year_id && (
                <p className="text-xs text-gray-500 mt-1">يرجى اختيار السنة الأكاديمية أولاً</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_primary_teacher"
                checked={form.is_primary_teacher}
                onChange={(e) => setForm(prev => ({ ...prev, is_primary_teacher: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_primary_teacher" className="mr-2 text-sm text-gray-700">
                مدرس رئيسي
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_edit_grades"
                checked={form.can_edit_grades}
                onChange={(e) => setForm(prev => ({ ...prev, can_edit_grades: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="can_edit_grades" className="mr-2 text-sm text-gray-700">
                يمكن تعديل الدرجات
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_take_attendance"
                checked={form.can_take_attendance}
                onChange={(e) => setForm(prev => ({ ...prev, can_take_attendance: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="can_take_attendance" className="mr-2 text-sm text-gray-700">
                يمكن أخذ الحضور
              </label>
            </div>
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
              {submitting ? "جاري الحفظ..." : (assignment ? "تحديث" : "حفظ")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
