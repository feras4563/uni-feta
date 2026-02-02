import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSubjects, fetchDepartments, fetchTeachers, fetchStudyYears, fetchSemesters, createTeacherSubjectAssignment, updateTeacherSubjectAssignment } from "../../lib/api";

interface TeacherSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
  subjectId?: string;
  editingAssignment?: any;
  mode: 'teacher' | 'subject'; // 'teacher' means we're assigning subjects to a teacher, 'subject' means we're assigning teachers to a subject
  subjectDepartmentIds?: string[]; // Department IDs of the subject (for filtering teachers)
}

export default function TeacherSubjectModal({
  isOpen,
  onClose,
  teacherId,
  subjectId,
  editingAssignment,
  mode,
  subjectDepartmentIds
}: TeacherSubjectModalProps) {
  const [formData, setFormData] = useState({
    teacher_ids: [] as string[],
    subject_id: "",
    department_id: "",
    study_year_id: "",
    semester_id: "",
    is_primary_teacher: false,
    can_edit_grades: true,
    can_take_attendance: true,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data based on mode
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects(),
    enabled: mode === 'teacher' || !subjectId
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers("", true), // Only active teachers from teachers master
    enabled: mode === 'subject' || !teacherId
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments()
  });

  const { data: studyYears } = useQuery({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears()
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters()
  });

  // Filter teachers based on subject departments
  const filteredTeachers = useMemo(() => {
    if (!teachers || !subjectDepartmentIds || subjectDepartmentIds.length === 0) {
      return teachers || [];
    }

    return teachers.filter((teacher: any) => {
      // Check if teacher has any departments that match the subject's departments
      if (!teacher.departments || !Array.isArray(teacher.departments)) {
        return false;
      }

      return teacher.departments.some((dept: any) => 
        subjectDepartmentIds.includes(dept.department_id) && dept.is_active
      );
    });
  }, [teachers, subjectDepartmentIds]);

  // Initialize form data
  useEffect(() => {
    if (editingAssignment) {
      setFormData({
        teacher_ids: editingAssignment.teacher_id ? [editingAssignment.teacher_id] : [],
        subject_id: editingAssignment.subject_id || "",
        department_id: editingAssignment.department_id || "",
        study_year_id: editingAssignment.study_year_id || "",
        semester_id: editingAssignment.semester_id || "",
        is_primary_teacher: editingAssignment.is_primary_teacher || false,
        can_edit_grades: editingAssignment.can_edit_grades !== false,
        can_take_attendance: editingAssignment.can_take_attendance !== false,
        notes: editingAssignment.notes || ""
      });
    } else {
      setFormData({
        teacher_ids: teacherId ? [teacherId] : [],
        subject_id: subjectId || "",
        department_id: "",
        study_year_id: "",
        semester_id: "",
        is_primary_teacher: false,
        can_edit_grades: true,
        can_take_attendance: true,
        notes: ""
      });
    }
  }, [editingAssignment, teacherId, subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.study_year_id) {
        alert("يرجى اختيار السنة الأكاديمية");
        setSubmitting(false);
        return;
      }
      if (!formData.semester_id) {
        alert("يرجى اختيار الفصل الدراسي");
        setSubmitting(false);
        return;
      }

      if (editingAssignment) {
        // For editing, we still handle single teacher assignment
        const singleTeacherData = {
          teacher_id: formData.teacher_ids[0] || "",
          subject_id: formData.subject_id,
          department_id: formData.department_id,
          study_year_id: formData.study_year_id,
          semester_id: formData.semester_id,
          is_primary_teacher: formData.is_primary_teacher,
          can_edit_grades: formData.can_edit_grades,
          can_take_attendance: formData.can_take_attendance,
          notes: formData.notes
        };
        await updateTeacherSubjectAssignment(editingAssignment.id, singleTeacherData);
      } else {
        // For new assignments, create multiple assignments for selected teachers
        if (formData.teacher_ids.length === 0) {
          alert("يرجى اختيار مدرس واحد على الأقل");
          return;
        }

        const assignments = formData.teacher_ids.map(teacherId => ({
          teacher_id: teacherId,
          subject_id: formData.subject_id,
          department_id: formData.department_id,
          study_year_id: formData.study_year_id,
          semester_id: formData.semester_id,
          is_primary_teacher: formData.is_primary_teacher,
          can_edit_grades: formData.can_edit_grades,
          can_take_attendance: formData.can_take_attendance,
          notes: formData.notes
        }));

        // Create all assignments
        for (const assignment of assignments) {
          await createTeacherSubjectAssignment(assignment);
        }
      }
      
      onClose();
      // Reset form
      setFormData({
        teacher_ids: [],
        subject_id: subjectId || "",
        department_id: "",
        study_year_id: "",
        semester_id: "",
        is_primary_teacher: false,
        can_edit_grades: true,
        can_take_attendance: true,
        notes: ""
      });
    } catch (error: any) {
      console.error("Error saving assignment:", error);
      alert(`خطأ في حفظ التخصيص: ${error.message || error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTeacherToggle = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      teacher_ids: prev.teacher_ids.includes(teacherId)
        ? prev.teacher_ids.filter(id => id !== teacherId)
        : [...prev.teacher_ids, teacherId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingAssignment ? "تعديل تخصيص المقرر" : mode === 'teacher' ? "إضافة مقرر للمدرس" : "إضافة مدرسين للمقرر"}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Teacher Selection (only for subject mode or when not editing) */}
          {mode === 'subject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدرسين <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {filteredTeachers?.map((teacher) => (
                  <label key={teacher.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.teacher_ids.includes(teacher.id)}
                      onChange={() => handleTeacherToggle(teacher.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-900 font-medium">{teacher.name}</span>
                      {teacher.name_en && (
                        <span className="text-xs text-gray-500 mr-2">({teacher.name_en})</span>
                      )}
                      {teacher.email && (
                        <div className="text-xs text-gray-500">{teacher.email}</div>
                      )}
                    </div>
                    {formData.teacher_ids.includes(teacher.id) && (
                      <span className="text-xs text-green-600 font-medium">✓ محدد</span>
                    )}
                  </label>
                ))}
                {filteredTeachers?.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    لا يوجد مدرسين متاحين من نفس أقسام المقرر
                  </p>
                )}
              </div>
              {subjectDepartmentIds && subjectDepartmentIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  يتم عرض المدرسين الذين ينتمون إلى نفس أقسام المقرر فقط
                </p>
              )}
              {formData.teacher_ids.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-800 font-medium">
                    تم اختيار {formData.teacher_ids.length} مدرس
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Subject Selection (only for teacher mode or when not editing) */}
          {mode === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المقرر الدراسي <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.subject_id}
                onChange={(e) => handleInputChange("subject_id", e.target.value)}
                required
              >
                <option value="">اختر المقرر</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              القسم <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.department_id}
              onChange={(e) => handleInputChange("department_id", e.target.value)}
              required
            >
              <option value="">اختر القسم</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.name_en && `(${dept.name_en})`}
                </option>
              ))}
            </select>
          </div>

          {/* Study Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              السنة الأكاديمية <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.study_year_id}
              onChange={(e) => handleInputChange("study_year_id", e.target.value)}
              required
            >
              <option value="">اختر السنة الأكاديمية</option>
              {studyYears?.map((year: any) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.name_en && `(${year.name_en})`}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفصل الدراسي <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.semester_id}
              onChange={(e) => handleInputChange("semester_id", e.target.value)}
              required
            >
              <option value="">اختر الفصل الدراسي</option>
              {semesters?.map((semester: any) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name} {semester.name_en && `(${semester.name_en})`}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">الصلاحيات</h4>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_primary_teacher"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.is_primary_teacher}
                onChange={(e) => handleInputChange("is_primary_teacher", e.target.checked)}
              />
              <label htmlFor="is_primary_teacher" className="mr-2 text-sm text-gray-700">
                مدرس رئيسي للمقرر
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_edit_grades"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.can_edit_grades}
                onChange={(e) => handleInputChange("can_edit_grades", e.target.checked)}
              />
              <label htmlFor="can_edit_grades" className="mr-2 text-sm text-gray-700">
                يمكن تعديل الدرجات
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="can_take_attendance"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.can_take_attendance}
                onChange={(e) => handleInputChange("can_take_attendance", e.target.checked)}
              />
              <label htmlFor="can_take_attendance" className="mr-2 text-sm text-gray-700">
                يمكن أخذ الحضور
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : editingAssignment ? "حفظ التغييرات" : "إضافة المدرسين"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
