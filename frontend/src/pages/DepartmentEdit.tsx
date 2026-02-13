import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTeachers, fetchSubjects, fetchDepartmentSemesterSubjects, updateDepartmentSemesterSubjects } from "@/lib/api";
import { getDepartment, updateDepartment } from "@/lib/jwt-api";
import { Save, X, ArrowLeft } from "lucide-react";

export default function DepartmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    head_teacher_id: "",
    semester_count: 2,
    is_locked: false
  });
  const [semesterSubjects, setSemesterSubjects] = useState<{[semesterNumber: number]: string[]}>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch department data
  const { data: department, isLoading: departmentLoading } = useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartment(id!),
    enabled: !!id
  });

  // Fetch active teachers for department head selection
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["teachers-for-departments"],
    queryFn: () => fetchTeachers("", true), // Only active teachers
  });

  // Fetch only subjects belonging to this department
  const { data: allSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects", "department", id],
    queryFn: () => fetchSubjects("", id),
    enabled: !!id,
  });


  // Initialize form when department data loads
  useEffect(() => {
    if (department) {
      setForm({
        name: department.name || "",
        name_en: department.name_en || "",
        head_teacher_id: department.head_teacher_id || "",
        semester_count: department.semester_count || 2,
        is_locked: department.is_locked || false
      });
    }
  }, [department]);

  // Load existing subjects for each semester
  useEffect(() => {
    if (department && id) {
      const loadExistingSubjects = async () => {
        const newSemesterSubjects: {[semesterNumber: number]: string[]} = {};
        
        for (let i = 1; i <= (department.semester_count || 2); i++) {
          try {
            const existingSubjects = await fetchDepartmentSemesterSubjects(id, i);
            newSemesterSubjects[i] = existingSubjects.map((item: any) => item.id);
            console.log(`Loaded ${existingSubjects.length} subjects for semester ${i}:`, newSemesterSubjects[i]);
          } catch (error) {
            console.error(`Error loading subjects for semester ${i}:`, error);
            newSemesterSubjects[i] = [];
          }
        }
        
        setSemesterSubjects(newSemesterSubjects);
      };
      
      loadExistingSubjects();
    }
  }, [department, id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = "اسم القسم مطلوب";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = {
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        head_teacher_id: form.head_teacher_id || null,
        semester_count: form.semester_count,
        is_locked: form.is_locked
      };

      await updateDepartment(id!, formData);

      // Update subjects for each semester using semester numbers
      for (let i = 1; i <= form.semester_count; i++) {
        const subjectIds = semesterSubjects[i] || [];
        console.log(`Updating semester ${i} with subjects:`, subjectIds);
        await updateDepartmentSemesterSubjects(id!, i, subjectIds);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["department", id] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });

      navigate(`/departments/${id}`);
    } catch (error: any) {
      console.error("Error updating department:", error);
      setErrors({ submit: error.message || "خطأ في تحديث البيانات" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Subject management functions
  const handleAddSubject = (semesterNumber: number, subjectId: string) => {
    setSemesterSubjects(prev => ({
      ...prev,
      [semesterNumber]: [...(prev[semesterNumber] || []), subjectId]
    }));
  };

  const handleRemoveSubject = (semesterNumber: number, subjectId: string) => {
    setSemesterSubjects(prev => ({
      ...prev,
      [semesterNumber]: (prev[semesterNumber] || []).filter(id => id !== subjectId)
    }));
  };

  const getAvailableSubjects = (semesterNumber: number) => {
    const selectedInThisSemester = semesterSubjects[semesterNumber] || [];
    
    // Get all subjects selected in OTHER semesters (not the current one)
    const selectedInOtherSemesters = Object.entries(semesterSubjects)
      .filter(([semester]) => parseInt(semester) !== semesterNumber)
      .flatMap(([_, subjectIds]) => subjectIds);
    
    return allSubjects?.filter(subject => 
      !selectedInThisSemester.includes(subject.id) && 
      !selectedInOtherSemesters.includes(subject.id)
    ) || [];
  };

  const getSelectedSubjects = (semesterNumber: number) => {
    const selectedIds = semesterSubjects[semesterNumber] || [];
    return allSubjects?.filter(subject => selectedIds.includes(subject.id)) || [];
  };

  const handleCancel = () => {
    navigate("/departments");
  };

  if (departmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات القسم...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">القسم غير موجود</div>
          <button
            onClick={handleCancel}
            className="text-purple-600 hover:text-purple-700"
          >
            العودة إلى الأقسام
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تعديل القسم</h1>
                <p className="text-gray-600 mt-1">تعديل معلومات القسم: {department.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات القسم</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    اسم القسم *
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                </div>

                {/* Department Name (English) */}
                <div className="md:col-span-2">
                  <label htmlFor="name_en" className="block text-sm font-medium leading-6 text-gray-900">
                    اسم القسم (إنجليزي)
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name_en"
                      id="name_en"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                      value={form.name_en}
                      onChange={(e) => handleInputChange("name_en", e.target.value)}
                    />
                  </div>
                </div>

                {/* Department Head */}
                <div className="md:col-span-2">
                  <label htmlFor="head_teacher_id" className="block text-sm font-medium leading-6 text-gray-900">
                    رئيس القسم
                  </label>
                  <div className="mt-2">
                    <select
                      name="head_teacher_id"
                      id="head_teacher_id"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                      value={form.head_teacher_id}
                      onChange={(e) => handleInputChange("head_teacher_id", e.target.value)}
                      disabled={teachersLoading}
                    >
                      <option value="">
                        {teachersLoading ? "جاري تحميل المدرسين..." : "اختر رئيس القسم"}
                      </option>
                      {teachers.map((teacher: any) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} {teacher.name_en ? `(${teacher.name_en})` : ''}
                        </option>
                      ))}
                    </select>
                    {teachers.length === 0 && !teachersLoading && (
                      <p className="mt-1 text-sm text-yellow-600">
                        لا يوجد مدرسين نشطين في النظام
                      </p>
                    )}
                  </div>
                </div>

                {/* Semester Count */}
                <div className="md:col-span-2">
                  <label htmlFor="semester_count" className="block text-sm font-medium leading-6 text-gray-900">
                    عدد الفصول الدراسية
                  </label>
                  <div className="mt-2">
                    <select
                      name="semester_count"
                      id="semester_count"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                      value={form.semester_count}
                      onChange={(e) => handleInputChange("semester_count", parseInt(e.target.value) as any)}
                    >
                      <option value={1}>فصل واحد</option>
                      <option value={2}>فصلان</option>
                      <option value={3}>ثلاثة فصول</option>
                      <option value={4}>أربعة فصول</option>
                      <option value={5}>خمسة فصول</option>
                      <option value={6}>ستة فصول</option>
                      <option value={7}>سبعة فصول</option>
                      <option value={8}>ثمانية فصول</option>
                      <option value={9}>تسعة فصول</option>
                      <option value={10}>عشرة فصول</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      عدد الفصول الدراسية التي سيتم تدريسها في هذا القسم
                    </p>
                    {form.semester_count > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          سيتم إنشاء <span className="font-semibold">{form.semester_count}</span> قسم للفصول الدراسية أدناه
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label htmlFor="is_locked" className="block text-sm font-medium leading-6 text-gray-900">
                    حالة القسم
                  </label>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_locked"
                        id="is_locked"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        checked={form.is_locked}
                        onChange={(e) => handleInputChange("is_locked", e.target.checked)}
                      />
                      <label htmlFor="is_locked" className="ml-2 block text-sm text-gray-900">
                        قفل القسم
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      الأقسام المقفلة لا يمكن إضافة طلاب جدد إليها
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Management Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">الفصول الدراسية والمواد</h2>
              <p className="text-sm text-gray-600 mb-6">
                قم بتعيين المواد لكل فصل دراسي. يمكن تعيين كل مادة لفصل دراسي واحد فقط.
              </p>
              
              <div className="space-y-6">
                {Array.from({ length: form.semester_count }, (_, index) => {
                  const semesterNumber = index + 1;
                  const availableSubjects = getAvailableSubjects(semesterNumber);
                  const selectedSubjects = getSelectedSubjects(semesterNumber);

                  return (
                    <div key={semesterNumber} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-700">{semesterNumber}</span>
                          </div>
                          <h3 className="text-md font-medium text-gray-900">
                            الفصل الدراسي {semesterNumber}
                          </h3>
                        </div>
                        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                          الفصل {semesterNumber}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Available Subjects */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            المواد المتاحة ({availableSubjects.length})
                          </h4>
                          
                          {subjectsLoading ? (
                            <div className="text-center py-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
                              <p className="mt-1 text-xs text-gray-600">جاري تحميل المواد...</p>
                            </div>
                          ) : availableSubjects.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                              <p className="text-xs">لا توجد مواد متاحة</p>
                            </div>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {availableSubjects.map((subject: any) => (
                                <div
                                  key={subject.id}
                                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors duration-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-900">{subject.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {subject.code} • {subject.credits} ساعة
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddSubject(semesterNumber, subject.id)}
                                    className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-100 transition-colors duration-200"
                                    title="إضافة المادة"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Selected Subjects */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            المواد المختارة ({selectedSubjects.length})
                          </h4>
                          
                          {selectedSubjects.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs">لم يتم اختيار أي مواد بعد</p>
                            </div>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {selectedSubjects.map((subject: any) => (
                                <div
                                  key={subject.id}
                                  className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-900">{subject.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {subject.code} • {subject.credits} ساعة
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubject(semesterNumber, subject.id)}
                                    className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-100 transition-colors duration-200"
                                    title="إزالة المادة"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 text-sm">{errors.submit}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

