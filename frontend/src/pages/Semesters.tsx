import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { fetchSemesters, fetchStudyYears, createSemester, updateSemester, deleteSemester, setCurrentSemester, toggleSemesterActive } from "../lib/api";
import { transitionSemesterStatus } from "../lib/jwt-api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { formatDate, formatNumber } from "../lib/utils";

const STATUS_CONFIG: Record<string, { label: string; bg: string; next: string | null; nextLabel: string | null; nextWarning?: string }> = {
  registration_open: { label: "التسجيل مفتوح", bg: "bg-blue-50 text-blue-700 border-blue-200", next: "in_progress", nextLabel: "بدء الفصل", nextWarning: "سيتم توليد جميع الحصص الدراسية تلقائياً بناءً على الجدول الزمني." },
  in_progress: { label: "قيد التنفيذ", bg: "bg-amber-50 text-amber-700 border-amber-200", next: "grade_entry", nextLabel: "فتح إدخال الدرجات" },
  grade_entry: { label: "إدخال الدرجات", bg: "bg-purple-50 text-purple-700 border-purple-200", next: "finalized", nextLabel: "إغلاق الفصل", nextWarning: "إغلاق الفصل سيمنع المدرسين من تعديل الدرجات وسيتم مزامنة حالات التسجيل." },
  finalized: { label: "مُغلق", bg: "bg-gray-100 text-gray-600 border-gray-200", next: null, nextLabel: null },
};

const STATUS_STEPS = ['registration_open', 'in_progress', 'grade_entry', 'finalized'];

export default function Semesters() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const navState = location.state as { studyYearId?: string; studyYearName?: string } | null;

  const [searchTerm, setSearchTerm] = useState("");
  const [studyYearFilter, setStudyYearFilter] = useState(navState?.studyYearId || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const { data: semesters, isLoading, error } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: studyYears } = useQuery({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  const filteredSemesters = useMemo(() => {
    let filtered: any[] = semesters || [];
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((sem) =>
        String(sem.name || '').toLowerCase().includes(s) ||
        String(sem.name_en || '').toLowerCase().includes(s) ||
        String(sem.code || '').toLowerCase().includes(s) ||
        String(sem.description || '').toLowerCase().includes(s)
      );
    }
    if (studyYearFilter) {
      filtered = filtered.filter((sem) => String(sem.study_year_id) === String(studyYearFilter));
    }
    if (statusFilter) {
      filtered = filtered.filter((sem) => {
        if (statusFilter === "current") return sem.is_current;
        if (statusFilter === "active") return sem.is_active && !sem.is_current;
        if (statusFilter === "inactive") return !sem.is_active;
        return (sem.status || 'registration_open') === statusFilter;
      });
    }
    return filtered;
  }, [semesters, searchTerm, studyYearFilter, statusFilter]);

  const handleAdd = () => { setEditingSemester(null); setShowModal(true); };
  const handleEdit = (s: any) => { setEditingSemester(s); setShowModal(true); };

  const handleDelete = async (sem: any) => {
    const warnings: string[] = [];
    if (sem.student_semester_registrations_count > 0) warnings.push(`${sem.student_semester_registrations_count} تسجيل`);
    if (sem.timetable_entries_count > 0) warnings.push(`${sem.timetable_entries_count} مدخل جدول`);
    const msg = warnings.length
      ? `هذا الفصل يحتوي على: ${warnings.join('، ')}.\nهل أنت متأكد من الحذف؟`
      : "هل أنت متأكد من حذف هذا الفصل الدراسي؟";
    if (!window.confirm(msg)) return;
    setActionLoading(sem.id);
    try {
      await deleteSemester(sem.id);
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["study-years"] });
      showToast("تم حذف الفصل الدراسي بنجاح");
    } catch (err: any) {
      showToast(err.message || "خطأ في حذف الفصل الدراسي", 'error');
    } finally { setActionLoading(null); }
  };

  const handleSetCurrent = async (id: string) => {
    setActionLoading(id);
    try {
      await setCurrentSemester(id);
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["study-years"] });
      showToast("تم تعيين الفصل الدراسي كحالي بنجاح");
    } catch (err: any) {
      showToast(err.message || "خطأ في تعيين الفصل الدراسي", 'error');
    } finally { setActionLoading(null); }
  };

  const handleToggleActive = async (sem: any) => {
    const action = sem.is_active ? "تعطيل" : "تفعيل";
    const warning = sem.is_active && (sem.timetable_entries_count > 0)
      ? `\n\nتحذير: سيتم إلغاء جميع الحصص المجدولة غير المكتملة.`
      : "";
    if (!window.confirm(`هل تريد ${action} الفصل الدراسي "${sem.name}"؟${warning}`)) return;
    setActionLoading(sem.id);
    try {
      const res: any = await toggleSemesterActive(sem.id);
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      queryClient.invalidateQueries({ queryKey: ["study-years"] });
      const cancelled = res?.cascade?.cancelled_sessions;
      if (cancelled > 0) {
        showToast(`تم ${action} الفصل. تم إلغاء ${cancelled} حصة.`);
      } else {
        showToast(res?.message || `تم ${action} الفصل بنجاح`);
      }
    } catch (err: any) {
      showToast(err.message || `خطأ في ${action} الفصل`, 'error');
    } finally { setActionLoading(null); }
  };

  const handleTransitionStatus = async (sem: any, newStatus: string) => {
    const currentConf = STATUS_CONFIG[sem.status || 'registration_open'];
    const targetConf = STATUS_CONFIG[newStatus];
    let msg = `تغيير حالة الفصل "${sem.name}" من "${currentConf?.label}" إلى "${targetConf?.label}"؟`;
    if (newStatus === 'finalized') msg += `\n\n${STATUS_CONFIG.grade_entry.nextWarning}`;
    if (newStatus === 'in_progress') msg += `\n\n${STATUS_CONFIG.registration_open.nextWarning}`;
    if (!window.confirm(msg)) return;
    setActionLoading(sem.id);
    try {
      const res: any = await transitionSemesterStatus(sem.id, newStatus);
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      const parts = ["تم تحديث حالة الفصل بنجاح"];
      if (res?.session_sync) {
        const s = res.session_sync;
        parts.push(`(${s.created || 0} جديدة، ${s.updated || 0} محدثة، ${s.cancelled || 0} ملغاة)`);
      }
      if (res?.grade_sync) {
        parts.push(`مزامنة: ${res.grade_sync.synced || 0} تسجيل`);
      }
      showToast(parts.join(' - '));
    } catch (err: any) {
      showToast(err?.message || "فشل تغيير الحالة", 'error');
    } finally { setActionLoading(null); }
  };

  const getSemesterProgress = (sem: any) => {
    const now = new Date();
    const start = new Date(sem.start_date);
    const end = new Date(sem.end_date);
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
  };

  const activeYearName = useMemo(() => {
    if (!studyYearFilter || !studyYears) return navState?.studyYearName || null;
    return (studyYears as any[]).find((y: any) => String(y.id) === String(studyYearFilter))?.name || null;
  }, [studyYearFilter, studyYears, navState]);

  const canEdit = hasClientPermission("semesters", "edit");
  const canDelete = hasClientPermission("semesters", "delete");
  const canCreate = hasClientPermission("semesters", "create");

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل الفصول الدراسية" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-lg text-center ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-900 rounded-xl">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">الفصول الدراسية</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {activeYearName ? `فصول السنة: ${activeYearName}` : "إدارة وتنظيم الفصول الدراسية"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {activeYearName && (
                <button onClick={() => setStudyYearFilter("")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  إزالة الفلتر
                </button>
              )}
              {canCreate && (
                <button onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة فصل دراسي
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text"
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm placeholder-gray-400 transition-colors"
              placeholder="البحث..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm text-gray-700 min-w-[160px]"
            value={studyYearFilter} onChange={(e) => setStudyYearFilter(e.target.value)}>
            <option value="">جميع السنوات</option>
            {(studyYears as any[])?.map((y: any) => (
              <option key={y.id} value={y.id}>{y.name}{!y.is_active ? ' (معطلة)' : ''}</option>
            ))}
          </select>
          <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm text-gray-700 min-w-[140px]"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">جميع الحالات</option>
            <option value="current">الحالي</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
            <option value="registration_open">التسجيل مفتوح</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="grade_entry">إدخال الدرجات</option>
            <option value="finalized">مُغلق</option>
          </select>
        </div>

        {/* Semester Cards */}
        <div className="space-y-3">
          {filteredSemesters.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">لا توجد فصول دراسية مطابقة</p>
            </div>
          )}

          {filteredSemesters.map((sem: any) => {
            const isBusy = actionLoading === sem.id;
            const status = sem.status || 'registration_open';
            const conf = STATUS_CONFIG[status] || STATUS_CONFIG.registration_open;
            const progress = getSemesterProgress(sem);
            const weeks = Math.ceil((new Date(sem.end_date).getTime() - new Date(sem.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7));
            const currentStepIdx = STATUS_STEPS.indexOf(status);

            return (
              <div key={sem.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  sem.is_current ? 'border-emerald-200 shadow-sm shadow-emerald-100'
                  : sem.is_active ? 'border-gray-200 hover:shadow-sm'
                  : 'border-gray-200 bg-gray-50/50'
                } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{sem.name}</h3>
                        <span className="text-[11px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{sem.code}</span>
                        {sem.is_current && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            الحالي
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${conf.bg}`}>
                          {conf.label}
                        </span>
                        {!sem.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">معطل</span>
                        )}
                      </div>

                      {sem.name_en && <p className="text-xs text-gray-400 mb-1.5">{sem.name_en}</p>}

                      {/* Study year & dates */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{sem.study_year?.name || 'غير محدد'}</span>
                        <span className="text-gray-300">|</span>
                        <span>{formatDate(sem.start_date)} — {formatDate(sem.end_date)}</span>
                        <span className="text-gray-400">({formatNumber(weeks)} أسبوع)</span>
                      </div>

                      {/* Status stepper */}
                      <div className="flex items-center gap-0.5 mb-3 max-w-xs">
                        {STATUS_STEPS.map((step, i) => {
                          const isDone = i <= currentStepIdx;
                          return (
                            <div key={step} className="flex-1 flex items-center gap-0.5">
                              <div className={`h-1.5 w-full rounded-full transition-all ${
                                isDone ? (
                                  step === 'finalized' ? 'bg-gray-400'
                                  : step === 'grade_entry' ? 'bg-purple-400'
                                  : step === 'in_progress' ? 'bg-amber-400'
                                  : 'bg-blue-400'
                                ) : 'bg-gray-200'
                              }`} title={STATUS_CONFIG[step].label} />
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress bar */}
                      {sem.is_active && status !== 'finalized' && (
                        <div className="mb-3 max-w-md">
                          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                            <span>التقدم</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${
                              progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-200'
                            }`} style={{ width: `${Math.max(progress, 2)}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Inline stats */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                        <span><strong className="text-gray-700">{formatNumber(sem.student_semester_registrations_count || 0)}</strong> تسجيل</span>
                        <span><strong className="text-gray-700">{sem.timetable_entries_count || 0}</strong> جدول</span>
                        <span><strong className="text-gray-700">{sem.student_groups_count || 0}</strong> مجموعة</span>
                      </div>

                      {sem.description && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{sem.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {/* Toggle active */}
                        {canEdit && (
                          <button onClick={() => handleToggleActive(sem)} disabled={isBusy}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                            style={{ backgroundColor: sem.is_active ? '#10b981' : '#d1d5db' }}
                            title={sem.is_active ? 'تعطيل' : 'تفعيل'}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                              sem.is_active ? '-translate-x-6' : '-translate-x-1'
                            }`} />
                          </button>
                        )}

                        {/* Set current */}
                        {!sem.is_current && sem.is_active && canEdit && (
                          <button onClick={() => handleSetCurrent(sem.id)} disabled={isBusy}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="تعيين كحالي">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}

                        {/* Edit */}
                        {canEdit && (
                          <button onClick={() => handleEdit(sem)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="تعديل">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        {/* Delete */}
                        {canDelete && !sem.is_current && (
                          <button onClick={() => handleDelete(sem)} disabled={isBusy}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Status transition button */}
                      {conf.next && sem.is_active && canEdit && (
                        <button onClick={() => handleTransitionStatus(sem, conf.next!)} disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {conf.nextLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <SemesterModal semester={editingSemester}
            studyYears={(studyYears as any[]) || []}
            defaultStudyYearId={studyYearFilter}
            onClose={() => setShowModal(false)}
            onSave={(msg) => {
              setShowModal(false);
              queryClient.invalidateQueries({ queryKey: ["semesters"] });
              queryClient.invalidateQueries({ queryKey: ["study-years"] });
              showToast(msg || "تم حفظ الفصل الدراسي بنجاح");
            }} />
        )}
      </div>
    </div>
  );
}

function SemesterModal({ semester, studyYears, defaultStudyYearId, onClose, onSave }: {
  semester: any | null; studyYears: any[]; defaultStudyYearId?: string; onClose: () => void; onSave: (msg?: string) => void;
}) {
  const isFinalized = semester?.status === 'finalized';
  const [formData, setFormData] = useState({
    name: semester?.name || "",
    name_en: semester?.name_en || "",
    code: semester?.code || "",
    study_year_id: semester?.study_year_id || defaultStudyYearId || "",
    start_date: semester?.start_date ? String(semester.start_date).substring(0, 10) : "",
    end_date: semester?.end_date ? String(semester.end_date).substring(0, 10) : "",
    is_active: semester?.is_active ?? true,
    description: semester?.description || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      if (semester) {
        const res: any = await updateSemester(semester.id, formData);
        if (res?.session_sync) {
          const s = res.session_sync;
          onSave(`تم تحديث الفصل. مزامنة: ${s.created || 0} جديدة، ${s.updated || 0} محدثة، ${s.cancelled || 0} ملغاة`);
        } else {
          onSave("تم تحديث الفصل الدراسي بنجاح");
        }
      } else {
        await createSemester(formData);
        onSave("تم إنشاء الفصل الدراسي بنجاح");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطأ في حفظ الفصل الدراسي");
    } finally { setIsSubmitting(false); }
  };

  const activeStudyYears = studyYears.filter((y: any) => y.is_active);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {semester ? "تعديل الفصل الدراسي" : "إضافة فصل دراسي جديد"}
            </h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errorMsg}</div>}
          {isFinalized && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">هذا الفصل مُغلق. لا يمكن تعديل التواريخ.</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الفصل *</label>
                <input type="text" required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="الفصل الأول" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الكود *</label>
                <input type="text" required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                  value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="F26" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم بالإنجليزية</label>
              <input type="text"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="Fall Semester" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">السنة الدراسية *</label>
              <select required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                value={formData.study_year_id} onChange={(e) => setFormData({ ...formData, study_year_id: e.target.value })}>
                <option value="">اختر السنة الدراسية</option>
                {activeStudyYears.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ البداية *</label>
                <input type="date" required disabled={isFinalized}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ النهاية *</label>
                <input type="date" required disabled={isFinalized}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>

            {semester && semester.status === 'in_progress' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                تغيير التواريخ أثناء التنفيذ سيعيد مزامنة جميع الحصص الدراسية تلقائياً.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
              <textarea rows={2}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm resize-none"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف اختياري..." />
            </div>

            <div className="flex items-center gap-3 py-1">
              <button type="button" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
                style={{ backgroundColor: formData.is_active ? '#10b981' : '#d1d5db' }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  formData.is_active ? '-translate-x-6' : '-translate-x-1'
                }`} />
              </button>
              <span className="text-sm text-gray-600">{formData.is_active ? 'نشط' : 'معطل'}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {isSubmitting ? "جاري الحفظ..." : (semester ? "تحديث" : "إضافة")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
