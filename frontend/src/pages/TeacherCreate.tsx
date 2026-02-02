import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepartments, fetchSubjects, createTeacherWithDepartments, updateTeacher } from "../lib/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

export default function TeacherCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    name_en: '',
    department_ids: [] as string[],
    primary_department_id: '',
    email: '',
    phone: '',
    qualification: '',
    education_level: '',
    years_experience: null as number | null,
    availability: {
      sunday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
      monday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
      tuesday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
      wednesday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
      thursday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false }
    },
    specializations: [] as string[],
    teaching_hours: null as number | null,
    hourly_rate: null as number | null,
    basic_salary: null as number | null
  });

  // Data fetching
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects()
  });

  // Handle editing mode initialization
  useEffect(() => {
    if (id && location.state?.teacher) {
      setIsEditing(true);
      const teacher = location.state.teacher;
      setTeacherForm({
        name: teacher.name || '',
        name_en: teacher.name_en || '',
        department_ids: teacher.department_ids || [],
        primary_department_id: teacher.primary_department_id || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        qualification: teacher.qualification || '',
        education_level: teacher.education_level || '',
        years_experience: teacher.years_experience || null,
        availability: teacher.availability || {
          sunday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
          monday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
          tuesday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
          wednesday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
          thursday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false }
        },
        specializations: teacher.specializations || [],
        teaching_hours: teacher.teaching_hours || null,
        hourly_rate: teacher.hourly_rate || null,
        basic_salary: teacher.basic_salary || null
      });
    }
  }, [id, location.state]);

  // Multi-step form computed properties
  const availableSubjects = subjects.filter((s: any) => 
    teacherForm.department_ids && teacherForm.department_ids.includes(s.department_id)
  );

  const workDays = [
    { key: 'sunday', name: 'الأحد' },
    { key: 'monday', name: 'الاثنين' },
    { key: 'tuesday', name: 'الثلاثاء' },
    { key: 'wednesday', name: 'الأربعاء' },
    { key: 'thursday', name: 'الخميس' }
  ];

  const timeSlots = [
    { key: 'slot1', label: '08:00 - 10:00' },
    { key: 'slot2', label: '10:00 - 12:00' },
    { key: 'slot3', label: '12:00 - 14:00' },
    { key: 'slot4', label: '14:00 - 16:00' },
    { key: 'slot5', label: '16:00 - 18:00' }
  ];

  const qualifications = [
    'أستاذ',
    'أستاذ مشارك',
    'أستاذ مساعد',
    'مدرس',
    'مدرس مساعد',
    'محاضر'
  ];

  const educationLevels = [
    'دكتوراه',
    'ماجستير',
    'بكالوريوس',
    'دبلوم'
  ];

  // Use subjects from database as available specializations
  const availableSpecializations = subjects;

  const handleInputChange = (field: string, value: any) => {
    setTeacherForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityChange = (day: string, slot: string, checked: boolean) => {
    setTeacherForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [slot]: checked
        }
      }
    }));
  };

  const addSpecialization = () => {
    if (selectedSpecialization && !teacherForm.specializations.includes(selectedSpecialization)) {
      setTeacherForm(prev => ({
        ...prev,
        specializations: [...prev.specializations, selectedSpecialization]
      }));
      setSelectedSpecialization("");
    }
  };

  const removeSpecialization = (specialization: string) => {
    setTeacherForm(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== specialization)
    }));
  };

  const validateForm = () => {
    console.log('Validating form:', {
      name: teacherForm.name,
      department_ids: teacherForm.department_ids,
      qualification: teacherForm.qualification,
      isEditing
    });
    
    // For editing, only require name
    if (isEditing) {
      return teacherForm.name && teacherForm.name.trim() !== '';
    }
    
    // For creating, require name, department, and qualification
    return teacherForm.name && teacherForm.department_ids && teacherForm.department_ids.length > 0 && teacherForm.qualification;
  };

  const submitTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const teacherData = {
        name: teacherForm.name,
        name_en: teacherForm.name_en || null,
        email: teacherForm.email || null,
        phone: teacherForm.phone || null,
        qualification: teacherForm.qualification || null,
        education_level: teacherForm.education_level || null,
        years_experience: teacherForm.years_experience || null,
        availability: teacherForm.availability || null,
        specializations: teacherForm.specializations || null,
        teaching_hours: teacherForm.teaching_hours || null,
        hourly_rate: teacherForm.hourly_rate || null,
        basic_salary: teacherForm.basic_salary || null
      };

      if (isEditing && id) {
        // Update existing teacher
        await updateTeacher(
          id,
          teacherData,
          teacherForm.department_ids,
          teacherForm.primary_department_id || undefined
        );
        alert('تم تحديث عضو هيئة التدريس بنجاح');
        queryClient.invalidateQueries({ queryKey: ["teachers"] });
        queryClient.invalidateQueries({ queryKey: ["teacher", id] });
        navigate(`/teachers/${id}`);
      } else {
        // Create new teacher
        await createTeacherWithDepartments(
          teacherData,
          teacherForm.department_ids,
          teacherForm.primary_department_id || undefined
        );
        alert('تم إضافة عضو هيئة التدريس بنجاح');
        queryClient.invalidateQueries({ queryKey: ["teachers"] });
        navigate("/teachers");
      }
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      alert(`خطأ في ${isEditing ? 'تحديث' : 'إضافة'} عضو هيئة التدريس: ` + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (departmentsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
       {/* Header */}
       <div className="bg-white shadow-sm border-b border-gray-200">
         <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/teachers")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-3 bg-blue-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
               <div>
                 <h1 className="text-3xl font-bold text-gray-900">
                   {isEditing ? 'تعديل عضو هيئة التدريس' : 'إضافة عضو هيئة تدريس جديد'}
                 </h1>
                 <p className="text-sm text-gray-600 mt-1">
                   {isEditing ? 'تعديل بيانات عضو هيئة التدريس' : 'إضافة عضو جديد إلى هيئة التدريس'}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>


       {/* Content */}
       <div className="py-6">
         <div className="w-full">
          <form onSubmit={submitTeacher} className="bg-white rounded-lg shadow-sm border border-gray-200">
             <div className="px-6 py-4 border-b border-gray-200">
               <h3 className="text-lg font-semibold text-gray-900">
                 {isEditing ? 'تعديل عضو هيئة التدريس' : 'إضافة عضو هيئة تدريس جديد'}
               </h3>
             </div>
            
             <div className="p-6 space-y-8">
               {/* Section 1: Personal Information */}
               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                     <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                     المعلومات الشخصية
                   </h4>
                 </div>
                 <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم بالإنجليزية
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.name_en}
                      onChange={(e) => handleInputChange("name_en", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأقسام <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {departments.map((dept: any) => (
                        <label key={dept.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={teacherForm.department_ids && teacherForm.department_ids.includes(dept.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTeacherForm(prev => ({
                                  ...prev,
                                  department_ids: [...(prev.department_ids || []), dept.id]
                                }));
                              } else {
                                setTeacherForm(prev => ({
                                  ...prev,
                                  department_ids: (prev.department_ids || []).filter((id: string) => id !== dept.id),
                                  primary_department_id: prev.primary_department_id === dept.id ? '' : prev.primary_department_id
                                }));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">{dept.name}</span>
                          {teacherForm.department_ids && teacherForm.department_ids.includes(dept.id) && (
                            <span className="text-xs text-blue-600 font-medium">✓ محدد</span>
                          )}
                        </label>
                      ))}
                    </div>
                    {teacherForm.department_ids && teacherForm.department_ids.length > 1 && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          القسم الرئيسي
                        </label>
                        <select
                          value={teacherForm.primary_department_id}
                          onChange={(e) => handleInputChange("primary_department_id", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">اختر القسم الرئيسي</option>
                          {teacherForm.department_ids.map((deptId) => {
                            const dept = departments.find((d: any) => d.id === deptId);
                            return (
                              <option key={deptId} value={deptId}>
                                {dept?.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                    <small className="text-gray-500">يمكن اختيار عدة أقسام</small>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الرتبة العلمية <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.qualification}
                      onChange={(e) => handleInputChange("qualification", e.target.value)}
                      required
                    >
                      <option value="">اختر الرتبة</option>
                      {qualifications.map((qual) => (
                        <option key={qual} value={qual}>
                          {qual}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المؤهل العلمي
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.education_level}
                      onChange={(e) => handleInputChange("education_level", e.target.value)}
                    >
                      <option value="">اختر المؤهل العلمي</option>
                      {educationLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سنوات الخبرة
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.years_experience || ''}
                      onChange={(e) => handleInputChange("years_experience", parseInt(e.target.value) || null)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التخصصات الدقيقة
                    </label>
                    <div className="flex gap-2 mb-2">
                      <select
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                      >
                        <option value="">اختر تخصص دقيق لإضافته</option>
                        {availableSpecializations.map((subject: any) => (
                          <option key={subject.id} value={subject.name}>
                            {subject.name} ({subject.code})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addSpecialization}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teacherForm.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {spec}
                          <button
                            type="button"
                            onClick={() => removeSpecialization(spec)}
                            className="mr-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                     <p className="text-sm text-gray-500 mt-1">يمكن اختيار عدة تخصصات دقيقة</p>
                   </div>
                   </div>
                 </div>
               </div>

               {/* Section 2: Salary and Hours */}
               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                     <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                     </svg>
                     الراتب والساعات
                   </h4>
                 </div>
                 <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ساعات التدريس الأسبوعية
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.teaching_hours || ''}
                      onChange={(e) => handleInputChange("teaching_hours", parseInt(e.target.value) || null)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      معدل الساعة (دينار)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.hourly_rate || ''}
                      onChange={(e) => handleInputChange("hourly_rate", parseFloat(e.target.value) || null)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الراتب الأساسي (دينار)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={teacherForm.basic_salary || ''}
                      onChange={(e) => handleInputChange("basic_salary", parseFloat(e.target.value) || null)}
                     />
                   </div>
                   </div>
                 </div>
               </div>

               {/* Section 3: Weekly Schedule */}
               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                     <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                     الجدول الأسبوعي
                   </h4>
                 </div>
                 <div className="p-6">
                  <div className="space-y-4">
                    {workDays.map((day) => (
                      <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">{day.name}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {timeSlots.map((slot) => (
                            <label key={slot.key} className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={teacherForm.availability[day.key as keyof typeof teacherForm.availability][slot.key as keyof typeof teacherForm.availability.sunday]}
                                onChange={(e) => handleAvailabilityChange(day.key, slot.key, e.target.checked)}
                              />
                              <span className="mr-2 text-sm text-gray-700">{slot.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/teachers")}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
              
              <div>
                 <button
                   type="submit"
                   disabled={submitting || !validateForm()}
                   className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {submitting ? "جاري الحفظ..." : (isEditing ? "تحديث عضو هيئة التدريس" : "حفظ عضو هيئة التدريس")}
                 </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
