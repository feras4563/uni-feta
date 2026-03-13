import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchStudents,
  fetchDepartments, 
  fetchSemesters,
  fetchDepartmentCurriculumBySemesterNumber,
  enrollStudentInSubjects,
  fetchStudentSubjectEnrollments,
  fetchStudentInvoices,
  fetchApplicableFees
} from "@/lib/jwt-api";
import { 
  Plus, 
  Search, 
  Users,
  BookOpen,
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Layers,
  Info
} from "lucide-react";
import type { APIClientError } from "@/lib/api-client";

type CurriculumItem = {
  id: string;
  code?: string;
  name?: string;
  credits?: number;
  cost_per_credit?: number;
  is_required?: boolean;
};

 const toLatinDigits = (value: string | number | null | undefined) => {
   const input = String(value ?? "");
   return input
     .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
     .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
 };

 const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

 const formatCurrency = (value: number) => `${formatNumber(value)} دينار`;

 type PrerequisiteErrorItem = {
   subject?: string;
   subject_code?: string;
   missing?: Array<{
     id?: string;
     name?: string;
     code?: string;
   }>;
 };

 const formatRegistrationError = (error: APIClientError) => {
   const errorData = error.data as {
     prerequisite_errors?: PrerequisiteErrorItem[];
     invalid_subjects?: Array<{ code?: string; name?: string; semester_number?: number }>;
   } | undefined;

   const prerequisiteErrors = errorData?.prerequisite_errors;
   if (Array.isArray(prerequisiteErrors) && prerequisiteErrors.length > 0) {
     const details = prerequisiteErrors.map((item) => {
       const subjectLabel = [item.subject_code, item.subject].filter(Boolean).join(" - ");
       const missingLabel = (item.missing || [])
         .map((prerequisite) => [prerequisite.code, prerequisite.name].filter(Boolean).join(" - "))
         .filter(Boolean)
         .join("، ");

       return `- لا يمكن تسجيل ${subjectLabel || "هذا المقرر"} لأن الطالب لم ينجح في: ${missingLabel || "المتطلبات السابقة المطلوبة"}`;
     });

     return [error.message, ...details].join("\n");
   }

   const invalidSubjects = errorData?.invalid_subjects;
   if (Array.isArray(invalidSubjects) && invalidSubjects.length > 0) {
     const details = invalidSubjects.map((item) => {
       const subjectLabel = [item.code, item.name].filter(Boolean).join(" - ");
       return `- ${subjectLabel || "مقرر غير صالح"}`;
     });

     return [error.message, ...details].join("\n");
   }

   return error.message || "حدث خطأ أثناء تسجيل الطالب";
 };

export default function EnhancedStudentRegistration() {
  const TRACK_LABELS: Record<string, string> = {
    fine_arts_media: "الفنون الجميلة والإعلام",
    advertising_design: "الإعلان والتصميم",
    photography_cinema: "التصوير والسينما",
    multimedia_media: "الوسائط المتعددة والإعلام",
  };

  const TRACK_PREFIXES: Record<string, string[]> = {
    fine_arts_media: ["FA "],
    advertising_design: ["AD "],
    photography_cinema: ["PH "],
    multimedia_media: ["MM "],
  };

  const SHARED_TRACK_PREFIXES = ["EL ", "SUP DE "];

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [specializationTrack, setSpecializationTrack] = useState<string>("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [studySemester, setStudySemester] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);
  const trimmedSearchTerm = searchTerm.trim();
  const shouldSearchStudents = trimmedSearchTerm.length >= 2;

  const { data: searchedStudents, isFetching: searchingStudents } = useQuery<any[]>({
    queryKey: ["students", "search", trimmedSearchTerm],
    queryFn: () => fetchStudents(trimmedSearchTerm),
    enabled: shouldSearchStudents,
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: semesters } = useQuery<any[]>({
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
  const { data: curriculum, isLoading: loadingCurriculum } = useQuery<CurriculumItem[]>({
    queryKey: ["curriculum", selectedDepartment, selectedSemesterNumber],
    queryFn: () => {
      console.log('🔍 Fetching curriculum for:', { selectedDepartment, selectedSemesterNumber });
      return fetchDepartmentCurriculumBySemesterNumber(selectedDepartment, selectedSemesterNumber!);
    },
    enabled: !!selectedDepartment && !!selectedSemesterNumber,
  });

  // Fetch student enrollments when student is selected
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery<any[]>({
    queryKey: ["student-enrollments", selectedStudent?.id],
    queryFn: () => fetchStudentSubjectEnrollments(selectedStudent?.id),
    enabled: !!selectedStudent?.id,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch student invoices
  const { data: invoices } = useQuery<any[]>({
    queryKey: ["student-invoices", selectedStudent?.id],
    queryFn: () => fetchStudentInvoices(selectedStudent?.id),
    enabled: !!selectedStudent?.id,
  });

  // Fetch applicable fees for preview
  const { data: applicableFees } = useQuery<any[]>({
    queryKey: ["applicable-fees", selectedDepartment, selectedSemesterNumber, selectedStudent?.year, selectedStudent?.nationality],
    queryFn: () => fetchApplicableFees(
      selectedDepartment,
      selectedSemesterNumber!,
      0,
      selectedStudent?.year || 1,
      selectedStudent?.nationality || ''
    ),
    enabled: !!selectedDepartment && !!selectedSemesterNumber && !!selectedStudent,
  });

  const filteredStudents = useMemo(() => {
    if (!shouldSearchStudents || !searchedStudents) return [];
    return searchedStudents;
  }, [shouldSearchStudents, searchedStudents]);

  const selectedDepartmentData = useMemo(() => {
    if (!departments || !selectedDepartment) return null;
    return departments.find((department) => department.id === selectedDepartment) || null;
  }, [departments, selectedDepartment]);

  const isVisualArtsDigitalMediaDepartment = useMemo(() => {
    if (!selectedDepartmentData) return false;

    return (
      selectedDepartmentData.name === "قسم الفنون البصرية والإعلام الرقمي" ||
      selectedDepartmentData.name_en === "Department of Visual Arts and Digital Media"
    );
  }, [selectedDepartmentData]);

  const requiresTrackSelection =
    isVisualArtsDigitalMediaDepartment && (selectedSemesterNumber || 0) >= 5;

  const effectiveSpecializationTrack =
    selectedStudent?.specialization_track || specializationTrack || "";

  const trackAwareCurriculum = useMemo<CurriculumItem[]>(() => {
    if (!curriculum) return [];

    if (!requiresTrackSelection) {
      return curriculum;
    }

    if (!effectiveSpecializationTrack) {
      return [];
    }

    const prefixes = [
      ...(TRACK_PREFIXES[effectiveSpecializationTrack] || []),
      ...SHARED_TRACK_PREFIXES,
    ];

    return curriculum.filter((item) =>
      prefixes.some((prefix) => String(item.code || "").startsWith(prefix))
    );
  }, [
    curriculum,
    requiresTrackSelection,
    effectiveSpecializationTrack,
    TRACK_PREFIXES,
    SHARED_TRACK_PREFIXES,
  ]);

  React.useEffect(() => {
    if (!trackAwareCurriculum.length) {
      setSelectedSubjects([]);
      return;
    }

    const allowedSubjectIds = new Set(trackAwareCurriculum.map((item) => item.id));
    setSelectedSubjects((previous) => previous.filter((subjectId) => allowedSubjectIds.has(subjectId)));
  }, [trackAwareCurriculum]);

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

  // Create a map of subject ID to enrollment data for payment status
  const enrollmentMap = useMemo(() => {
    if (!enrollments) return new Map();
    console.log('🔍 Building enrollmentMap from enrollments:', enrollments);
    const map = new Map();
    enrollments.forEach(enrollment => {
      const subjectId = enrollment.subject_id || enrollment.subjects?.id;
      if (subjectId) {
        console.log(`📝 Mapping subject ${subjectId}:`, {
          payment_status: enrollment.payment_status,
          attendance_allowed: enrollment.attendance_allowed,
          invoice_id: enrollment.invoice_id
        });
        map.set(subjectId, enrollment);
      }
    });
    console.log('✅ enrollmentMap created with', map.size, 'entries');
    return map;
  }, [enrollments]);

  const availableCost = useMemo(() => {
    console.log('🔍 Curriculum data:', trackAwareCurriculum);
    console.log('🔍 Curriculum length:', trackAwareCurriculum?.length);
    if (!trackAwareCurriculum) return 0;
    return trackAwareCurriculum
      .filter(item => !enrolledSubjects.includes(item.id))
      .reduce((sum, item) => sum + ((item.credits || 0) * (item.cost_per_credit || 0)), 0);
  }, [trackAwareCurriculum, enrolledSubjects]);

  const selectedCost = useMemo(() => {
    if (!trackAwareCurriculum) return 0;
    return selectedSubjects.reduce((sum, subjectId) => {
      const item = trackAwareCurriculum.find(c => c.id === subjectId);
      return sum + ((item?.credits || 0) * (item?.cost_per_credit || 0));
    }, 0);
  }, [selectedSubjects, trackAwareCurriculum]);

  // Calculate total credits for selected subjects
  const selectedCredits = useMemo(() => {
    if (!trackAwareCurriculum) return 0;
    return selectedSubjects.reduce((sum, subjectId) => {
      const item = trackAwareCurriculum.find(c => c.id === subjectId);
      return sum + (item?.credits || 0);
    }, 0);
  }, [selectedSubjects, trackAwareCurriculum]);

  // Calculate additional fees total
  const additionalFeesTotal = useMemo(() => {
    if (!applicableFees || !Array.isArray(applicableFees)) return 0;
    return applicableFees.reduce((sum: number, fee: any) => {
      let amount = Number(fee.amount) || 0;
      if (fee.frequency === 'per_credit') {
        amount = amount * selectedCredits;
      }
      return sum + amount;
    }, 0);
  }, [applicableFees, selectedCredits]);

  const grandTotal = selectedCost + additionalFeesTotal;

  const handleStudentSelect = (student: any) => {
    console.log('🔍 Student selected:', student);
    console.log('🔍 Student department_id:', student.department_id);
    setSelectedStudent(student);
    setSelectedDepartment(student.department_id);
    setSpecializationTrack(student?.specialization_track || "");
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
    if (!trackAwareCurriculum) return;
    const availableSubjects = trackAwareCurriculum.filter(item => !enrolledSubjects.includes(item.id));
    if (selectedSubjects.length === availableSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(availableSubjects.map(item => item.id));
    }
  };

  const handleSelectRequired = () => {
    if (!trackAwareCurriculum) return;
    const requiredSubjects = trackAwareCurriculum
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

    if (requiresTrackSelection && !effectiveSpecializationTrack) {
      alert("يرجى اختيار مسار التخصص أولاً قبل تسجيل مقررات الفصل الخامس فما فوق.");
      return;
    }

    try {
      const result = await enrollStudentInSubjects(
        selectedStudent.id,
        selectedSubjects,
        studySemester, // semester_id
        semesters?.find(s => s.id === studySemester)?.study_year_id || semesters?.find(s => s.id === studySemester)?.studyYear?.id || '', // study_year_id
        selectedDepartment,
        selectedSemesterNumber,
        isPaying,
        effectiveSpecializationTrack || undefined
      );

      if (requiresTrackSelection && effectiveSpecializationTrack && !selectedStudent?.specialization_track) {
        setSelectedStudent((previous: any) => ({
          ...previous,
          specialization_track: effectiveSpecializationTrack,
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["student-subject-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["student-invoices"] });
      
      const selectedSemesterName = semesters?.find(s => s.id === studySemester)?.name || studySemester;
      
      // Show detailed success message
      const paymentStatus = isPaying ? ' وتم تسجيل الدفع الكامل' : ' وتم إنشاء الفاتورة';
      if (result.skippedSubjects && result.skippedSubjects.length > 0) {
        alert(`تم تسجيل الطالب في ${formatNumber(result.enrolledSubjects.length)} مقرر جديد للفصل الدراسي ${toLatinDigits(selectedSemesterName)} - ${toLatinDigits(academicYear)}${paymentStatus}. تم تجاهل ${formatNumber(result.skippedSubjects.length)} مقرر مسجل مسبقاً.`);
      } else {
        alert(`تم تسجيل الطالب في جميع المقررات بنجاح للفصل الدراسي ${toLatinDigits(selectedSemesterName)} - ${toLatinDigits(academicYear)}${paymentStatus}`);
      }
      
      setSelectedSubjects([]); // Clear selected subjects after registration
      setStudySemester(""); // Clear study semester
      setAcademicYear(""); // Clear academic year
      setIsPaying(false); // Reset payment checkbox
    } catch (error: any) {
      const formattedError = formatRegistrationError(error as APIClientError);
      alert(`خطأ في تسجيل الطالب:\n${formattedError}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">تسجيل الطلاب في الفصل الدراسي</h1>
        <p className="text-sm text-slate-600">اختر الطالب أولاً ثم أكمل بيانات التسجيل والمقررات بطريقة منظمة وواضحة.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Student Selection */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:sticky lg:top-24">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">اختيار الطالب</h3>
                <p className="mt-1 text-sm text-slate-500">لن تظهر النتائج إلا بعد البحث باسم الطالب أو بريده أو رقم هويته.</p>
              </div>
              {selectedStudent && (
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setSelectedSemesterNumber(null);
                    setSelectedSubjects([]);
                    setStudySemester("");
                    setAcademicYear("");
                    setIsPaying(false);
                  }}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                  title="إلغاء اختيار الطالب"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {selectedStudent && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 shadow-sm">
                    {(selectedStudent.name || "ط").trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{selectedStudent.name}</p>
                    <p className="truncate text-xs text-slate-500">{selectedStudent.email || "لا يوجد بريد إلكتروني"}</p>
                    <p className="mt-1 text-xs text-slate-400">{toLatinDigits(selectedStudent.national_id_passport || "")}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن الطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {trimmedSearchTerm.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
                  <Users className="mx-auto h-9 w-9 text-slate-300" />
                  <h4 className="mt-3 text-sm font-medium text-slate-900">ابدأ بالبحث عن طالب</h4>
                  <p className="mt-1 text-sm text-slate-500">اكتب الاسم أو البريد الإلكتروني أو رقم الهوية لإظهار النتائج.</p>
                </div>
              ) : trimmedSearchTerm.length < 2 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  اكتب حرفين على الأقل لعرض نتائج البحث.
                </div>
              ) : searchingStudents ? (
                <div className="rounded-xl border border-slate-200 px-4 py-8 text-center">
                  <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"></div>
                  <p className="text-sm text-slate-500">جاري البحث عن الطلاب...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <h4 className="mt-3 text-sm font-medium text-slate-900">لا توجد نتائج</h4>
                  <p className="mt-1 text-sm text-slate-500">لم يتم العثور على طلاب مطابقين لعبارة البحث الحالية.</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleStudentSelect(student)}
                    className={`w-full rounded-xl border p-3 text-right transition ${
                      selectedStudent?.id === student.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{student.email || 'لا يوجد بريد إلكتروني'}</div>
                    <div className="mt-1 text-xs text-slate-400">{toLatinDigits(student.national_id_passport)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div>
          {selectedStudent ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">معلومات الطالب</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full border border-slate-200">
                    {selectedStudent.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">الاسم</label>
                    <p className="text-slate-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">البريد الإلكتروني</label>
                    <p className="text-slate-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">رقم الهوية</label>
                    <p className="text-slate-900">{toLatinDigits(selectedStudent.national_id_passport)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">القسم</label>
                    <p className="text-slate-900">
                      {departments?.find(d => d.id === selectedStudent.department_id)?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Semester Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">اختيار الفصل الدراسي</h3>
                <select
                  value={selectedSemesterNumber || ""}
                  onChange={(e) => setSelectedSemesterNumber(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-slate-400"
                >
                  <option value="">اختر الفصل الدراسي</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(semesterNumber => (
                    <option key={semesterNumber} value={semesterNumber}>
                      الفصل الدراسي {formatNumber(semesterNumber)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Study Semester and Academic Year */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-medium text-slate-600 mb-4">معلومات التسجيل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      السنة الأكاديمية
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-900">مقررات الفصل الدراسي</h3>
                    <div className="flex items-center gap-4">
                      {selectedSubjects.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-slate-700" />
                          <span className="text-lg font-bold text-slate-900">
                            {formatCurrency(selectedCost)}
                          </span>
                          <span className="text-sm text-slate-500">
                            ({formatNumber(selectedSubjects.length)} مقرر)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-slate-500" />
                        <span className="text-lg font-bold text-slate-700">
                          {formatCurrency(availableCost)}
                        </span>
                        <span className="text-sm text-slate-500">(متاح)</span>
                      </div>
                    </div>
                  </div>

                  {requiresTrackSelection && (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-900">مسار التخصص (إجباري من الفصل الخامس)</h4>
                        {effectiveSpecializationTrack && (
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                            {TRACK_LABELS[effectiveSpecializationTrack] || effectiveSpecializationTrack}
                          </span>
                        )}
                      </div>

                      <select
                        value={effectiveSpecializationTrack}
                        onChange={(e) => setSpecializationTrack(e.target.value)}
                        disabled={!!selectedStudent?.specialization_track}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="">اختر مسار التخصص</option>
                        {Object.entries(TRACK_LABELS).map(([trackKey, trackLabel]) => (
                          <option key={trackKey} value={trackKey}>
                            {trackLabel}
                          </option>
                        ))}
                      </select>

                      {selectedStudent?.specialization_track && (
                        <p className="mt-2 text-xs text-slate-500">المسار مثبت للطالب ولا يمكن تغييره من شاشة التسجيل.</p>
                      )}
                    </div>
                  )}

                  {/* Registration Info */}
                  {(studySemester || academicYear) && (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">معلومات التسجيل:</span>
                        {studySemester && (
                          <span className="px-2.5 py-1 bg-white text-slate-700 text-xs rounded-full border border-slate-200">
                            {semesters?.find(s => s.id === studySemester)?.name || studySemester}
                          </span>
                        )}
                        {academicYear && (
                          <span className="px-2.5 py-1 bg-white text-slate-700 text-xs rounded-full border border-slate-200">
                            {academicYear}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enrollment Summary */}
                  {trackAwareCurriculum && trackAwareCurriculum.length > 0 && (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-700">
                              مسجل مسبقاً: {loadingEnrollments ? 'جاري التحميل...' : `${formatNumber(trackAwareCurriculum.filter((item) => enrolledSubjects.includes(item.id)).length)} مقرر`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-700">
                              متاح للتسجيل: {loadingEnrollments ? 'جاري التحميل...' : `${formatNumber(trackAwareCurriculum.filter((item) => !enrolledSubjects.includes(item.id)).length)} مقرر`}
                            </span>
                          </div>
                        </div>
                        <div>
                          إجمالي المقررات: {formatNumber(trackAwareCurriculum.length)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selection Buttons */}
                  {trackAwareCurriculum && trackAwareCurriculum.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                        disabled={trackAwareCurriculum.filter((item) => !enrolledSubjects.includes(item.id)).length === 0}
                      >
                        {selectedSubjects.length === trackAwareCurriculum.filter((item) => !enrolledSubjects.includes(item.id)).length ? 'إلغاء الكل' : `اختيار الكل المتاح (${formatNumber(trackAwareCurriculum.filter((item) => !enrolledSubjects.includes(item.id)).length)})`}
                      </button>
                      <button
                        onClick={handleSelectRequired}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                        disabled={trackAwareCurriculum.filter((item) => !enrolledSubjects.includes(item.id) && item.is_required).length === 0}
                      >
                        اختيار المطلوبة المتاحة فقط ({formatNumber(trackAwareCurriculum.filter((item) => !enrolledSubjects.includes(item.id) && item.is_required).length)})
                      </button>
                    </div>
                  )}

                  {loadingCurriculum ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-slate-700 mb-2"></div>
                      <p className="text-slate-600">جاري تحميل المقررات...</p>
                    </div>
                  ) : trackAwareCurriculum && trackAwareCurriculum.length > 0 ? (
                    <div className="space-y-3">
                      {trackAwareCurriculum.map((item) => {
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
                            className={`p-4 rounded-xl border transition-colors ${
                              isEnrolled
                                ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                                : isSelected
                                ? 'border-slate-900 bg-slate-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {isAvailable ? (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSubjectToggle(item.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                  />
                                ) : (
                                  <div className="h-4 w-4 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className={`h-4 w-4 ${isEnrolled ? 'text-slate-400' : 'text-slate-500'}`} />
                                    <span className={`font-medium ${isEnrolled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                      {item.code} - {item.name}
                                    </span>
                                    {item.is_required && (
                                      <span className="px-2.5 py-1 bg-slate-900 text-white text-xs rounded-full">
                                        مطلوب
                                      </span>
                                    )}
                                    {isEnrolled && (() => {
                                      const enrollment = enrollmentMap.get(item.id);
                                      const paymentStatus = enrollment?.payment_status || 'unpaid';
                                      const attendanceAllowed = enrollment?.attendance_allowed || false;
                                      
                                      console.log(`🎨 Rendering badges for subject ${item.id} (${item.name}):`, {
                                        enrollment,
                                        paymentStatus,
                                        attendanceAllowed,
                                        hasEnrollment: !!enrollment
                                      });
                                      
                                      return (
                                        <>
                                          <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                            <CheckCircle className="h-3 w-3" />
                                            مسجل مسبقاً
                                          </span>
                                          {paymentStatus === 'paid' && (
                                            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                              <CheckCircle className="h-3 w-3" />
                                              مدفوع
                                            </span>
                                          )}
                                          {paymentStatus === 'partial' && (
                                            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                              <AlertCircle className="h-3 w-3" />
                                              مدفوع جزئياً
                                            </span>
                                          )}
                                          {paymentStatus === 'unpaid' && (
                                            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                              <AlertCircle className="h-3 w-3" />
                                              غير مدفوع
                                            </span>
                                          )}
                                          {!attendanceAllowed && (
                                            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                              <X className="h-3 w-3" />
                                              غير مسموح بالحضور
                                            </span>
                                          )}
                                        </>
                                      );
                                    })()}
                                    {isAvailable && !isSelected && (
                                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full border border-slate-200">
                                        متاح للتسجيل
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="px-2.5 py-1 bg-slate-900 text-white text-xs rounded-full">
                                        مختار
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-sm mt-1 ${isEnrolled ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {formatNumber(item.credits || 0)} ساعة معتمدة
                                    {isEnrolled && ' - مسجل مسبقاً'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${isEnrolled ? 'text-slate-500' : 'text-slate-900'}`}>
                                  {formatCurrency((item.credits || 0) * (item.cost_per_credit || 0))}
                                </div>
                                <div className={`text-sm ${isEnrolled ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {formatNumber(item.cost_per_credit || 0)} دينار/ساعة
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
                      {requiresTrackSelection && !effectiveSpecializationTrack ? (
                        <>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">اختر مسار التخصص أولاً</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            لعرض مقررات الفصل الحالي، يجب تحديد مسار الطالب في قسم الفنون البصرية والإعلام الرقمي.
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مقررات</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            لم يتم تحديد مقررات لهذا القسم والفصل الدراسي
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Applicable Fees Preview + Payment Option */}
                  {selectedSubjects.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {/* Fee Breakdown */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-slate-600" />
                          ملخص التكاليف
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">رسوم المقررات ({formatNumber(selectedSubjects.length)} مقرر - {formatNumber(selectedCredits)} ساعة)</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(selectedCost)}</span>
                          </div>

                          {/* Additional Fees from Fee Rules */}
                          {applicableFees && Array.isArray(applicableFees) && applicableFees.length > 0 && (
                            <>
                              <div className="border-t border-slate-200 pt-2 mt-2">
                                <div className="flex items-center gap-1 text-slate-500 mb-1">
                                  <Layers className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">رسوم إضافية (حسب هيكل الرسوم)</span>
                                </div>
                              </div>
                              {applicableFees.map((fee: any, idx: number) => {
                                let feeAmount = Number(fee.amount) || 0;
                                const isPerCredit = fee.frequency === 'per_credit';
                                if (isPerCredit) feeAmount = feeAmount * selectedCredits;
                                return (
                                  <div key={idx} className="flex justify-between text-slate-700">
                                    <span className="flex items-center gap-1">
                                      {fee.name_ar || fee.name}
                                      {isPerCredit && <span className="text-xs text-slate-400">({formatNumber(selectedCredits)} ساعة × {formatNumber(Number(fee.amount))})</span>}
                                    </span>
                                    <span className="font-medium">{formatCurrency(feeAmount)}</span>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2 mt-2">
                            <span className="text-slate-900">الإجمالي المتوقع</span>
                            <span className="text-slate-900">{formatCurrency(grandTotal)}</span>
                          </div>
                        </div>

                        {applicableFees && Array.isArray(applicableFees) && applicableFees.length > 0 && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600">
                            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>الرسوم الإضافية تُطبق تلقائياً حسب هيكل الرسوم المعتمد. الرسوم التي سبق تحصيلها لن تُضاف مجدداً.</span>
                          </div>
                        )}
                      </div>

                      {/* Payment Checkbox */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPaying}
                            onChange={(e) => setIsPaying(e.target.checked)}
                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">الدفع عند التسجيل</div>
                            <div className="text-sm text-slate-600">
                              {isPaying ? (
                                <span className="text-slate-700">سيتم تسجيل الدفع الكامل ({formatCurrency(grandTotal)})</span>
                              ) : (
                                <span>سيتم إنشاء فاتورة بحالة "غير مدفوع"</span>
                              )}
                            </div>
                          </div>
                          {isPaying && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900">{formatNumber(grandTotal)}</div>
                              <div className="text-xs text-slate-500">دينار</div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleRegisterStudent}
                      disabled={selectedSubjects.length === 0 || !studySemester || !academicYear}
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {isPaying ? 'تسجيل ودفع' : 'تسجيل المقررات المختارة'} ({formatNumber(selectedSubjects.length)})
                    </button>
                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      disabled={!invoices || invoices.length === 0}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      عرض الفواتير
                    </button>
                  </div>
                </div>
              )}

              {/* Current Enrollments */}
              {enrollments && enrollments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">المقررات المسجلة حالياً</h3>
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div>
                          <span className="font-medium">{enrollment.subjects?.code} - {enrollment.subjects?.name}</span>
                          <span className={`ml-2 rounded-full border px-2 py-1 text-xs ${
                            'border-slate-200 bg-white text-slate-700'
                          }`}>
                            {enrollment.payment_status === 'paid' ? 'مدفوع' :
                             enrollment.payment_status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(Number(enrollment.subject_cost) || 0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">اختر طالباً للبدء</h3>
              <p className="mt-2 text-sm text-slate-500">
                ابحث عن الطالب من اللوحة الجانبية ثم تابع خطوات التسجيل والمقررات من هنا.
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
                      <h4 className="font-medium text-gray-900">فاتورة #{toLatinDigits(invoice.invoice_number)}</h4>
                      <p className="text-sm text-gray-500">{invoice.semesters?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(Number(invoice.total_amount) || 0)}
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-xs ${
                        'border-slate-200 bg-white text-slate-700'
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
                        <span>{formatCurrency(Number(item.total_price) || 0)}</span>
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
