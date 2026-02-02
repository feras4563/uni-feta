import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubjectWithDepartments, fetchDepartments, uploadSubjectPDF } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

export default function SubjectCreate() {
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
    total_cost: 0,
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
      
      // Auto-calculate total cost when credits or cost_per_credit changes (for display only)
      if (field === 'credits' || field === 'cost_per_credit') {
        newForm.total_cost = newForm.credits * newForm.cost_per_credit;
        console.log(`Calculated total cost: ${newForm.total_cost} (for display only)`);
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
      
      // If we're removing the primary department, set a new one
      let newPrimaryDepartmentId = prev.primary_department_id;
      if (prev.primary_department_id === departmentId && newDepartmentIds.length > 0) {
        newPrimaryDepartmentId = newDepartmentIds[0];
      }
      
      return {
        ...prev,
        department_ids: newDepartmentIds,
        primary_department_id: newPrimaryDepartmentId
      };
    });
    
    // Clear error when user makes selection
    if (errors.department_ids) {
      setErrors(prev => ({ ...prev, department_ids: "" }));
    }
  };

  const handlePrimaryDepartmentChange = (departmentId: string) => {
    setForm(prev => ({ ...prev, primary_department_id: departmentId }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, pdf: 'يجب أن يكون الملف من نوع PDF' }));
        return;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, pdf: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' }));
        return;
      }
      setPdfFile(file);
      setErrors(prev => ({ ...prev, pdf: "" }));
    }
  };

  const removePdfFile = () => {
    setPdfFile(null);
    setErrors(prev => ({ ...prev, pdf: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.code.trim()) {
      newErrors.code = "كود المقرر مطلوب";
    }

    if (!form.name.trim()) {
      newErrors.name = "اسم المقرر مطلوب";
    }

    if (form.department_ids.length === 0) {
      newErrors.department_ids = "يجب اختيار قسم واحد على الأقل";
    }

    if (form.credits <= 0) {
      newErrors.credits = "عدد الساعات المعتمدة يجب أن يكون أكبر من صفر";
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

      console.log("✅ Creating subject with data (total_cost excluded):", subjectData);

      const newSubject = await createSubjectWithDepartments(
        subjectData,
        form.department_ids,
        form.primary_department_id || form.department_ids[0]
      );

      // Upload PDF if provided
      if (pdfFile) {
        setUploadingPdf(true);
        try {
          const pdfData = await uploadSubjectPDF(pdfFile, newSubject.id);
          await updateSubject(newSubject.id, {
            pdf_file_url: pdfData.url,
            pdf_file_name: pdfData.fileName,
            pdf_file_size: pdfData.fileSize,
          });
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/study-materials")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-3 bg-blue-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إضافة مقرر دراسي جديد</h1>
                <p className="text-sm text-gray-600 mt-1">إنشاء مقرر دراسي جديد في النظام</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/study-materials")}
                className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200 shadow-sm"
              >
                إلغاء
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
                      اسم المقرر (عربي) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? "border-red-500" : ""
                      }`}
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="اسم المقرر الدراسي بالعربية"
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
                      placeholder="Subject Name in English"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأقسام <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {/* Department Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {departments?.map((dept) => (
                          <label key={dept.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.department_ids.includes(dept.id)}
                              onChange={() => handleDepartmentToggle(dept.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                            {dept.name_en && (
                              <span className="text-xs text-gray-500">({dept.name_en})</span>
                            )}
                          </label>
                        ))}
                      </div>
                      
                      {/* Primary Department Selection */}
                      {form.department_ids.length > 1 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            القسم الرئيسي
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={form.primary_department_id}
                            onChange={(e) => handlePrimaryDepartmentChange(e.target.value)}
                          >
                            <option value="">اختر القسم الرئيسي</option>
                            {form.department_ids.map((deptId) => {
                              const dept = departments?.find(d => d.id === deptId);
                              return dept ? (
                                <option key={deptId} value={deptId}>
                                  {dept.name}
                                </option>
                              ) : null;
                            })}
                          </select>
                        </div>
                      )}
                      
                      {/* Selected Departments Summary */}
                      {form.department_ids.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-900 mb-2">الأقسام المختارة:</p>
                          <div className="flex flex-wrap gap-2">
                            {form.department_ids.map((deptId) => {
                              const dept = departments?.find(d => d.id === deptId);
                              const isPrimary = deptId === form.primary_department_id;
                              return dept ? (
                                <span
                                  key={deptId}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    isPrimary 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {dept.name}
                                  {isPrimary && <span className="ml-1">(رئيسي)</span>}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.department_ids && <p className="mt-2 text-sm text-red-600">{errors.department_ids}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  تفاصيل المقرر الدراسي
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عدد الساعات المعتمدة <span className="text-red-500">*</span>
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
                      تكلفة الساعة المعتمدة (دينار) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.cost_per_credit}
                      onChange={(e) => handleInputChange("cost_per_credit", parseFloat(e.target.value) || 0)}
                      placeholder="تكلفة الساعة المعتمدة"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التكلفة الإجمالية (دينار)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={form.total_cost}
                      readOnly
                      placeholder="يتم حسابها تلقائياً"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      الساعات المعتمدة × تكلفة الساعة المعتمدة
                    </p>
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
                      رقم الفصل الدراسي
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.semester_number}
                      onChange={(e) => handleInputChange("semester_number", parseInt(e.target.value) || 1)}
                      placeholder="رقم الفصل الدراسي"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع المقرر
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.is_required ? "required" : "optional"}
                      onChange={(e) => handleInputChange("is_required", e.target.value === "required")}
                    >
                      <option value="required">مقرر مطلوب</option>
                      <option value="optional">مقرر اختياري</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  ملف PDF للمقرر
                </h3>
              </div>
              <div className="p-6">
                {!pdfFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        اختر ملف PDF
                      </span>
                      <span className="text-sm text-gray-500"> أو اسحب الملف هنا</span>
                    </label>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">PDF فقط، الحد الأقصى 10 ميجابايت</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pdfFile.name}</p>
                        <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} ميجابايت</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePdfFile}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {errors.pdf && <p className="mt-2 text-sm text-red-600">{errors.pdf}</p>}
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mr-3">
                    <h3 className="text-sm font-medium text-red-800">خطأ في إنشاء المقرر الدراسي</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errors.submit}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/study-materials")}
                className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200 shadow-sm"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingPdf}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || uploadingPdf ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadingPdf ? "جاري رفع الملف..." : "جاري الإنشاء..."}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    إنشاء المقرر الدراسي
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
