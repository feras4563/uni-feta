import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeachers } from "../../lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  department?: any | null;
};

export default function DepartmentModal({ open, onClose, onSaved, department }: Props) {
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    head_teacher_id: "",
    is_locked: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch active teachers for department head selection
  const { data: teachers = [], isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers("", true), // Only active teachers
    enabled: open // Only fetch when modal is open
  });

  console.log('DepartmentModal Debug:', {
    open,
    teachersCount: teachers.length,
    teachersLoading,
    teachersError,
    teachers: teachers.slice(0, 3) // Show first 3 teachers
  });


  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (open) {
      if (department) {
        setForm({
          name: department.name || "",
          name_en: department.name_en || "",
          head_teacher_id: department.head_teacher_id || "",
          is_locked: department.is_locked || false
        });
      } else {
        setForm({
          name: "",
          name_en: "",
          head_teacher_id: "",
          is_locked: false
        });
      }
      setErrors({});
    }
  }, [open, department]);

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
        is_locked: form.is_locked
      };

      if (department?.id) {
        // Update existing department
        const { error } = await supabase
          .from("departments")
          .update(formData)
          .eq("id", department.id);

        if (error) throw error;
      } else {
        // Create new department
        const { error } = await supabase
          .from("departments")
          .insert(formData);

        if (error) throw error;
      }

      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving department:", error);
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18h15M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {department ? "تعديل بيانات القسم" : "إضافة قسم جديد"}
                </h3>
                <p className="text-sm text-gray-500">
                  {department ? "تحديث معلومات القسم في النظام" : "إدخال بيانات قسم جديد"}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-4 w-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                المعلومات الأساسية
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Arabic Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    اسم القسم (عربي) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 ${
                        errors.name ? 'ring-red-300 focus:ring-red-500' : ''
                      }`}
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="مثال: قسم علوم الحاسوب"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>

                {/* English Name */}
                <div>
                  <label htmlFor="name_en" className="block text-sm font-medium leading-6 text-gray-900">
                    اسم القسم (إنجليزي)
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name_en"
                      id="name_en"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"
                      value={form.name_en}
                      onChange={(e) => handleInputChange("name_en", e.target.value)}
                      placeholder="Example: Computer Science Department"
                    />
                  </div>
                </div>

                {/* Department Head */}
                <div>
                  <label htmlFor="head" className="block text-sm font-medium leading-6 text-gray-900">
                    رئيس القسم
                  </label>
                  <div className="mt-2">
                    <select
                      key={`head_teacher_select_${open ? 'open' : 'closed'}`}
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

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                    حالة القسم
                  </label>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <input
                        id="is_locked"
                        name="is_locked"
                        type="checkbox"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded"
                        checked={form.is_locked}
                        onChange={(e) => handleInputChange("is_locked", e.target.checked)}
                      />
                      <label htmlFor="is_locked" className="mr-2 block text-sm text-gray-900">
                        قسم مغلق (غير نشط)
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      الأقسام المغلقة لا تقبل طلاب جدد ولا يمكن إنشاء مواد جديدة فيها
                    </p>
                  </div>
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
                className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                onClick={onClose}
                disabled={submitting}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  department ? "تحديث البيانات" : "إضافة القسم"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
