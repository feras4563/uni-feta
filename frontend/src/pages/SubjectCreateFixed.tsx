import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubjectWithDepartments, fetchDepartments, uploadSubjectPDF } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

export default function SubjectCreateFixed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const [form, setForm] = useState({
    code: "",
    name: "",
    name_en: "",
    department_ids: [] as string[],
    primary_department_id: "",
    credits: 0,
    teacher_id: "",
    semester: "",
    max_students: 0,
    cost_per_credit: 0,
    // total_cost: 0, // REMOVED - This is a generated column
    is_required: true,
    semester_number: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Auto-calculate total cost when credits or cost_per_credit changes
      // Note: This is just for display purposes, the database will calculate the actual total_cost
      if (field === 'credits' || field === 'cost_per_credit') {
        // newForm.total_cost = newForm.credits * newForm.cost_per_credit; // REMOVED
        console.log(`Calculated total cost: ${newForm.credits * newForm.cost_per_credit}`);
      }
      
      return newForm;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setForm(prev => {
      const newDepartmentIds = prev.department_ids.includes(departmentId)
        ? prev.department_ids.filter(id => id !== departmentId)
        : [...prev.department_ids, departmentId];
      
      return {
        ...prev,
        department_ids: newDepartmentIds,
        primary_department_id: newDepartmentIds.length === 1 ? newDepartmentIds[0] : prev.primary_department_id
      };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.code.trim()) {
      newErrors.code = "كود المقرر مطلوب";
    }
    
    if (!form.name.trim()) {
      newErrors.name = "اسم المقرر مطلوب";
    }
    
    if (form.credits <= 0) {
      newErrors.credits = "عدد الساعات المعتمدة يجب أن يكون أكبر من صفر";
    }
    
    if (form.cost_per_credit < 0) {
      newErrors.cost_per_credit = "تكلفة الساعة المعتمدة يجب أن تكون أكبر من أو تساوي صفر";
    }
    
    if (form.department_ids.length === 0) {
      newErrors.department_ids = "يجب اختيار قسم واحد على الأقل";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const subjectData = {
        code: form.code.trim(),
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        credits: form.credits,
        teacher_id: form.teacher_id || null,
        semester: form.semester || null,
        max_students: form.max_students || null,
        cost_per_credit: form.cost_per_credit,
        // total_cost: form.total_cost, // REMOVED - This is a generated column
        is_required: form.is_required,
        semester_number: form.semester_number,
      };

      console.log("Creating subject with data:", subjectData);

      const newSubject = await createSubjectWithDepartments(
        subjectData,
        form.department_ids,
        form.primary_department_id || form.department_ids[0]
      );

      console.log("Subject created successfully:", newSubject);

      // Upload PDF if provided
      if (pdfFile) {
        setUploadingPdf(true);
        try {
          const pdfData = await uploadSubjectPDF(pdfFile, newSubject.id);
          console.log("PDF uploaded successfully:", pdfData);
        } catch (pdfError) {
          console.error("Error uploading PDF:", pdfError);
          setErrors({ submit: "تم إنشاء المقرر ولكن فشل في رفع الملف" });
        } finally {
          setUploadingPdf(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      navigate(`/subjects/${newSubject.id}`);
    } catch (error: any) {
      console.error("Error creating subject:", error);
      setErrors({ submit: error.message || "خطأ في إنشاء المقرر الدراسي" });
    } finally {
      setSubmitting(false);
    }
  };

  if (departmentsLoading) return <LoadingSpinner />;
  if (departmentsError) return <ErrorMessage message="خطأ في تحميل الأقسام" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إضافة مقرر دراسي جديد</h1>
                <p className="text-sm text-gray-600 mt-1">إضافة مقرر دراسي جديد إلى النظام</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/subjects")}
                className="inline-flex items-center px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  المعلومات الأساسية
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كود المقرر <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.code ? "border-red-500" : ""
                      }`}
                      value={form.code}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      placeholder="كود المقرر الدراسي"
                      required
                    />
                    {errors.code && <p className="mt-2 text-sm text-red-600">{errors.code}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المقرر <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? "border-red-500" : ""
                      }`}
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="اسم المقرر الدراسي"
                      required
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المقرر (إنجليزي)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.name_en}
                      onChange={(e) => handleInputChange("name_en", e.target.value)}
                      placeholder="Subject Name (English)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الساعات المعتمدة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.credits ? "border-red-500" : ""
                      }`}
                      value={form.credits}
                      onChange={(e) => handleInputChange("credits", parseInt(e.target.value) || 0)}
                      placeholder="عدد الساعات المعتمدة"
                      required
                    />
                    {errors.credits && <p className="mt-2 text-sm text-red-600">{errors.credits}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الفصل الدراسي
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.semester}
                      onChange={(e) => handleInputChange("semester", e.target.value)}
                    >
                      <option value="">اختر الفصل الدراسي</option>
                      <option value="1">الفصل الأول</option>
                      <option value="2">الفصل الثاني</option>
                      <option value="3">الفصل الثالث</option>
                      <option value="4">الفصل الرابع</option>
                      <option value="5">الفصل الخامس</option>
                      <option value="6">الفصل السادس</option>
                      <option value="7">الفصل السابع</option>
                      <option value="8">الفصل الثامن</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحد الأقصى للطلاب
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.max_students}
                      onChange={(e) => handleInputChange("max_students", parseInt(e.target.value) || 0)}
                      placeholder="الحد الأقصى للطلاب"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تكلفة الساعة المعتمدة
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cost_per_credit ? "border-red-500" : ""
                      }`}
                      value={form.cost_per_credit}
                      onChange={(e) => handleInputChange("cost_per_credit", parseFloat(e.target.value) || 0)}
                      placeholder="تكلفة الساعة المعتمدة"
                    />
                    {errors.cost_per_credit && <p className="mt-2 text-sm text-red-600">{errors.cost_per_credit}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التكلفة الإجمالية (محسوبة تلقائياً)
                    </label>
                    <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                      {form.credits * form.cost_per_credit} ريال
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      التكلفة الإجمالية = الساعات المعتمدة × تكلفة الساعة المعتمدة
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  الأقسام
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments?.map((department: any) => (
                    <label key={department.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        checked={form.department_ids.includes(department.id)}
                        onChange={() => handleDepartmentToggle(department.id)}
                      />
                      <span className="mr-2 text-sm text-gray-700">{department.name}</span>
                    </label>
                  ))}
                </div>
                {errors.department_ids && <p className="mt-2 text-sm text-red-600">{errors.department_ids}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/subjects")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingPdf}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {submitting ? "جاري الحفظ..." : "حفظ المقرر"}
              </button>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
