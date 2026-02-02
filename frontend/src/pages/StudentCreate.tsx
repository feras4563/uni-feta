import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepartments } from "../lib/api";
import { createStudent } from "../lib/jwt-api";
import { usePermissions } from "../hooks/usePermissions";

export default function StudentCreate() {
  const navigate = useNavigate();
  const { canCreate } = usePermissions();
  const queryClient = useQueryClient();
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  // Removed currentSection state - now using single page format
  
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
    enrollment_date: new Date().toISOString().split('T')[0] // Today's date
  });

  // Load departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  // Generate unique student ID
  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ST${year}${random}`;
  };

  // Note: QR code generation removed - will be handled by backend if needed

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Personal Information validation
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
    
    // Enrollment validation
    // Department is now optional
    if (!form.year) {
      newErrors.year = "السنة الدراسية مطلوبة";
    }
    if (!form.enrollment_date) {
      newErrors.enrollment_date = "تاريخ التسجيل مطلوب";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email validation will be handled by backend

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
        transcript_file: transcriptFile ? transcriptFile.name : null,
        department_id: form.department_id || null,
        year: form.year ? parseInt(form.year) : null,
        status: form.status,
        enrollment_date: form.enrollment_date || null
      };

      console.log('🔍 Attempting to save student data:', formData);

      await createStudent(formData);

      queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate('/students');
    } catch (error: any) {
      console.error("Error saving student:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      
      // Handle API errors
      const errorMessage = error.message || "خطأ في حفظ البيانات";
      
      if (errorMessage.includes('email')) {
        setErrors({ 
          email: "البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر.",
          submit: errorMessage
        });
      } else if (errorMessage.includes('national_id') || errorMessage.includes('passport')) {
        setErrors({ 
          national_id_passport: "الرقم القومي/جواز السفر مستخدم بالفعل. يرجى التحقق من الرقم.",
          submit: errorMessage
        });
      } else {
        setErrors({ submit: errorMessage });
      }
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

  // Email validation will be handled on submit

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

  if (!canCreate('students')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">غير مسموح</h3>
          <p className="mt-1 text-sm text-gray-500">ليس لديك صلاحية لإضافة طلاب جدد.</p>
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
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate('/students')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تسجيل طالب جديد</h1>
                <p className="text-sm text-gray-600 mt-1">
                  إضافة طالب جديد إلى النظام
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => navigate('/students')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Removed Progress Steps - now using single page format */}

      {/* Content */}
      <div className="px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="h-5 w-5 text-blue-600 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              المعلومات الشخصية
            </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Arabic Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل (عربي) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="أدخل الاسم الكامل للطالب"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* English Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل (إنجليزي)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.name_en}
                        onChange={(e) => handleInputChange("name_en", e.target.value)}
                        placeholder="Full Name in English"
                      />
                    </div>

                    {/* National ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الرقم القومي/جواز السفر <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.national_id_passport ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.national_id_passport}
                        onChange={(e) => handleInputChange("national_id_passport", e.target.value)}
                        placeholder="أدخل الرقم القومي أو رقم جواز السفر"
                      />
                      {errors.national_id_passport && <p className="mt-1 text-sm text-red-600">{errors.national_id_passport}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الجنس <span className="text-red-500">*</span>
                      </label>
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
                      {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ الميلاد <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        min="2000-01-01"
                        max="2010-12-31"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.birth_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.birth_date}
                        onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      />
                      {errors.birth_date && <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>}
                    </div>

                    {/* Nationality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الجنسية
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.nationality}
                        onChange={(e) => handleInputChange("nationality", e.target.value)}
                        placeholder="مثال: ليبي"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+966 50 123 4567"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="example@university.edu"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="العنوان الكامل"
                      />
                    </div>

                    {/* Guardian/Sponsor Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">معلومات الاتصال بولي الأمر</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            اسم ولي الأمر
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={form.sponsor_name}
                            onChange={(e) => handleInputChange("sponsor_name", e.target.value)}
                            placeholder="أدخل اسم ولي الأمر"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رقم هاتف ولي الأمر
                          </label>
                          <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={form.sponsor_contact}
                            onChange={(e) => handleInputChange("sponsor_contact", e.target.value)}
                            placeholder="أدخل رقم الهاتف"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
          </div>

          {/* Academic History Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="h-5 w-5 text-blue-600 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              التاريخ الأكاديمي
            </h2>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      هذا القسم اختياري - يمكن تركه فارغاً للطلاب الجدد بدون مؤهلات سابقة
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Academic History Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع المؤهل <span className="text-xs text-gray-500">(للمرجع فقط)</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.academic_history_type}
                        onChange={(e) => handleInputChange("academic_history_type", e.target.value)}
                      >
                        <option value="">اختر نوع المؤهل</option>
                        <option value="high_school">الثانوية العامة</option>
                        <option value="diploma">دبلوم</option>
                        <option value="bachelor">بكالوريوس</option>
                        <option value="master">ماجستير</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>

                    {/* Academic Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الدرجة الأكاديمية
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.academic_score}
                        onChange={(e) => handleInputChange("academic_score", e.target.value)}
                        placeholder="مثال: 85.5% أو 3.2 GPA أو A"
                      />
                      <p className="mt-1 text-sm text-gray-500">أدخل الدرجة بأي صيغة (نسبة مئوية، GPA، أو درجة حرفية)</p>
                    </div>

                    {/* Transcript File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ملف الكشف الأكاديمي
                      </label>
                      <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0119.5 6v6a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 12V6zM3 16.06V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                          </svg>
                          <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label
                              htmlFor="transcript_file"
                              className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                            >
                              <span>رفع ملف</span>
                              <input
                                id="transcript_file"
                                name="transcript_file"
                                type="file"
                                className="sr-only"
                                accept=".pdf,.jpg,.jpeg,.png,.gif"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pr-1">أو اسحب وأفلت</p>
                          </div>
                          <p className="text-xs leading-5 text-gray-600">PDF, JPG, PNG, GIF حتى 10MB</p>
                          {transcriptFile && (
                            <p className="mt-2 text-sm text-green-600">
                              تم اختيار: {transcriptFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {errors.transcript_file && <p className="mt-2 text-sm text-red-600">{errors.transcript_file}</p>}
                    </div>

                    {/* Academic History Details */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تفاصيل المؤهل الأكاديمي
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.academic_history}
                        onChange={(e) => handleInputChange("academic_history", e.target.value)}
                        placeholder="تفاصيل إضافية حول المؤهل الأكاديمي، المدرسة/الجامعة، التخصص، إلخ..."
                      />
                    </div>
                  </div>
          </div>

          {/* Enrollment Data Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="h-5 w-5 text-blue-600 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
              </svg>
              بيانات التسجيل
            </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        القسم
                      </label>
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
                      {errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>}
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        السنة الدراسية <span className="text-red-500">*</span>
                      </label>
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
                      {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        حالة الطالب
                      </label>
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
                    </div>

                    {/* Enrollment Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تاريخ التسجيل <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.enrollment_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={form.enrollment_date}
                        onChange={(e) => handleInputChange("enrollment_date", e.target.value)}
                      />
                      {errors.enrollment_date && <p className="mt-1 text-sm text-red-600">{errors.enrollment_date}</p>}
                    </div>
                  </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
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
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  تسجيل الطالب
                </>
              )}
            </button>
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
        </form>
      </div>
    </div>
  );
}
