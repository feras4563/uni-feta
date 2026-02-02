import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepartments } from "../lib/api";
import { getStudent, updateStudent, deleteStudent as deleteStudentAPI } from "../lib/jwt-api";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/AuthContext";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  
  const [form, setForm] = useState({
    // Personal Information
    name: "",
    name_en: "",
    national_id_passport: "",
    gender: "",
    birth_date: "",
    nationality: "",
    phone: "",
    email: "",
    address: "",
    sponsor_name: "",
    sponsor_contact: "",
    
    // Academic History
    academic_history: "",
    academic_history_type: "",
    academic_score: "",
    
    // Enrollment
    department_id: "",
    year: "",
    status: "active",
    enrollment_date: ""
  });

  // Load departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  // Load student data
  const { data: student, isLoading, error } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(id!),
    enabled: !!id
  });

  // QR code functionality removed - not using Supabase

  // Load student data into form when student is loaded
  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || "",
        name_en: student.name_en || "",
        national_id_passport: student.national_id_passport || "",
        gender: student.gender || "",
        birth_date: student.birth_date || "",
        nationality: student.nationality || "",
        phone: student.phone || "",
        email: student.email || "",
        address: student.address || "",
        sponsor_name: student.sponsor_name || "",
        sponsor_contact: student.sponsor_contact || "",
        academic_history: student.academic_history || "",
        academic_history_type: student.academic_history_type || "",
        academic_score: student.academic_score || "",
        department_id: String(student.department_id || ""),
        year: String(student.year || ""),
        status: student.status || "active",
        enrollment_date: student.enrollment_date || ""
      });
    }
  }, [student]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }
    if (!form.national_id_passport.trim()) {
      newErrors.national_id_passport = "الرقم القومي/جواز السفر مطلوب";
    }
    if (!form.gender) {
      newErrors.gender = "الجنس مطلوب";
    }
    if (!form.birth_date) {
      newErrors.birth_date = "تاريخ الميلاد مطلوب";
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }
    if (!form.department_id) {
      newErrors.department_id = "القسم مطلوب";
    }
    if (!form.year) {
      newErrors.year = "السنة الدراسية مطلوبة";
    }
    if (!form.enrollment_date) {
      newErrors.enrollment_date = "تاريخ التسجيل مطلوب";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const formData: any = {
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        national_id_passport: form.national_id_passport.trim(),
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        nationality: form.nationality.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        sponsor_name: form.sponsor_name.trim() || null,
        sponsor_contact: form.sponsor_contact.trim() || null,
        academic_history: form.academic_history ? String(form.academic_history).trim() || null : null,
        academic_score: form.academic_score ? String(form.academic_score).trim() || null : null,
        transcript_file: transcriptFile ? transcriptFile.name : student?.transcript_file,
        department_id: form.department_id || null,
        year: form.year ? parseInt(form.year) : null,
        status: form.status,
        enrollment_date: form.enrollment_date || null
      };

      await updateStudent(id!, formData);

      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating student:", error);
      setErrors({ submit: error.message || "خطأ في حفظ البيانات" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.type)) {
        setTranscriptFile(file);
        if (errors.transcript_file) {
          setErrors(prev => ({ ...prev, transcript_file: "" }));
        }
      } else {
        setErrors(prev => ({ ...prev, transcript_file: "يرجى اختيار ملف PDF أو صورة (JPG, PNG, GIF)" }));
      }
    }
  };

  const handleDeleteStudent = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

    try {
      await deleteStudentAPI(id!);
      alert('تم حذف الطالب بنجاح');
      queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate('/students');
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert('خطأ في حذف الطالب');
    }
  };

  // QR code functionality removed - not using Supabase

  const getDepartmentName = (departmentId: string) => {
    if (!departmentId) return 'غير محدد';
    const dept = departments.find((d: any) => d.id === departmentId);
    return dept ? dept.name : 'غير محدد';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-LY');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', classes: 'bg-emerald-50 text-emerald-700', icon: '●' },
      inactive: { label: 'غير نشط', classes: 'bg-red-50 text-red-700', icon: '●' },
      graduated: { label: 'متخرج', classes: 'bg-blue-50 text-blue-700', icon: '●' },
      suspended: { label: 'معلق', classes: 'bg-yellow-50 text-yellow-700', icon: '●' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.classes}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات الطالب...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-1 text-sm text-gray-500">تعذر تحميل بيانات الطالب. يرجى المحاولة مرة أخرى.</p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            العودة إلى قائمة الطلاب
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate('/students')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditing ? "تعديل بيانات الطالب" : "تفاصيل الطالب"}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1 font-medium">
                    {student.name} - {getDepartmentName(student.department_id)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              {!isEditing && canEdit('students') && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  تعديل البيانات
                </button>
              )}
              
              {!isEditing && canDelete('students') && (
                <button
                  onClick={handleDeleteStudent}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  حذف الطالب
                </button>
              )}
              
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm disabled:opacity-50"
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
                      "حفظ التغييرات"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-gray-100 rounded-lg ml-4">
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    المعلومات الشخصية
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Arabic Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      الاسم الكامل (عربي) <span className="text-red-500 mr-1">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 ${
                          errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                        }`}
                        value={form.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-900 font-medium">{student.name}</p>
                      </div>
                    )}
                    {errors.name && <p className="mt-2 text-sm text-red-600">
                      {errors.name}
                    </p>}
                  </div>

                  {/* English Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      الاسم الكامل (إنجليزي)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                        value={form.name_en}
                        onChange={(e) => handleInputChange("name_en", e.target.value)}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-900 font-medium">{student.name_en || 'غير محدد'}</p>
                      </div>
                    )}
                  </div>

                  {/* National ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الرقم القومي/جواز السفر <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.national_id_passport ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.national_id_passport}
                        onChange={(e) => handleInputChange("national_id_passport", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{student.national_id_passport}</p>
                    )}
                    {errors.national_id_passport && <p className="mt-1 text-sm text-red-600">{errors.national_id_passport}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الجنس <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.gender ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                      >
                        <option value="">اختر الجنس</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : 'غير محدد'}
                      </p>
                    )}
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ الميلاد <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.birth_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.birth_date}
                        onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{formatDate(student.birth_date)}</p>
                    )}
                    {errors.birth_date && <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>}
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الجنسية
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.nationality}
                        onChange={(e) => handleInputChange("nationality", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{student.nationality || 'غير محدد'}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{student.phone || 'غير محدد'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{student.email || 'غير محدد'}</p>
                    )}
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{student.address || 'غير محدد'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-gray-100 rounded-lg ml-4">
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    المعلومات الأكاديمية
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      القسم <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.department_id ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.department_id}
                        onChange={(e) => handleInputChange("department_id", e.target.value)}
                      >
                        <option value="">اختر القسم</option>
                        {departments.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{getDepartmentName(student.department_id)}</p>
                    )}
                    {errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      السنة الدراسية <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <select
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.year ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.year}
                        onChange={(e) => handleInputChange("year", e.target.value)}
                      >
                        <option value="">اختر السنة</option>
                        <option value="1">السنة الأولى</option>
                        <option value="2">السنة الثانية</option>
                        <option value="3">السنة الثالثة</option>
                        <option value="4">السنة الرابعة</option>
                        <option value="5">السنة الخامسة</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">السنة {student.year}</p>
                    )}
                    {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حالة الطالب
                    </label>
                    {isEditing ? (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.status}
                        onChange={(e) => handleInputChange("status", e.target.value)}
                      >
                        <option value="active">نشط</option>
                        <option value="inactive">غير نشط</option>
                        <option value="graduated">متخرج</option>
                        <option value="suspended">معلق</option>
                      </select>
                    ) : (
                      <div>{getStatusBadge(student.status)}</div>
                    )}
                  </div>

                  {/* Enrollment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ التسجيل <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.enrollment_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.enrollment_date}
                        onChange={(e) => handleInputChange("enrollment_date", e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{formatDate(student.enrollment_date)}</p>
                    )}
                    {errors.enrollment_date && <p className="mt-1 text-sm text-red-600">{errors.enrollment_date}</p>}
                  </div>

                  {/* Academic Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الدرجة الأكاديمية
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.academic_score}
                        onChange={(e) => handleInputChange("academic_score", e.target.value)}
                        placeholder="مثال: 85.5% أو 3.2 GPA"
                      />
                    ) : (
                      <p className="text-gray-900">{student.academic_score || 'غير محدد'}</p>
                    )}
                  </div>

                  {/* Academic History */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تفاصيل المؤهل الأكاديمي
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.academic_history}
                        onChange={(e) => handleInputChange("academic_history", e.target.value)}
                        placeholder="تفاصيل إضافية حول المؤهل الأكاديمي..."
                      />
                    ) : (
                      <p className="text-gray-900">{student.academic_history || 'غير محدد'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code Card */}
              {student.qr_code && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg ml-3">
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">رمز QR</h3>
                  </div>
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                      <img 
                        src={student.qr_code} 
                        alt="QR Code" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      امسح الرمز لعرض معلومات الطالب
                    </p>
                  </div>
                </div>
              )}

              {/* Student Status Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg ml-3">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">حالة الطالب</h3>
                </div>
                <div className="text-center">
                  <div className="mb-6">{getStatusBadge(student.status)}</div>
                  <div className="space-y-3">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-600">رقم الطالب</p>
                      <p className="text-lg font-bold text-gray-900">{student.id}</p>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-600">تاريخ التسجيل</p>
                      <p className="text-lg font-bold text-gray-900">{formatDate(student.enrollment_date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              {(student.sponsor_name || student.sponsor_contact) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg ml-3">
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">معلومات ولي الأمر</h3>
                  </div>
                  <div className="space-y-4">
                    {student.sponsor_name && (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">الاسم</p>
                        <p className="text-lg font-bold text-gray-900">{student.sponsor_name}</p>
                      </div>
                    )}
                    {student.sponsor_contact && (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">رقم الهاتف</p>
                        <p className="text-lg font-bold text-gray-900">{student.sponsor_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mr-4">
                  <h3 className="text-lg font-bold text-red-800 mb-2">
                    خطأ في حفظ البيانات
                  </h3>
                  <div className="text-red-700 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                    <p>{errors.submit}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
