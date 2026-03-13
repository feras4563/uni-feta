import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudents,
  fetchDepartments,
  fetchSemesters,
  fetchStudyYears,
  evaluateStudent,
  promoteStudent,
  fetchRetakeableSubjects,
  enrollRetakeSubjects,
  bulkEvaluateStudents,
  bulkPromoteStudents,
} from "@/lib/jwt-api";
import {
  Search,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  ArrowUpCircle,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  GraduationCap,
  RotateCcw,
  Info,
} from "lucide-react";

const STANDING_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  good_standing: { label: "وضع أكاديمي جيد", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: <CheckCircle className="h-4 w-4" /> },
  deans_list: { label: "قائمة العميد", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: <Award className="h-4 w-4" /> },
  probation: { label: "إنذار أكاديمي", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <AlertTriangle className="h-4 w-4" /> },
  dismissed: { label: "مفصول أكاديمياً", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <XCircle className="h-4 w-4" /> },
};

export default function AcademicProgression() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<any>(null);

  const trimmedSearch = searchTerm.trim();
  const shouldSearch = trimmedSearch.length >= 2;

  const { data: students, isFetching: searchingStudents } = useQuery<any[]>({
    queryKey: ["students", "search", trimmedSearch],
    queryFn: () => fetchStudents(trimmedSearch),
    enabled: shouldSearch,
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: semesters } = useQuery<any[]>({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: studyYears } = useQuery<any[]>({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  // Evaluation query for the expanded student
  const { data: evaluation, isLoading: evaluating, refetch: refetchEvaluation } = useQuery({
    queryKey: ["student-evaluation", expandedStudent],
    queryFn: () => evaluateStudent(expandedStudent!),
    enabled: !!expandedStudent,
  });

  // Retakeable subjects query
  const { data: retakeableSubjects, isLoading: loadingRetakeable } = useQuery({
    queryKey: ["retakeable-subjects", selectedStudent?.id],
    queryFn: () => fetchRetakeableSubjects(selectedStudent?.id),
    enabled: !!selectedStudent?.id && showRetakeModal,
  });

  // Promote mutation
  const promoteMutation = useMutation({
    mutationFn: (studentId: string) => promoteStudent(studentId),
    onSuccess: (data: any) => {
      if (data.promoted) {
        alert(`تمت ترقية الطالب للفصل ${data.new_semester} بنجاح`);
      } else {
        alert(`لا يمكن ترقية الطالب: ${data.reason}`);
      }
      queryClient.invalidateQueries({ queryKey: ["student-evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      alert("فشل في ترقية الطالب: " + error.message);
    },
  });

  // Bulk evaluate mutation
  const bulkEvalMutation = useMutation({
    mutationFn: (deptId?: string) => bulkEvaluateStudents(deptId),
    onSuccess: (data: any) => {
      setBulkMessage({
        type: "evaluate",
        ...data,
      });
      queryClient.invalidateQueries({ queryKey: ["student-evaluation"] });
    },
    onError: (error: any) => {
      alert("فشل في التقييم الجماعي: " + error.message);
    },
  });

  // Bulk promote mutation
  const bulkPromoteMutation = useMutation({
    mutationFn: (deptId?: string) => bulkPromoteStudents(deptId),
    onSuccess: (data: any) => {
      setBulkMessage({
        type: "promote",
        ...data,
      });
      queryClient.invalidateQueries({ queryKey: ["student-evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      alert("فشل في الترقية الجماعية: " + error.message);
    },
  });

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!shouldSearch && !departmentFilter) return [];
    let filtered = students;
    if (departmentFilter) {
      filtered = filtered.filter((s: any) => s.department_id === departmentFilter);
    }
    return filtered;
  }, [students, shouldSearch, departmentFilter]);

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setExpandedStudent(student.id);
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-blue-700";
    if (gpa >= 2.0) return "text-green-700";
    if (gpa >= 1.0) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-blue-600" />
                الترقية الأكاديمية
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                تقييم وترقية الطلاب وإعادة تسجيل المقررات الراسبة
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm("هل تريد تقييم جميع الطلاب النشطين" + (departmentFilter ? " في هذا القسم" : "") + "؟")) {
                    bulkEvalMutation.mutate(departmentFilter || undefined);
                  }
                }}
                disabled={bulkEvalMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {bulkEvalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                تقييم جماعي
              </button>
              <button
                onClick={() => {
                  if (confirm("هل تريد ترقية جميع الطلاب المؤهلين" + (departmentFilter ? " في هذا القسم" : "") + "؟ سيتم ترقية فقط الطلاب المستوفين للشروط.")) {
                    bulkPromoteMutation.mutate(departmentFilter || undefined);
                  }
                }}
                disabled={bulkPromoteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {bulkPromoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                ترقية جماعية
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bulk Operation Result */}
        {bulkMessage && (
          <div className={`mb-6 rounded-lg border p-4 ${bulkMessage.type === "evaluate" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-medium ${bulkMessage.type === "evaluate" ? "text-amber-800" : "text-blue-800"}`}>
                  {bulkMessage.type === "evaluate" ? "نتائج التقييم الجماعي" : "نتائج الترقية الجماعية"}
                </h3>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">إجمالي الطلاب:</span>
                    <span className="font-medium mr-1">{bulkMessage.total}</span>
                  </div>
                  {bulkMessage.type === "evaluate" ? (
                    <>
                      <div>
                        <span className="text-gray-600">تم تقييمهم:</span>
                        <span className="font-medium mr-1">{bulkMessage.evaluated}</span>
                      </div>
                      <div>
                        <span className="text-amber-700">إنذار:</span>
                        <span className="font-medium mr-1">{bulkMessage.on_probation}</span>
                      </div>
                      <div>
                        <span className="text-red-700">مفصولون:</span>
                        <span className="font-medium mr-1">{bulkMessage.dismissed}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-green-700">تمت ترقيتهم:</span>
                        <span className="font-medium mr-1">{bulkMessage.promoted}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">غير مؤهلين:</span>
                        <span className="font-medium mr-1">{bulkMessage.not_eligible}</span>
                      </div>
                    </>
                  )}
                </div>
                {bulkMessage.errors?.length > 0 && (
                  <p className="mt-2 text-xs text-red-600">أخطاء: {bulkMessage.errors.length}</p>
                )}
              </div>
              <button onClick={() => setBulkMessage(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">البحث عن طالب</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">اسم أو رقم الطالب</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="ابحث بالاسم أو الرقم الجامعي أو البريد..."
                />
                {searchingStudents && (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">القسم</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">جميع الأقسام</option>
                {departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        {!shouldSearch && !departmentFilter ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">ابحث عن طالب لتقييم وضعه الأكاديمي</h3>
            <p className="mt-2 text-sm text-gray-500">أدخل اسم الطالب أو رقمه الجامعي أو اختر القسم</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد نتائج</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student: any) => (
              <StudentEvaluationCard
                key={student.id}
                student={student}
                isExpanded={expandedStudent === student.id}
                evaluation={expandedStudent === student.id ? evaluation : null}
                evaluating={expandedStudent === student.id && evaluating}
                onToggle={() => {
                  if (expandedStudent === student.id) {
                    setExpandedStudent(null);
                  } else {
                    handleSelectStudent(student);
                  }
                }}
                onPromote={() => {
                  if (confirm(`هل تريد ترقية الطالب ${student.name}؟`)) {
                    promoteMutation.mutate(student.id);
                  }
                }}
                onRefresh={() => refetchEvaluation()}
                onRetake={() => {
                  setSelectedStudent(student);
                  setShowRetakeModal(true);
                }}
                promoting={promoteMutation.isPending}
                getGPAColor={getGPAColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Retake Modal */}
      {showRetakeModal && selectedStudent && (
        <RetakeModal
          student={selectedStudent}
          retakeableSubjects={retakeableSubjects || []}
          loading={loadingRetakeable}
          semesters={semesters || []}
          studyYears={studyYears || []}
          onClose={() => setShowRetakeModal(false)}
          onSuccess={() => {
            setShowRetakeModal(false);
            queryClient.invalidateQueries({ queryKey: ["student-evaluation"] });
            queryClient.invalidateQueries({ queryKey: ["retakeable-subjects"] });
          }}
        />
      )}
    </div>
  );
}

function StudentEvaluationCard({
  student,
  isExpanded,
  evaluation,
  evaluating,
  onToggle,
  onPromote,
  onRefresh,
  onRetake,
  promoting,
  getGPAColor,
}: {
  student: any;
  isExpanded: boolean;
  evaluation: any;
  evaluating: boolean;
  onToggle: () => void;
  onPromote: () => void;
  onRefresh: () => void;
  onRetake: () => void;
  promoting: boolean;
  getGPAColor: (gpa: number) => string;
}) {
  const standing = evaluation?.academic_standing
    ? STANDING_CONFIG[evaluation.academic_standing] || STANDING_CONFIG.good_standing
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {student.name?.charAt(0) || "ط"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{student.name}</div>
            <div className="text-xs text-gray-500">
              {student.campus_id} · {student.department?.name || student.department?.name_en || "-"}
              {student.year ? ` · السنة ${student.year}` : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {evaluation && standing && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${standing.bg} ${standing.text} ${standing.border}`}>
              {standing.icon}
              {standing.label}
            </span>
          )}
          {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-5">
          {evaluating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <span className="mr-2 text-sm text-gray-600">جاري التقييم...</span>
            </div>
          ) : evaluation ? (
            <div className="space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">المعدل التراكمي</div>
                  <div className={`text-xl font-bold ${getGPAColor(evaluation.gpa)}`}>
                    {Number(evaluation.gpa).toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">الساعات المكتسبة</div>
                  <div className="text-xl font-bold text-gray-800">{evaluation.credits_earned}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">الفصل الحالي</div>
                  <div className="text-xl font-bold text-gray-800">{evaluation.current_semester}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">مقررات راسبة</div>
                  <div className={`text-xl font-bold ${evaluation.failed_subjects_count > 0 ? "text-red-600" : "text-green-600"}`}>
                    {evaluation.failed_subjects_count}
                  </div>
                </div>
              </div>

              {/* Failed Subjects */}
              {evaluation.failed_subjects?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    المقررات الراسبة
                  </h4>
                  <div className="space-y-1">
                    {evaluation.failed_subjects.map((sub: any) => (
                      <div key={sub.enrollment_id} className="flex items-center justify-between text-sm">
                        <span className="text-red-700">
                          {sub.subject_code} - {sub.subject_name}
                        </span>
                        <span className="text-red-600 font-medium">
                          {sub.grade != null ? `${Number(sub.grade).toFixed(0)}%` : "-"} · {sub.credits} س.م
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion Status */}
              <div className={`rounded-lg p-4 border ${evaluation.can_promote ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {evaluation.can_promote ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Info className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${evaluation.can_promote ? "text-green-800" : "text-gray-600"}`}>
                      {evaluation.can_promote ? "مؤهل للترقية للفصل التالي" : "غير مؤهل للترقية حالياً"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onPromote}
                  disabled={!evaluation.can_promote || promoting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                  ترقية الطالب
                </button>
                {evaluation.failed_subjects_count > 0 && (
                  <button
                    onClick={onRetake}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="h-4 w-4" />
                    إعادة تسجيل مقررات
                  </button>
                )}
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة تقييم
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">لا توجد بيانات تقييم</div>
          )}
        </div>
      )}
    </div>
  );
}

function RetakeModal({
  student,
  retakeableSubjects,
  loading,
  semesters,
  studyYears,
  onClose,
  onSuccess,
}: {
  student: any;
  retakeableSubjects: any[];
  loading: boolean;
  semesters: any[];
  studyYears: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [studyYearId, setStudyYearId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState<number>(1);
  const [isPaying, setIsPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSemester = semesters?.find((s: any) => s.is_current);

  React.useEffect(() => {
    if (currentSemester) {
      setSemesterId(currentSemester.id);
      setStudyYearId(currentSemester.study_year_id);
    }
  }, [currentSemester]);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      setError("يجب اختيار مقرر واحد على الأقل");
      return;
    }
    if (!semesterId || !studyYearId) {
      setError("يجب تحديد الفصل الدراسي والسنة الدراسية");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await enrollRetakeSubjects(
        student.id,
        selectedSubjects,
        semesterId,
        studyYearId,
        student.department_id,
        semesterNumber,
        isPaying
      );
      alert("تم تسجيل الطالب في مقررات الإعادة بنجاح");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "فشل في تسجيل مقررات الإعادة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              إعادة تسجيل مقررات راسبة
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{student.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Semester Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">الفصل الدراسي</label>
              <select
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  const sem = semesters.find((s: any) => s.id === e.target.value);
                  if (sem?.study_year_id) setStudyYearId(sem.study_year_id);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">اختر الفصل</option>
                {semesters.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}{s.is_current ? " (الحالي)" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">السنة الدراسية</label>
              <select
                value={studyYearId}
                onChange={(e) => setStudyYearId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">اختر السنة</option>
                {studyYears.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">رقم الفصل</label>
              <input
                type="number"
                value={semesterNumber}
                onChange={(e) => setSemesterNumber(parseInt(e.target.value))}
                min={1}
                max={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Payment */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaying}
              onChange={(e) => setIsPaying(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">الدفع عند التسجيل</span>
          </label>

          {/* Retakeable Subjects */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              المقررات القابلة لإعادة التسجيل
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="mr-2 text-sm text-gray-600">جاري التحميل...</span>
              </div>
            ) : retakeableSubjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                لا توجد مقررات راسبة قابلة لإعادة التسجيل
              </div>
            ) : (
              <div className="space-y-2">
                {retakeableSubjects.map((sub: any) => (
                  <label
                    key={sub.subject_id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSubjects.includes(sub.subject_id)
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(sub.subject_id)}
                        onChange={() => toggleSubject(sub.subject_id)}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sub.subject_code} - {sub.subject_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sub.credits} ساعات معتمدة · الفصل {sub.semester_number}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-red-600 font-medium">
                      {sub.failed_grade != null ? `${Number(sub.failed_grade).toFixed(0)}%` : "راسب"}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedSubjects.length === 0}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? "جاري التسجيل..." : `تسجيل إعادة (${selectedSubjects.length} مقرر)`}
          </button>
        </div>
      </div>
    </div>
  );
}
