import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchStudents,
  fetchDepartments, 
  fetchSemesters,
  fetchDepartmentCurriculum,
  fetchDepartmentCurriculumBySemesterNumber,
  enrollStudentInSubjects,
  fetchStudentSubjectEnrollments,
  fetchStudentInvoices
} from "@/lib/jwt-api";
import { 
  Plus, 
  Search, 
  Edit, 
  UserCheck, 
  DollarSign, 
  Users,
  BookOpen,
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function EnhancedStudentRegistration() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [studySemester, setStudySemester] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  // Debug logging for semesters data
  React.useEffect(() => {
    if (semesters) {
      console.log('📅 Semesters data:', semesters);
      console.log('📅 First semester:', semesters[0]);
      console.log('📅 Study years (camelCase):', semesters.map(s => s.studyYear));
      console.log('📅 Study years (snake_case):', semesters.map(s => s.study_year));
    }
  }, [semesters]);

  // Fetch curriculum when department and semester number are selected
  const { data: curriculum, isLoading: loadingCurriculum } = useQuery({
    queryKey: ["curriculum", selectedDepartment, selectedSemesterNumber],
    queryFn: () => {
      console.log('🔍 Fetching curriculum for:', { selectedDepartment, selectedSemesterNumber });
      return fetchDepartmentCurriculumBySemesterNumber(selectedDepartment, selectedSemesterNumber!);
    },
    enabled: !!selectedDepartment && !!selectedSemesterNumber,
  });

  // Fetch student enrollments when student is selected
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ["student-enrollments", selectedStudent?.id],
    queryFn: () => fetchStudentSubjectEnrollments(selectedStudent?.id),
    enabled: !!selectedStudent?.id,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch student invoices
  const { data: invoices } = useQuery({
    queryKey: ["student-invoices", selectedStudent?.id],
    queryFn: () => fetchStudentInvoices(selectedStudent?.id),
    enabled: !!selectedStudent?.id,
  });

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.national_id_passport?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const enrolledSubjects = useMemo(() => {
    if (!enrollments) return [];
    console.log('🔍 Raw enrollments data:', enrollments);
    
    // Extract subject IDs from enrollment records
    const subjectIds = enrollments.map(enrollment => {
      // Handle both direct subject_id and nested subjects object
      if (enrollment.subject_id) {
        return enrollment.subject_id;
      } else if (enrollment.subjects && enrollment.subjects.id) {
        return enrollment.subjects.id;
      }
      return null;
    }).filter(Boolean);
    
    console.log('🔍 Extracted enrolled subject IDs:', subjectIds);
    return subjectIds;
  }, [enrollments]);

  const availableCost = useMemo(() => {
    console.log('🔍 Curriculum data:', curriculum);
    console.log('🔍 Curriculum length:', curriculum?.length);
    if (!curriculum) return 0;
    return curriculum
      .filter(item => !enrolledSubjects.includes(item.id))
      .reduce((sum, item) => sum + ((item.credits || 0) * (item.cost_per_credit || 0)), 0);
  }, [curriculum, enrolledSubjects]);

  const selectedCost = useMemo(() => {
    if (!curriculum) return 0;
    return selectedSubjects.reduce((sum, subjectId) => {
      const item = curriculum.find(c => c.id === subjectId);
      return sum + ((item?.credits || 0) * (item?.cost_per_credit || 0));
    }, 0);
  }, [selectedSubjects, curriculum]);

  const handleStudentSelect = (student: any) => {
    console.log('🔍 Student selected:', student);
    console.log('🔍 Student department_id:', student.department_id);
    setSelectedStudent(student);
    setSelectedDepartment(student.department_id);
    setSelectedSubjects([]); // Reset selected subjects when student changes
  };

  const handleSubjectToggle = (subjectId: string) => {
    // Prevent toggling already enrolled subjects
    if (enrolledSubjects.includes(subjectId)) {
      return;
    }
    
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (!curriculum) return;
    const availableSubjects = curriculum.filter(item => !enrolledSubjects.includes(item.id));
    if (selectedSubjects.length === availableSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(availableSubjects.map(item => item.id));
    }
  };

  const handleSelectRequired = () => {
    if (!curriculum) return;
    const requiredSubjects = curriculum
      .filter(item => !enrolledSubjects.includes(item.id) && item.is_required)
      .map(item => item.id);
    setSelectedSubjects(requiredSubjects);
  };

  const handleRegisterStudent = async () => {
    if (!selectedStudent || !selectedSemesterNumber || !selectedDepartment || selectedSubjects.length === 0 || !studySemester || !academicYear) {
      alert("يرجى ملء جميع الحقول المطلوبة: الفصل الدراسي، السنة الأكاديمية، ومعلومات التسجيل");
      return;
    }

    // Check if any selected subjects are already enrolled (this should not happen with the UI changes, but keeping as safety check)
    const alreadyEnrolledSubjects = selectedSubjects.filter(subjectId => 
      enrolledSubjects.includes(subjectId)
    );

    if (alreadyEnrolledSubjects.length > 0) {
      alert("خطأ: لا يمكن تسجيل المقررات التي تم تسجيلها مسبقاً. يرجى إزالة المقررات المسجلة مسبقاً من الاختيار.");
      return;
    }

    try {
      const result = await enrollStudentInSubjects(
        selectedStudent.id,
        selectedSubjects,
        studySemester, // semester_id
        semesters?.find(s => s.id === studySemester)?.study_year_id || semesters?.find(s => s.id === studySemester)?.studyYear?.id || '', // study_year_id
        selectedDepartment,
        selectedSemesterNumber
      );
      
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["student-subject-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["student-invoices"] });
      
      const selectedSemesterName = semesters?.find(s => s.id === studySemester)?.name || studySemester;
      
      // Show detailed success message
      if (result.skippedSubjects && result.skippedSubjects.length > 0) {
        alert(`تم تسجيل الطالب في ${result.enrolledSubjects.length} مقرر جديد للفصل الدراسي ${selectedSemesterName} - ${academicYear}. تم تجاهل ${result.skippedSubjects.length} مقرر مسجل مسبقاً.`);
      } else {
        alert(`تم تسجيل الطالب في جميع المقررات بنجاح للفصل الدراسي ${selectedSemesterName} - ${academicYear} وتم إنشاء الفاتورة`);
      }
      
      setSelectedSubjects([]); // Clear selected subjects after registration
      setStudySemester(""); // Clear study semester
      setAcademicYear(""); // Clear academic year
    } catch (error: any) {
      alert("خطأ في تسجيل الطالب: " + error.message);
    }
  };

  if (loadingStudents) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الطلاب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الطلاب في الفصل الدراسي</h1>
        <p className="text-gray-600">تسجيل الطلاب في المقررات المطلوبة مع حساب التكاليف وإنشاء الفواتير</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">اختيار الطالب</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن الطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                  <div className="text-sm text-gray-500">{student.national_id_passport}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">معلومات الطالب</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {selectedStudent.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">الاسم</label>
                    <p className="text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                    <p className="text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">رقم الهوية</label>
                    <p className="text-gray-900">{selectedStudent.national_id_passport}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">القسم</label>
                    <p className="text-gray-900">
                      {departments?.find(d => d.id === selectedStudent.department_id)?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Semester Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">اختيار الفصل الدراسي</h3>
                <select
                  value={selectedSemesterNumber || ""}
                  onChange={(e) => setSelectedSemesterNumber(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">اختر الفصل الدراسي</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(semesterNumber => (
                    <option key={semesterNumber} value={semesterNumber}>
                      الفصل الدراسي {semesterNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Study Semester and Academic Year */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات التسجيل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الفصل الدراسي للتسجيل
                    </label>
                    <select
                      value={studySemester}
                      onChange={(e) => {
                        setStudySemester(e.target.value);
                        // Auto-select academic year when semester is selected
                        if (e.target.value) {
                          const selectedSemester = semesters?.find(s => s.id === e.target.value);
                          const studyYear = selectedSemester?.studyYear || selectedSemester?.study_year;
                          if (studyYear?.name) {
                            setAcademicYear(studyYear.name);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">اختر الفصل الدراسي</option>
                      {semesters?.map((semester) => {
                        const studyYear = semester.studyYear || semester.study_year;
                        return (
                          <option key={semester.id} value={semester.id}>
                            {semester.name} ({semester.name_en}) - {studyYear?.name || 'N/A'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      السنة الأكاديمية
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">اختر السنة الأكاديمية</option>
                      {semesters && [...new Set(semesters.map(s => {
                        const studyYear = s.studyYear || s.study_year;
                        return studyYear?.name;
                      }).filter(Boolean))].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Curriculum and Registration */}
              {selectedSemesterNumber && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">مقررات الفصل الدراسي</h3>
                    <div className="flex items-center gap-4">
                      {selectedSubjects.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {selectedCost.toLocaleString()} دينار
                          </span>
                          <span className="text-sm text-gray-500">
                            ({selectedSubjects.length} مقرر)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        <span className="text-lg font-bold text-blue-600">
                          {availableCost.toLocaleString()} دينار
                        </span>
                        <span className="text-sm text-gray-500">(متاح)</span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Info */}
                  {(studySemester || academicYear) && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">معلومات التسجيل:</span>
                        {studySemester && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {semesters?.find(s => s.id === studySemester)?.name || studySemester}
                          </span>
                        )}
                        {academicYear && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {academicYear}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enrollment Summary */}
                  {curriculum && curriculum.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 font-medium">
                              مسجل مسبقاً: {loadingEnrollments ? 'جاري التحميل...' : curriculum.filter(item => enrolledSubjects.includes(item.id)).length + ' مقرر'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-700 font-medium">
                              متاح للتسجيل: {loadingEnrollments ? 'جاري التحميل...' : curriculum.filter(item => !enrolledSubjects.includes(item.id)).length + ' مقرر'}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-600">
                          إجمالي المقررات: {curriculum.length}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selection Buttons */}
                  {curriculum && curriculum.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        disabled={curriculum.filter(item => !enrolledSubjects.includes(item.id)).length === 0}
                      >
                        {selectedSubjects.length === curriculum.filter(item => !enrolledSubjects.includes(item.id)).length ? 'إلغاء الكل' : `اختيار الكل المتاح (${curriculum.filter(item => !enrolledSubjects.includes(item.id)).length})`}
                      </button>
                      <button
                        onClick={handleSelectRequired}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        disabled={curriculum.filter(item => !enrolledSubjects.includes(item.id) && item.is_required).length === 0}
                      >
                        اختيار المطلوبة المتاحة فقط ({curriculum.filter(item => !enrolledSubjects.includes(item.id) && item.is_required).length})
                      </button>
                    </div>
                  )}

                  {loadingCurriculum ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mb-2"></div>
                      <p className="text-gray-600">جاري تحميل المقررات...</p>
                    </div>
                  ) : curriculum && curriculum.length > 0 ? (
                    <div className="space-y-3">
                      {curriculum.map((item) => {
                        const isEnrolled = enrolledSubjects.includes(item.id);
                        const isSelected = selectedSubjects.includes(item.id);
                        const isAvailable = !isEnrolled;
                        
                        // Debug logging
                        console.log('🔍 Subject check:', {
                          subjectId: item.id,
                          subjectName: item.name,
                          isEnrolled,
                          enrolledSubjects,
                          isSelected,
                          isAvailable
                        });
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-lg border transition-colors ${
                              isEnrolled
                                ? 'border-green-300 bg-green-100 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {isAvailable ? (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSubjectToggle(item.id)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  />
                                ) : (
                                  <div className="h-4 w-4 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className={`h-4 w-4 ${isEnrolled ? 'text-green-600' : 'text-blue-600'}`} />
                                    <span className={`font-medium ${isEnrolled ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                      {item.code} - {item.name}
                                    </span>
                                    {item.is_required && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                        مطلوب
                                      </span>
                                    )}
                                    {isEnrolled && (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        مسجل مسبقاً
                                      </span>
                                    )}
                                    {isAvailable && !isSelected && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        متاح للتسجيل
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                        مختار
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-sm mt-1 ${isEnrolled ? 'text-green-600' : 'text-gray-500'}`}>
                                    {item.credits} ساعة معتمدة
                                    {isEnrolled && ' - مسجل مسبقاً'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${isEnrolled ? 'text-green-700' : 'text-gray-900'}`}>
                                  {((item.credits || 0) * (item.cost_per_credit || 0)).toLocaleString()} دينار
                                </div>
                                <div className={`text-sm ${isEnrolled ? 'text-green-600' : 'text-gray-500'}`}>
                                  {item.cost_per_credit || 0} دينار/ساعة
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مقررات</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        لم يتم تحديد مقررات لهذا القسم والفصل الدراسي
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleRegisterStudent}
                      disabled={selectedSubjects.length === 0 || !studySemester || !academicYear}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      تسجيل المقررات المختارة ({selectedSubjects.length})
                    </button>
                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      disabled={!invoices || invoices.length === 0}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      عرض الفواتير
                    </button>
                  </div>
                </div>
              )}

              {/* Current Enrollments */}
              {enrollments && enrollments.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">المقررات المسجلة حالياً</h3>
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{enrollment.subjects?.code} - {enrollment.subjects?.name}</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            enrollment.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            enrollment.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {enrollment.payment_status === 'paid' ? 'مدفوع' :
                             enrollment.payment_status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{enrollment.subject_cost?.toLocaleString()} دينار</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">اختر طالباً للبدء</h3>
              <p className="mt-1 text-sm text-gray-500">
                اختر طالباً من القائمة لبدء عملية التسجيل في الفصل الدراسي
              </p>
            </div>
          )}
        </div>
      </div>


      {/* Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          invoices={invoices || []}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
}


// Invoice Modal
function InvoiceModal({ invoices, onClose }: { invoices: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">فواتير الطالب</h3>
        </div>
        
        <div className="px-6 py-4">
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">فاتورة #{invoice.invoice_number}</h4>
                      <p className="text-sm text-gray-500">{invoice.semesters?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {invoice.total_amount?.toLocaleString()} دينار
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status === 'paid' ? 'مدفوع' :
                         invoice.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {invoice.invoice_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span>{item.total_price?.toLocaleString()} دينار</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فواتير</h3>
              <p className="mt-1 text-sm text-gray-500">لم يتم إنشاء أي فواتير لهذا الطالب بعد</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
