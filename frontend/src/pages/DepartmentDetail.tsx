import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepartmentWithStats, updateDepartment, deleteDepartment } from "../lib/jwt-api";
import { usePermissions } from "../hooks/usePermissions";

export default function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    head: "",
    is_locked: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: departmentData, isLoading, error } = useQuery({
    queryKey: ["department", id],
    queryFn: () => fetchDepartmentWithStats(id!),
    enabled: !!id
  });

  const department = departmentData?.department;
  const students = departmentData?.students;
  const subjects = departmentData?.subjects;

  // Initialize form when department data loads
  useEffect(() => {
    if (department) {
      setForm({
        name: department.name || "",
        name_en: department.name_en || "",
        head: department.head || "",
        is_locked: department.is_locked || false
      });
    }
  }, [department]);

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
        head: form.head.trim() || null,
        is_locked: form.is_locked
      };

      await updateDepartment(id!, formData);

      alert("تم تحديث بيانات القسم بنجاح!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["department", id] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error: any) {
      console.error("Error updating department:", error);
      setErrors({ submit: error.message || "خطأ في حفظ البيانات" });
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    // Reset form to original values
    if (department) {
      setForm({
        name: department.name || "",
        name_en: department.name_en || "",
        head: department.head || "",
        is_locked: department.is_locked || false
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm("هل أنت متأكد من حذف هذا القسم نهائياً؟ سيتم حذف البيانات المرتبطة به.")) {
      return;
    }

    try {
      await deleteDepartment(id);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.removeQueries({ queryKey: ["department", id] });
      queryClient.removeQueries({ queryKey: ["department-details", id] });
      alert("تم حذف القسم بنجاح!");
      navigate("/departments");
    } catch (error: any) {
      console.error("Error deleting department:", error);
      setErrors({ submit: error?.message || "خطأ في حذف القسم" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات القسم...</p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-1 text-sm text-gray-500">تعذر تحميل بيانات القسم. يرجى المحاولة مرة أخرى.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/departments")}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              العودة إلى قائمة الأقسام
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 21h19.5m-18-18v18m2.25-18h15M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
                <p className="text-sm text-gray-600 mt-1">تفاصيل القسم الأكاديمي</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/departments")}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                title="العودة إلى قائمة الأقسام"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة
              </button>
              {!isEditing && (
                <div className="flex gap-2">
                  {hasClientPermission("departments", "edit") && (
                    <>
                      <button
                        onClick={() => navigate(`/departments/${id}/edit`)}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-sm"
                        title="تعديل القسم والمواد"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تحرير شامل
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                        title="تعديل بيانات القسم"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تعديل سريع
                      </button>
                    </>
                  )}
                  {hasClientPermission("departments", "delete") && (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
                      title="حذف القسم نهائياً"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف نهائي
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Department Information - Main Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                معلومات القسم
              </h3>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        اسم القسم (عربي) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 ${
                          errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        value={form.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="اسم القسم بالعربية"
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-2">
                        اسم القسم (إنجليزي)
                      </label>
                      <input
                        type="text"
                        name="name_en"
                        id="name_en"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                        value={form.name_en}
                        onChange={(e) => handleInputChange("name_en", e.target.value)}
                        placeholder="Department Name in English"
                      />
                    </div>

                    <div>
                      <label htmlFor="head" className="block text-sm font-medium text-gray-700 mb-2">
                        رئيس القسم
                      </label>
                      <input
                        type="text"
                        name="head"
                        id="head"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                        value={form.head}
                        onChange={(e) => handleInputChange("head", e.target.value)}
                        placeholder="اسم رئيس القسم"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        حالة القسم
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <input
                            id="is_locked"
                            name="is_locked"
                            type="checkbox"
                            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                            checked={form.is_locked}
                            onChange={(e) => handleInputChange("is_locked", e.target.checked)}
                          />
                          <label htmlFor="is_locked" className="mr-2 block text-sm text-gray-900">
                            قسم مغلق (غير نشط)
                          </label>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          الأقسام المغلقة لا تقبل طلاب جدد ولا يمكن إنشاء مواد جديدة فيها
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="mr-3">
                          <h3 className="text-sm font-medium text-red-800">
                            خطأ في حفظ البيانات
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{errors.submit}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                      onClick={handleCancelEdit}
                      disabled={submitting}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          جاري الحفظ...
                        </div>
                      ) : (
                        "حفظ التغييرات"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">الاسم العربي</h4>
                    <p className="text-lg text-gray-900">{department.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">الاسم الإنجليزي</h4>
                    <p className="text-lg text-gray-900">{department.name_en || 'غير محدد'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">رئيس القسم</h4>
                    <p className="text-lg text-gray-900">{department.head || 'غير محدد'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">معرف القسم</h4>
                    <p className="text-lg text-gray-900 font-mono">#{department.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Curriculum / Semesters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  الخطة الدراسية ({Object.keys(subjects?.bySemester || {}).length} فصل)
                </h3>
                {departmentData?.totalUnits && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    إجمالي الوحدات: {departmentData.totalUnits}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {subjects?.bySemester && Object.keys(subjects.bySemester).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(subjects.bySemester)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => (a.semesterNumber || 0) - (b.semesterNumber || 0))
                    .map(([semesterName, semesterData]: [string, any]) => (
                    <div key={semesterName} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-indigo-50 to-white border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">
                              {semesterData.semesterNumber}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-gray-900">
                            {semesterName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {semesterData.subjects?.length || 0} مادة
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {semesterData.totalCredits || 0} وحدة
                          </span>
                        </div>
                      </div>
                      
                      {/* Table view for subjects */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكود</th>
                              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المقرر</th>
                              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الوحدات</th>
                              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">نظري/عملي</th>
                              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتطلب السابق</th>
                              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {semesterData.subjects?.map((subject: any, index: number) => {
                              const typeLabels: Record<string, { label: string; color: string }> = {
                                required: { label: 'إجباري', color: 'bg-blue-50 text-blue-700' },
                                elective: { label: 'اختياري', color: 'bg-amber-50 text-amber-700' },
                                university_requirement: { label: 'متطلب جامعة', color: 'bg-purple-50 text-purple-700' },
                                department_requirement: { label: 'متطلب قسم', color: 'bg-teal-50 text-teal-700' },
                              };
                              const typeInfo = typeLabels[subject.subject_type] || typeLabels.required;
                              const prereqs = subject.prerequisite_subjects || [];
                              
                              return (
                                <tr key={`${semesterName}-${subject.id}-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm font-mono font-medium text-indigo-600">{subject.code}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                      {subject.name_en && (
                                        <div className="text-xs text-gray-500 mt-0.5">{subject.name_en}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                                      {subject.credits}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-xs text-gray-600">
                                      {subject.theoretical_hours ?? '-'}/{subject.practical_hours ?? '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {prereqs.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {prereqs.map((p: any) => (
                                          <span key={p.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                            {p.code}
                                          </span>
                                        ))}
                                      </div>
                                    ) : subject.min_units_required ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                        {subject.min_units_required} وحدة مكتملة
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                      {typeInfo.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مواد مسجلة</h3>
                  <p className="mt-1 text-sm text-gray-500">لم يتم إضافة أي مواد دراسية لهذا القسم بعد.</p>
                </div>
              )}
            </div>
          </div>


          {/* Students and Subjects Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Students */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  الطلاب المسجلون ({students?.data?.length || 0})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {students?.data?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    لا يوجد طلاب مسجلون في هذا القسم
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {students?.data?.slice(0, 10).map((student: any) => (
                      <div key={student.id} className="p-4 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">#{student.id}</div>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          student.status === 'active' 
                            ? 'bg-green-50 text-green-700 ring-green-600/20' 
                            : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                        }`}>
                          {student.status === 'active' ? 'نشط' : student.status}
                        </span>
                      </div>
                    ))}
                    {students?.data && students.data.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        و {students.data.length - 10} طالب آخر...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subjects */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  المقررات الدراسية ({subjects?.total || 0})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {subjects?.data && subjects.data.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {subjects.data.slice(0, 10).map((subject: any, index: number) => (
                      <div key={`subject-${subject.id}-${index}`} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                            <div className="text-xs text-gray-500">كود: {subject.code}</div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {subject.credits} ساعة معتمدة
                          </div>
                        </div>
                      </div>
                    ))}
                    {subjects.data.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        و {subjects.data.length - 10} مقرر آخر...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    لا توجد مقررات مسجلة
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
