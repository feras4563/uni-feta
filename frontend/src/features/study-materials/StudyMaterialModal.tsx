import { useState, useEffect } from "react";
import { createSubjectWithDepartments, updateSubject, updateSubjectDepartments, uploadSubjectPDF } from "../../lib/api";
import Modal from "../../components/ui/Modal";

interface StudyMaterialModalProps {
  material?: any; // This will be the subject being edited
  departments: any[];
  subjects: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudyMaterialModal({ material, departments, subjects, onClose, onSuccess }: StudyMaterialModalProps) {
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
    is_required: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);


  const semesters = [
    { value: "1", label: "الفصل الأول" },
    { value: "2", label: "الفصل الثاني" },
    { value: "3", label: "الفصل الثالث" },
    { value: "4", label: "الفصل الرابع" },
    { value: "5", label: "الفصل الخامس" },
    { value: "6", label: "الفصل السادس" },
    { value: "7", label: "الفصل السابع" },
    { value: "8", label: "الفصل الثامن" },
  ];

  useEffect(() => {
    if (material) {
      setForm({
        code: material.code || "",
        name: material.name || "",
        name_en: material.name_en || "",
        department_ids: material.departments ? material.departments.map((d: any) => d.id) : [],
        primary_department_id: material.departments ? material.departments.find((d: any) => d.is_primary)?.id || "" : "",
        credits: material.credits || 0,
        teacher_id: material.teacher_id || "",
        semester: material.semester || "",
        max_students: material.max_students || 0,
        is_required: material.is_required || false,
      });
    }
  }, [material]);

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
      };

      let subject;
      if (material) {
        // Update existing subject
        subject = await updateSubject(material.id, subjectData);
        // Update department relationships
        await updateSubjectDepartments(
          material.id,
          form.department_ids,
          form.primary_department_id || form.department_ids[0]
        );
        alert("تم تحديث المقرر الدراسي بنجاح!");
      } else {
        // Create new subject
        subject = await createSubjectWithDepartments(
          subjectData,
          form.department_ids,
          form.primary_department_id || form.department_ids[0]
        );
        alert("تم إضافة المقرر الدراسي بنجاح!");
      }

      // Upload PDF if provided
      if (pdfFile) {
        setUploadingPdf(true);
        try {
          const pdfData = await uploadSubjectPDF(pdfFile, subject.id);
          await updateSubject(subject.id, {
            pdf_file_url: pdfData.url,
            pdf_file_name: pdfData.fileName,
            pdf_file_size: pdfData.fileSize,
          });
        } catch (pdfError) {
          console.error("Error uploading PDF:", pdfError);
          setErrors({ submit: "تم حفظ المقرر ولكن فشل في رفع الملف" });
        } finally {
          setUploadingPdf(false);
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving material:", error);
      setErrors({ submit: error.message || "خطأ في حفظ البيانات" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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


  return (
    <Modal open={true} onClose={onClose} title={material ? "تعديل المقرر الدراسي" : "إضافة مقرر دراسي جديد"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                كود المقرر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                id="code"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 ${
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المقرر (عربي) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 ${
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
              <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المقرر (إنجليزي)
              </label>
              <input
                type="text"
                name="name_en"
                id="name_en"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={form.name_en}
                onChange={(e) => handleInputChange("name_en", e.target.value)}
                placeholder="Subject Name in English"
              />
            </div>
          </div>
        </div>

        {/* Subject Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            تفاصيل المقرر الدراسي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-2">
                عدد الساعات المعتمدة <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="credits"
                id="credits"
                min="1"
                max="10"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 ${
                  errors.credits ? "border-red-500" : ""
                }`}
                value={form.credits}
                onChange={(e) => handleInputChange("credits", parseInt(e.target.value) || 0)}
                placeholder="عدد الساعات المعتمدة"
                required
              />
              {errors.credits && <p className="mt-2 text-sm text-red-600">{errors.credits}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأقسام <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {/* Department Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {departments.map((dept) => (
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
                        const dept = departments.find(d => d.id === deptId);
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
                        const dept = departments.find(d => d.id === deptId);
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
            <div>
              <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-2">
                المدرس المسؤول
              </label>
              <select
                name="teacher_id"
                id="teacher_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={form.teacher_id}
                onChange={(e) => handleInputChange("teacher_id", e.target.value)}
              >
                <option value="">اختر المدرس</option>
                {/* Teachers will be loaded from API */}
              </select>
            </div>
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                الفصل الدراسي
              </label>
              <select
                name="semester"
                id="semester"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={form.semester}
                onChange={(e) => handleInputChange("semester", e.target.value)}
              >
                <option value="">اختر الفصل</option>
                {semesters.map((semester) => (
                  <option key={semester.value} value={semester.value}>
                    {semester.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="max_students" className="block text-sm font-medium text-gray-700 mb-2">
                الحد الأقصى للطلاب
              </label>
              <input
                type="number"
                name="max_students"
                id="max_students"
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={form.max_students}
                onChange={(e) => handleInputChange("max_students", parseInt(e.target.value) || 0)}
                placeholder="الحد الأقصى للطلاب"
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                id="is_required"
                name="is_required"
                type="checkbox"
                className="h-5 w-5 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                checked={form.is_required}
                onChange={(e) => handleInputChange("is_required", e.target.checked)}
              />
              <label htmlFor="is_required" className="mr-3 block text-sm text-gray-900">
                مادة إجبارية
              </label>
            </div>
          </div>
        </div>

        {/* PDF Upload */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            ملف PDF للمقرر
          </h3>
          <div className="space-y-4">
            {!pdfFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <label htmlFor="pdf-upload-modal" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    اختر ملف PDF
                  </span>
                  <span className="text-sm text-gray-500"> أو اسحب الملف هنا</span>
                </label>
                <input
                  id="pdf-upload-modal"
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
            {errors.pdf && <p className="text-sm text-red-600">{errors.pdf}</p>}
          </div>
        </div>

        {errors.submit && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-red-800">خطأ في حفظ البيانات</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errors.submit}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            disabled={submitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || uploadingPdf}
          >
            {submitting || uploadingPdf ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {uploadingPdf ? "جاري رفع الملف..." : (material ? "جاري التحديث..." : "جاري الإضافة...")}
              </span>
            ) : (
              material ? "تحديث المادة" : "إضافة المادة"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
