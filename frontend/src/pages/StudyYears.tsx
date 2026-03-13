import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchStudyYears, createStudyYear, updateStudyYear, deleteStudyYear, setCurrentStudyYear, toggleStudyYearActive } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { formatDate, formatNumber } from "../lib/utils";

export default function StudyYears() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: studyYears, isLoading, error } = useQuery({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  const filteredYears = useMemo(() => {
    let filtered: any[] = studyYears || [];
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((y) =>
        String(y.name || '').toLowerCase().includes(s) ||
        String(y.name_en || '').toLowerCase().includes(s) ||
        String(y.description || '').toLowerCase().includes(s)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((y) => {
        if (statusFilter === "current") return y.is_current;
        if (statusFilter === "active") return y.is_active && !y.is_current;
        if (statusFilter === "inactive") return !y.is_active;
        return true;
      });
    }
    return filtered;
  }, [studyYears, searchTerm, statusFilter]);

  const handleAdd = () => { setEditingYear(null); setShowModal(true); };
  const handleEdit = (year: any) => { setEditingYear(year); setShowModal(true); };

  const handleDelete = async (year: any) => {
    const warnings: string[] = [];
    if (year.semesters_count > 0) warnings.push(`${year.semesters_count} فصل دراسي`);
    if (year.student_semester_registrations_count > 0) warnings.push(`${year.student_semester_registrations_count} تسجيل طالب`);
    const msg = warnings.length > 0
      ? `هذه السنة تحتوي على: ${warnings.join('، ')}.\nهل أنت متأكد من الحذف؟`
      : "هل أنت متأكد من حذف هذا العام الدراسي؟";
    if (!window.confirm(msg)) return;
    setActionLoading(year.id);
    try {
      await deleteStudyYear(year.id);
      queryClient.invalidateQueries({ queryKey: ["study-years"] });
      showToast("تم حذف العام الدراسي بنجاح");
    } catch (err: any) {
      showToast(err.message || "خطأ في حذف العام الدراسي", 'error');
    } finally { setActionLoading(null); }
  };

  const handleSetCurrent = async (id: string) => {
    setActionLoading(id);
    try {
      await setCurrentStudyYear(id);
      queryClient.invalidateQueries({ queryKey: ["study-years"] });
      showToast("تم تعيين العام الدراسي كحالي بنجاح");
    } catch (err: any) {
      showToast(err.message || "خطأ في تعيين العام الدراسي", 'error');
    } finally { setActionLoading(null); }
  };

  const handleToggleActive = async (year: any) => {
    const action = year.is_active ? "تعطيل" : "تفعيل";
    const cascadeWarning = year.is_active && year.active_semesters_count > 0
      ? `\n\nتحذير: سيتم تعطيل ${year.active_semesters_count} فصل دراسي نشط وإلغاء جميع الحصص المجدولة غير المكتملة.`
      : "";
    if (!window.confirm(`هل تريد ${action} السنة الدراسية "${year.name}"؟${cascadeWarning}`)) return;
    setActionLoading(year.id);
    try {
      const res: any = await toggleStudyYearActive(year.id);
      queryClient.invalidateQueries({ queryKey: ["study-years"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      const cascadeInfo = res?.cascade || [];
      if (cascadeInfo.length > 0) {
        const totalCancelled = cascadeInfo.reduce((sum: number, c: any) => sum + (c.cancelled_sessions || 0), 0);
        showToast(`تم ${action} السنة. تعطيل ${cascadeInfo.length} فصل وإلغاء ${totalCancelled} حصة.`);
      } else {
        showToast(res?.message || `تم ${action} السنة الدراسية بنجاح`);
      }
    } catch (err: any) {
      showToast(err.message || `خطأ في ${action} العام الدراسي`, 'error');
    } finally { setActionLoading(null); }
  };

  const getYearProgress = (year: any) => {
    const now = new Date();
    const start = new Date(year.start_date);
    const end = new Date(year.end_date);
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
  };

  const canEdit = hasClientPermission("study-years", "edit");
  const canDelete = hasClientPermission("study-years", "delete");
  const canCreate = hasClientPermission("study-years", "create");

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل السنوات الدراسية" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">السنوات الدراسية</h1>
                <p className="text-sm text-gray-500 mt-0.5">إدارة السنوات الأكاديمية والفصول الدراسية</p>
              </div>
            </div>
            {canCreate && (
              <button onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                إضافة سنة دراسية
              </button>
            )}
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
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm text-gray-700 min-w-[160px]"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">جميع السنوات</option>
            <option value="current">السنة الحالية</option>
            <option value="active">النشطة</option>
            <option value="inactive">المعطلة</option>
          </select>
        </div>

        {/* Study Year Cards */}
        <div className="space-y-3">
          {filteredYears.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">لا توجد سنوات دراسية مطابقة</p>
            </div>
          )}

          {filteredYears.map((year: any) => {
            const progress = getYearProgress(year);
            const isBusy = actionLoading === year.id;
            const months = Math.ceil((new Date(year.end_date).getTime() - new Date(year.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30));

            return (
              <div key={year.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  year.is_current ? 'border-emerald-200 shadow-sm shadow-emerald-100'
                  : year.is_active ? 'border-gray-200 hover:shadow-sm'
                  : 'border-gray-200 bg-gray-50/50'
                } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{year.name}</h3>
                        {year.is_current && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            الحالية
                          </span>
                        )}
                        {!year.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">
                            معطلة
                          </span>
                        )}
                      </div>
                      {year.name_en && <p className="text-xs text-gray-400 mb-2">{year.name_en}</p>}

                      {/* Date + duration */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(year.start_date)} — {formatDate(year.end_date)}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-400">{formatNumber(months)} شهر</span>
                      </div>

                      {/* Progress bar */}
                      {year.is_active && (
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
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mb-2">
                        <span><strong className="text-gray-700">{year.active_semesters_count || 0}</strong>/{year.semesters_count || 0} فصل</span>
                        <span><strong className="text-gray-700">{formatNumber(year.student_semester_registrations_count || 0)}</strong> تسجيل</span>
                      </div>

                      {/* Semester pills */}
                      {year.semesters && year.semesters.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {year.semesters.map((sem: any) => (
                            <span key={sem.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                sem.is_current ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : sem.is_active
                                  ? sem.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : sem.status === 'grade_entry' ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : sem.status === 'finalized' ? 'bg-gray-100 text-gray-500 border-gray-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-gray-50 text-gray-400 border-gray-100'
                              }`}>
                              {sem.is_current && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                              {sem.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {year.description && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{year.description}</p>}
                    </div>

                    {/* Actions column */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {/* Toggle active */}
                        {canEdit && (
                          <button onClick={() => handleToggleActive(year)} disabled={isBusy}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                            style={{ backgroundColor: year.is_active ? '#10b981' : '#d1d5db' }}
                            title={year.is_active ? 'تعطيل' : 'تفعيل'}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                              year.is_active ? '-translate-x-6' : '-translate-x-1'
                            }`} />
                          </button>
                        )}

                        {/* Set as current */}
                        {!year.is_current && year.is_active && canEdit && (
                          <button onClick={() => handleSetCurrent(year.id)} disabled={isBusy}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="تعيين كحالية">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}

                        {/* Edit */}
                        {canEdit && (
                          <button onClick={() => handleEdit(year)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="تعديل">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        {/* Navigate to semesters */}
                        <button onClick={() => navigate(`/semesters`, { state: { studyYearId: year.id, studyYearName: year.name } })}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="عرض الفصول">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </button>

                        {/* Delete */}
                        {canDelete && !year.is_current && (
                          <button onClick={() => handleDelete(year)} disabled={isBusy}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <StudyYearModal year={editingYear}
            onClose={() => setShowModal(false)}
            onSave={(msg) => {
              setShowModal(false);
              queryClient.invalidateQueries({ queryKey: ["study-years"] });
              showToast(msg || "تم حفظ السنة الدراسية بنجاح");
            }} />
        )}
      </div>
    </div>
  );
}

function StudyYearModal({ year, onClose, onSave }: { year: any | null; onClose: () => void; onSave: (msg?: string) => void }) {
  const [formData, setFormData] = useState({
    name: year?.name || "",
    name_en: year?.name_en || "",
    start_date: year?.start_date ? String(year.start_date).substring(0, 10) : "",
    end_date: year?.end_date ? String(year.end_date).substring(0, 10) : "",
    is_active: year?.is_active ?? true,
    description: year?.description || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      if (year) {
        await updateStudyYear(year.id, formData);
        onSave("تم تحديث السنة الدراسية بنجاح");
      } else {
        await createStudyYear(formData);
        onSave("تم إنشاء السنة الدراسية بنجاح");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطأ في حفظ السنة الدراسية");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {year ? "تعديل السنة الدراسية" : "إضافة سنة دراسية جديدة"}
            </h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم بالعربية *</label>
                <input type="text" required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="2025-2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم بالإنجليزية</label>
                <input type="text"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                  value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="2025-2026" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ البداية *</label>
                <input type="date" required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                  value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ النهاية *</label>
                <input type="date" required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm"
                  value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>

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
              <span className="text-sm text-gray-600">{formData.is_active ? 'نشطة' : 'معطلة'}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {isSubmitting ? "جاري الحفظ..." : (year ? "تحديث" : "إضافة")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
