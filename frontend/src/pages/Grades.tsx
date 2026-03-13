import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSemesters,
  fetchDepartments,
  fetchGradeSummary,
  fetchStudents,
  evaluateStudent,
  promoteStudent,
  fetchRetakeableSubjects,
  enrollRetakeSubjects,
  bulkEvaluateStudents,
  bulkPromoteStudents,
  fetchStudyYears,
  exportGrades,
} from "@/lib/jwt-api";
import {
  GraduationCap,
  TrendingUp,
  Award,
  BarChart3,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  RefreshCw,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Info,
  Users,
  Download,
} from "lucide-react";

const STANDING_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  good_standing: { label: "وضع جيد", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  deans_list: { label: "قائمة العميد", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: <Award className="h-3.5 w-3.5" /> },
  probation: { label: "إنذار أكاديمي", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  dismissed: { label: "مفصول", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
};

type TabKey = "overview" | "progression";

export default function Grades() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: semesters } = useQuery<any[]>({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  // Auto-select current semester
  useEffect(() => {
    if (semesters && !selectedSemester) {
      const current = semesters.find((s: any) => s.is_current);
      if (current) setSelectedSemester(current.id);
    }
  }, [semesters, selectedSemester]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-blue-600" />
                الدرجات والتقييم
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                نتائج الطلاب والترقية الأكاديمية وإعادة التسجيل
              </p>
            </div>
            <button
              onClick={() => {
                const params: Record<string, string> = {};
                if (selectedSemester) params.semester_id = selectedSemester;
                if (selectedDepartment) params.department_id = selectedDepartment;
                exportGrades(params);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              تصدير CSV
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="h-4 w-4 inline-block ml-1.5 -mt-0.5" />
              نتائج الدرجات
            </button>
            <button
              onClick={() => setActiveTab("progression")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "progression"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <TrendingUp className="h-4 w-4 inline-block ml-1.5 -mt-0.5" />
              الترقية الأكاديمية
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" ? (
          <GradeOverviewTab
            semesters={semesters || []}
            departments={departments || []}
            selectedSemester={selectedSemester}
            setSelectedSemester={setSelectedSemester}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        ) : (
          <ProgressionTab
            semesters={semesters || []}
            departments={departments || []}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB 1 — Grade Overview (real data)
   ═══════════════════════════════════════════════ */

function GradeOverviewTab({
  semesters, departments,
  selectedSemester, setSelectedSemester,
  selectedDepartment, setSelectedDepartment,
  statusFilter, setStatusFilter,
  searchTerm, setSearchTerm,
}: {
  semesters: any[]; departments: any[];
  selectedSemester: string; setSelectedSemester: (v: string) => void;
  selectedDepartment: string; setSelectedDepartment: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  searchTerm: string; setSearchTerm: (v: string) => void;
}) {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["grade-summary", selectedSemester, selectedDepartment],
    queryFn: () => fetchGradeSummary(selectedSemester, selectedDepartment || undefined),
    enabled: !!selectedSemester,
  });

  const rows: any[] = (summary as any)?.rows || [];
  const stats: any = (summary as any)?.stats || {};

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter) {
      result = result.filter((r: any) => r.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((r: any) =>
        r.student_name?.toLowerCase().includes(q) ||
        r.student_campus_id?.toLowerCase().includes(q) ||
        r.subject_name?.toLowerCase().includes(q) ||
        r.subject_code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, statusFilter, searchTerm]);

  // Group by student for a cleaner view
  const studentGroups = useMemo(() => {
    const map = new Map<string, { student: any; subjects: any[] }>();
    for (const row of filteredRows) {
      if (!map.has(row.student_id)) {
        map.set(row.student_id, {
          student: {
            id: row.student_id,
            name: row.student_name,
            campus_id: row.student_campus_id,
            year: row.student_year,
          },
          subjects: [],
        });
      }
      map.get(row.student_id)!.subjects.push(row);
    }
    return Array.from(map.values());
  }, [filteredRows]);

  const getLetterBadgeClass = (gpa: number | null) => {
    if (gpa === null) return "bg-gray-100 text-gray-500";
    if (gpa >= 3.0) return "bg-green-100 text-green-800";
    if (gpa >= 2.0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">الفصل الدراسي</label>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">اختر الفصل</option>
              {semesters.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}{s.is_current ? " (الحالي)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">القسم</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">جميع الأقسام</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">الحالة</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">الكل</option>
              <option value="passed">ناجح</option>
              <option value="failed">راسب</option>
              <option value="no_grades">بدون درجات</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">بحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اسم الطالب أو المادة..."
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedSemester && stats.total_enrollments > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="إجمالي التسجيلات" value={stats.total_enrollments} color="gray" />
          <StatCard label="مُقيّمة" value={stats.graded} color="blue" />
          <StatCard label="بدون درجات" value={stats.ungraded} color="gray" />
          <StatCard label="ناجحون" value={stats.passed} color="green" />
          <StatCard label="راسبون" value={stats.failed} color="red" />
          <StatCard label="متوسط النسبة" value={stats.avg_percentage != null ? `${stats.avg_percentage}%` : "-"} color="blue" />
        </div>
      )}

      {/* Content */}
      {!selectedSemester ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">اختر الفصل الدراسي لعرض النتائج</h3>
          <p className="mt-2 text-sm text-gray-500">حدد الفصل الدراسي والقسم لعرض ملخص درجات الطلاب</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
          <Loader2 className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-3 text-sm text-gray-600">جاري تحميل النتائج...</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد نتائج</h3>
          <p className="mt-2 text-sm text-gray-500">لا توجد تسجيلات تطابق الفلاتر المحددة</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الطالب</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المادة</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">س.م</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">الدرجة</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">النسبة</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">التقدير</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">GPA</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.map((row: any) => (
                  <tr key={row.enrollment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{row.student_name}</div>
                      <div className="text-xs text-gray-500">{row.student_campus_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{row.subject_name}</div>
                      <div className="text-xs text-gray-500">
                        {row.subject_code}
                        {row.is_retake && (
                          <span className="mr-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">إعادة</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{row.subject_credits ?? "-"}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {row.grade_count > 0 ? `${row.total_value}/${row.total_max}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {row.percentage != null ? (
                        <span className={row.percentage < 50 ? "text-red-600" : "text-gray-900"}>
                          {row.percentage}%
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.letter_grade ? (
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getLetterBadgeClass(row.gpa)}`}>
                          {row.letter_grade.letter}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {row.gpa != null ? (
                        <span className={row.gpa >= 2.0 ? "text-gray-800" : "text-red-600"}>
                          {Number(row.gpa).toFixed(1)}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status === "passed" && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">ناجح</span>
                      )}
                      {row.status === "failed" && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">راسب</span>
                      )}
                      {row.status === "no_grades" && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">بدون درجات</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
            عرض {filteredRows.length} من {rows.length} تسجيل
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-50 text-gray-800",
    blue: "bg-blue-50 text-blue-800",
    green: "bg-green-50 text-green-800",
    red: "bg-red-50 text-red-800",
    amber: "bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-lg p-3 text-center ${colorMap[color] || colorMap.gray}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB 2 — Academic Progression & Retake
   ═══════════════════════════════════════════════ */

function ProgressionTab({
  semesters, departments,
  selectedDepartment, setSelectedDepartment,
}: {
  semesters: any[]; departments: any[];
  selectedDepartment: string; setSelectedDepartment: (v: string) => void;
}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<any>(null);

  const trimmedSearch = searchTerm.trim();
  const shouldSearch = trimmedSearch.length >= 2;

  const { data: students, isFetching: searchingStudents } = useQuery<any[]>({
    queryKey: ["students", "search", trimmedSearch],
    queryFn: () => fetchStudents(trimmedSearch),
    enabled: shouldSearch,
  });

  const { data: studyYears } = useQuery<any[]>({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  const { data: evaluation, isLoading: evaluating, refetch: refetchEval } = useQuery({
    queryKey: ["student-evaluation", expandedStudent],
    queryFn: () => evaluateStudent(expandedStudent!),
    enabled: !!expandedStudent,
  });

  const { data: retakeableSubjects, isLoading: loadingRetakeable } = useQuery({
    queryKey: ["retakeable-subjects", selectedStudent?.id],
    queryFn: () => fetchRetakeableSubjects(selectedStudent?.id),
    enabled: !!selectedStudent?.id && showRetakeModal,
  });

  const promoteMutation = useMutation({
    mutationFn: (studentId: string) => promoteStudent(studentId),
    onSuccess: (data: any) => {
      alert(data.promoted ? `تمت ترقية الطالب للفصل ${data.new_semester} بنجاح` : `لا يمكن ترقية الطالب: ${data.reason}`);
      queryClient.invalidateQueries({ queryKey: ["student-evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err: any) => alert("فشل في الترقية: " + err.message),
  });

  const bulkEvalMutation = useMutation({
    mutationFn: (deptId?: string) => bulkEvaluateStudents(deptId),
    onSuccess: (data: any) => { setBulkMessage({ type: "evaluate", ...data }); queryClient.invalidateQueries({ queryKey: ["student-evaluation"] }); },
    onError: (err: any) => alert("فشل في التقييم الجماعي: " + err.message),
  });

  const bulkPromoteMutation = useMutation({
    mutationFn: (deptId?: string) => bulkPromoteStudents(deptId),
    onSuccess: (data: any) => { setBulkMessage({ type: "promote", ...data }); queryClient.invalidateQueries({ queryKey: ["student-evaluation", "students"] }); },
    onError: (err: any) => alert("فشل في الترقية الجماعية: " + err.message),
  });

  const filteredStudents = useMemo(() => {
    if (!students || !shouldSearch) return [];
    return selectedDepartment ? students.filter((s: any) => s.department_id === selectedDepartment) : students;
  }, [students, shouldSearch, selectedDepartment]);

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-blue-700";
    if (gpa >= 2.0) return "text-green-700";
    if (gpa >= 1.0) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <>
      {/* Bulk actions + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => { if (confirm("هل تريد تقييم جميع الطلاب النشطين" + (selectedDepartment ? " في هذا القسم" : "") + "؟")) bulkEvalMutation.mutate(selectedDepartment || undefined); }}
            disabled={bulkEvalMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {bulkEvalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            تقييم جماعي
          </button>
          <button
            onClick={() => { if (confirm("هل تريد ترقية جميع الطلاب المؤهلين" + (selectedDepartment ? " في هذا القسم" : "") + "؟")) bulkPromoteMutation.mutate(selectedDepartment || undefined); }}
            disabled={bulkPromoteMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {bulkPromoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
            ترقية جماعية
          </button>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الجامعي..."
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {searchingStudents && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
          </div>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">جميع الأقسام</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk result banner */}
      {bulkMessage && (
        <div className={`mb-6 rounded-lg border p-4 ${bulkMessage.type === "evaluate" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-medium text-sm ${bulkMessage.type === "evaluate" ? "text-amber-800" : "text-blue-800"}`}>
                {bulkMessage.type === "evaluate" ? "نتائج التقييم الجماعي" : "نتائج الترقية الجماعية"}
              </h3>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-600">إجمالي:</span> <span className="font-medium mr-1">{bulkMessage.total}</span></div>
                {bulkMessage.type === "evaluate" ? (
                  <>
                    <div><span className="text-gray-600">تم تقييمهم:</span> <span className="font-medium mr-1">{bulkMessage.evaluated}</span></div>
                    <div><span className="text-amber-700">إنذار:</span> <span className="font-medium mr-1">{bulkMessage.on_probation}</span></div>
                    <div><span className="text-red-700">مفصولون:</span> <span className="font-medium mr-1">{bulkMessage.dismissed}</span></div>
                  </>
                ) : (
                  <>
                    <div><span className="text-green-700">تمت ترقيتهم:</span> <span className="font-medium mr-1">{bulkMessage.promoted}</span></div>
                    <div><span className="text-gray-600">غير مؤهلين:</span> <span className="font-medium mr-1">{bulkMessage.not_eligible}</span></div>
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setBulkMessage(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
          </div>
        </div>
      )}

      {/* Student list */}
      {!shouldSearch ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">ابحث عن طالب لتقييم وضعه الأكاديمي</h3>
          <p className="mt-2 text-sm text-gray-500">أدخل اسم الطالب أو رقمه الجامعي (حرفان على الأقل)</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-16">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد نتائج</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student: any) => {
            const isExpanded = expandedStudent === student.id;
            const eval_ = isExpanded ? evaluation : null;
            const standing = (eval_ as any)?.academic_standing ? STANDING_CONFIG[(eval_ as any).academic_standing] || STANDING_CONFIG.good_standing : null;

            return (
              <div key={student.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => { setExpandedStudent(isExpanded ? null : student.id); if (!isExpanded) setSelectedStudent(student); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">{student.name?.charAt(0) || "ط"}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.campus_id} · {student.department?.name || "-"}{student.year ? ` · السنة ${student.year}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {standing && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${standing.bg} ${standing.text} ${standing.border}`}>
                        {standing.icon}{standing.label}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 px-5 py-4">
                    {evaluating ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                        <span className="mr-2 text-sm text-gray-600">جاري التقييم...</span>
                      </div>
                    ) : eval_ ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">المعدل التراكمي</div>
                            <div className={`text-xl font-bold ${getGPAColor((eval_ as any).gpa)}`}>{Number((eval_ as any).gpa).toFixed(2)}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">الساعات المكتسبة</div>
                            <div className="text-xl font-bold text-gray-800">{(eval_ as any).credits_earned}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">الفصل الحالي</div>
                            <div className="text-xl font-bold text-gray-800">{(eval_ as any).current_semester}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">مقررات راسبة</div>
                            <div className={`text-xl font-bold ${(eval_ as any).failed_subjects_count > 0 ? "text-red-600" : "text-green-600"}`}>
                              {(eval_ as any).failed_subjects_count}
                            </div>
                          </div>
                        </div>

                        {(eval_ as any).failed_subjects?.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1"><XCircle className="h-4 w-4" />المقررات الراسبة</h4>
                            <div className="space-y-1">
                              {(eval_ as any).failed_subjects.map((s: any) => (
                                <div key={s.enrollment_id} className="flex items-center justify-between text-sm">
                                  <span className="text-red-700">{s.subject_code} - {s.subject_name}</span>
                                  <span className="text-red-600 font-medium">{s.grade != null ? `${Number(s.grade).toFixed(0)}%` : "-"} · {s.credits} س.م</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`rounded-lg p-3 border ${(eval_ as any).can_promote ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center gap-2">
                            {(eval_ as any).can_promote ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Info className="h-4 w-4 text-gray-400" />}
                            <span className={`text-sm font-medium ${(eval_ as any).can_promote ? "text-green-800" : "text-gray-600"}`}>
                              {(eval_ as any).can_promote ? "مؤهل للترقية للفصل التالي" : "غير مؤهل للترقية حالياً"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => { if (confirm(`هل تريد ترقية الطالب ${student.name}؟`)) promoteMutation.mutate(student.id); }}
                            disabled={!(eval_ as any).can_promote || promoteMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {promoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                            ترقية
                          </button>
                          {(eval_ as any).failed_subjects_count > 0 && (
                            <button onClick={() => { setSelectedStudent(student); setShowRetakeModal(true); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors">
                              <RotateCcw className="h-4 w-4" />إعادة تسجيل
                            </button>
                          )}
                          <button onClick={() => refetchEval()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors">
                            <RefreshCw className="h-4 w-4" />تقييم
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
          })}
        </div>
      )}

      {/* Retake Modal */}
      {showRetakeModal && selectedStudent && (
        <RetakeModal
          student={selectedStudent}
          retakeableSubjects={retakeableSubjects || []}
          loading={loadingRetakeable}
          semesters={semesters}
          studyYears={studyYears || []}
          onClose={() => setShowRetakeModal(false)}
          onSuccess={() => { setShowRetakeModal(false); queryClient.invalidateQueries({ queryKey: ["student-evaluation", "retakeable-subjects"] }); }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Retake Modal
   ═══════════════════════════════════════════════ */

function RetakeModal({
  student, retakeableSubjects, loading, semesters, studyYears, onClose, onSuccess,
}: {
  student: any; retakeableSubjects: any[]; loading: boolean;
  semesters: any[]; studyYears: any[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [studyYearId, setStudyYearId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState<number>(1);
  const [isPaying, setIsPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSemester = semesters?.find((s: any) => s.is_current);
  useEffect(() => {
    if (currentSemester) { setSemesterId(currentSemester.id); setStudyYearId(currentSemester.study_year_id); }
  }, [currentSemester]);

  const toggleSubject = (id: string) => setSelectedSubjects((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSubmit = async () => {
    if (!selectedSubjects.length) { setError("يجب اختيار مقرر واحد على الأقل"); return; }
    if (!semesterId || !studyYearId) { setError("يجب تحديد الفصل والسنة الدراسية"); return; }
    setSubmitting(true); setError(null);
    try {
      await enrollRetakeSubjects(student.id, selectedSubjects, semesterId, studyYearId, student.department_id, semesterNumber, isPaying);
      alert("تم تسجيل الطالب في مقررات الإعادة بنجاح");
      onSuccess();
    } catch (err: any) { setError(err.message || "فشل في تسجيل مقررات الإعادة"); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />إعادة تسجيل مقررات راسبة
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{student.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">الفصل الدراسي</label>
              <select value={semesterId} onChange={(e) => { setSemesterId(e.target.value); const s = semesters.find((x: any) => x.id === e.target.value); if (s?.study_year_id) setStudyYearId(s.study_year_id); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">اختر الفصل</option>
                {semesters.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.is_current ? " (الحالي)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">السنة الدراسية</label>
              <select value={studyYearId} onChange={(e) => setStudyYearId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">اختر السنة</option>
                {studyYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">رقم الفصل</label>
              <input type="number" value={semesterNumber} onChange={(e) => setSemesterNumber(parseInt(e.target.value))} min={1} max={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPaying} onChange={(e) => setIsPaying(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">الدفع عند التسجيل</span>
          </label>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" />المقررات القابلة لإعادة التسجيل</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 text-blue-500 animate-spin" /><span className="mr-2 text-sm text-gray-600">جاري التحميل...</span></div>
            ) : retakeableSubjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">لا توجد مقررات راسبة قابلة لإعادة التسجيل</div>
            ) : (
              <div className="space-y-2">
                {retakeableSubjects.map((sub: any) => (
                  <label key={sub.subject_id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedSubjects.includes(sub.subject_id) ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedSubjects.includes(sub.subject_id)} onChange={() => toggleSubject(sub.subject_id)}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sub.subject_code} - {sub.subject_name}</div>
                        <div className="text-xs text-gray-500">{sub.credits} ساعات معتمدة · الفصل {sub.semester_number}</div>
                      </div>
                    </div>
                    <div className="text-sm text-red-600 font-medium">{sub.failed_grade != null ? `${Number(sub.failed_grade).toFixed(0)}%` : "راسب"}</div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">إلغاء</button>
          <button onClick={handleSubmit} disabled={submitting || !selectedSubjects.length}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium transition-colors">
            {submitting ? "جاري التسجيل..." : `تسجيل إعادة (${selectedSubjects.length} مقرر)`}
          </button>
        </div>
      </div>
    </div>
  );
}
