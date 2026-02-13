import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api-client";
import {
  Search, Clock, Filter, Activity, Download, ChevronLeft, ChevronRight,
  X, Eye, Shield, TrendingUp, Users, BarChart3, Monitor,
} from "lucide-react";

/* ─── Types ─── */
interface ActionLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { id: string; full_name: string; role: string; email: string };
}

interface PaginatedResponse {
  data: ActionLog[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface FilterUser {
  id: string;
  full_name: string;
  role: string;
}

interface FiltersResponse {
  actions: string[];
  resources: string[];
  users: FilterUser[];
}

interface StatsResponse {
  total: number;
  today: number;
  this_week: number;
  by_action: Record<string, number>;
  by_resource: Record<string, number>;
  daily_activity: Record<string, number>;
  top_users: { user_id: string; user_name: string; user_role: string; count: number }[];
  hourly_distribution: Record<string, number>;
}

/* ─── Constants ─── */
const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  create: { label: "إنشاء", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fas fa-plus-circle" },
  update: { label: "تعديل", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "fas fa-pen" },
  delete: { label: "حذف", color: "bg-red-100 text-red-700 border-red-200", icon: "fas fa-trash" },
  view: { label: "عرض", color: "bg-gray-100 text-gray-600 border-gray-200", icon: "fas fa-eye" },
  enroll: { label: "تسجيل مواد", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "fas fa-book" },
  register: { label: "تسجيل فصل", color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "fas fa-clipboard-list" },
  login: { label: "تسجيل دخول", color: "bg-teal-100 text-teal-700 border-teal-200", icon: "fas fa-sign-in-alt" },
  logout: { label: "تسجيل خروج", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "fas fa-sign-out-alt" },
};

const RESOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  students: { label: "الطلاب", icon: "fas fa-user-graduate" },
  "student-registration": { label: "تسجيل الفصول", icon: "fas fa-clipboard-list" },
  "student-enrollments": { label: "تسجيل المواد", icon: "fas fa-book-open" },
  fees: { label: "الرسوم", icon: "fas fa-dollar-sign" },
  teachers: { label: "المدرسين", icon: "fas fa-chalkboard-teacher" },
  departments: { label: "الأقسام", icon: "fas fa-building" },
  subjects: { label: "المقررات", icon: "fas fa-book" },
  users: { label: "المستخدمين", icon: "fas fa-users-cog" },
  "fee-definitions": { label: "تعريفات الرسوم", icon: "fas fa-file-invoice-dollar" },
  "fee-rules": { label: "قواعد الرسوم", icon: "fas fa-gavel" },
  "system-settings": { label: "إعدادات النظام", icon: "fas fa-cog" },
  roles: { label: "الأدوار", icon: "fas fa-shield-alt" },
};

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  manager: { label: "مدير", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  staff: { label: "موظف", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  teacher: { label: "مدرس", cls: "bg-purple-50 text-purple-700 border-purple-200" },
};

/* ─── Helpers ─── */
const getActionConfig = (action: string) =>
  ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-600 border-gray-200", icon: "fas fa-circle" };

const getResourceConfig = (resource: string) =>
  RESOURCE_LABELS[resource] || { label: resource, icon: "fas fa-cube" };

const getRoleConfig = (role: string) =>
  ROLE_CONFIG[role] || { label: role, cls: "bg-gray-50 text-gray-600 border-gray-200" };

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("ar-LY", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
};

const formatShortDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("ar-LY", { month: "short", day: "numeric" });
  } catch { return d; }
};

const getRelativeTime = (d: string) => {
  const now = new Date();
  const date = new Date(d);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDate(d);
};

/* ─── Detail descriptions ─── */
const buildDescription = (log: ActionLog): string => {
  const d = log.details || {};
  const action = getActionConfig(log.action).label;
  const resource = getResourceConfig(log.resource).label;
  const parts: string[] = [];

  if (d.student_name) parts.push(`الطالب: ${d.student_name}`);
  if (d.teacher_name) parts.push(`المدرس: ${d.teacher_name}`);
  if (d.department_name) parts.push(`القسم: ${d.department_name}`);
  if (d.subject_name) parts.push(`المقرر: ${d.subject_name}`);
  if (d.user_name_target) parts.push(`المستخدم: ${d.user_name_target}`);
  if (d.subject_count) parts.push(`${d.subject_count} مقرر`);
  if (d.amount) parts.push(`المبلغ: ${d.amount}`);
  if (d.invoice_number) parts.push(`فاتورة: ${d.invoice_number}`);
  if (d.action_type === "toggle_status") parts.push(`الحالة: ${d.new_status === "active" ? "تفعيل" : "تعطيل"}`);
  if (d.action_type === "reset_password") parts.push("إعادة تعيين كلمة المرور");
  if (d.action_type === "toggle_attendance") parts.push(d.allow_attendance ? "السماح بالحضور" : "منع الحضور");

  if (parts.length > 0) return `${action} ${resource} — ${parts.join(" | ")}`;
  return `${action} ${resource}`;
};

/* ─── Mini bar chart component ─── */
function MiniBarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <div className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</div>;
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-1 h-24 px-1">
      {entries.map(([date, count]) => (
        <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div className="absolute -top-7 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {formatShortDate(date)}: {count}
          </div>
          <div
            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500 min-h-[2px]"
            style={{ height: `${(count / maxVal) * 100}%` }}
          />
          <span className="text-[8px] text-gray-400 leading-none hidden sm:block">
            {formatShortDate(date)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Detail Modal ─── */
function DetailModal({ log, onClose }: { log: ActionLog; onClose: () => void }) {
  const actionCfg = getActionConfig(log.action);
  const resourceCfg = getResourceConfig(log.resource);
  const roleCfg = getRoleConfig(log.user?.role || log.details?.user_role || "unknown");
  const details = log.details || {};
  const detailEntries = Object.entries(details).filter(
    ([k]) => !["user_name", "user_role"].includes(k)
  );

  const detailLabels: Record<string, string> = {
    student_name: "اسم الطالب",
    teacher_name: "اسم المدرس",
    department_name: "اسم القسم",
    department_id: "معرف القسم",
    subject_name: "اسم المقرر",
    code: "الرمز",
    subject_count: "عدد المقررات",
    semester_id: "معرف الفصل",
    updated_fields: "الحقول المعدلة",
    action_type: "نوع الإجراء",
    amount: "المبلغ",
    invoice_number: "رقم الفاتورة",
    user_name_target: "المستخدم المستهدف",
    role: "الدور",
    new_status: "الحالة الجديدة",
    allow_attendance: "السماح بالحضور",
    method: "الطريقة",
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">تفاصيل العملية</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: "calc(85vh - 65px)" }}>
          {/* Action + Resource badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${actionCfg.color}`}>
              <i className={`${actionCfg.icon} text-xs`}></i>
              {actionCfg.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
              <i className={`${resourceCfg.icon} text-xs`}></i>
              {resourceCfg.label}
            </span>
            {log.resource_id && (
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                #{log.resource_id.substring(0, 8)}...
              </span>
            )}
          </div>

          {/* User info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {(log.user?.full_name || "?").charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{log.user?.full_name || details.user_name || "غير معروف"}</div>
                <div className="text-xs text-gray-500">{log.user?.email || ""}</div>
              </div>
              <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${roleCfg.cls}`}>
                {roleCfg.label}
              </span>
            </div>
          </div>

          {/* Timestamp + IP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">التاريخ والوقت</div>
              <div className="text-sm font-medium text-gray-800">{formatDate(log.created_at)}</div>
              <div className="text-xs text-gray-400 mt-0.5">{getRelativeTime(log.created_at)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">عنوان IP</div>
              <div className="text-sm font-mono font-medium text-gray-800">{log.ip_address || "-"}</div>
              {log.user_agent && (
                <div className="text-[10px] text-gray-400 mt-0.5 truncate" title={log.user_agent}>
                  {log.user_agent.includes("Chrome") ? "Chrome" :
                   log.user_agent.includes("Firefox") ? "Firefox" :
                   log.user_agent.includes("Safari") ? "Safari" : "متصفح آخر"}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          {detailEntries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">التفاصيل</h4>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-200/60">
                {detailEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500">{detailLabels[key] || key}</span>
                    <span className="text-xs font-medium text-gray-800 text-left max-w-[60%] truncate" dir="ltr">
                      {Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "نعم" : "لا") : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ActionLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("per_page", "25");
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resource", resourceFilter);
    if (userFilter) params.set("user_id", userFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    return params.toString();
  }, [page, actionFilter, resourceFilter, userFilter, searchQuery, dateFrom, dateTo]);

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["action-logs", queryParams],
    queryFn: () => api.get(`/action-logs?${queryParams}`),
  });

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["action-logs-stats"],
    queryFn: () => api.get("/action-logs/statistics"),
  });

  const { data: filters } = useQuery<FiltersResponse>({
    queryKey: ["action-logs-filters"],
    queryFn: () => api.get("/action-logs/filters"),
  });

  const logs = data?.data || [];
  const totalPages = data?.last_page || 1;
  const total = data?.total || 0;

  const hasActiveFilters = actionFilter || resourceFilter || userFilter || searchQuery || dateFrom || dateTo;

  const clearFilters = useCallback(() => {
    setActionFilter("");
    setResourceFilter("");
    setUserFilter("");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resource", resourceFilter);
    if (userFilter) params.set("user_id", userFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    const token = localStorage.getItem("jwt_token");
    window.open(`${baseUrl}/action-logs/export?${params.toString()}&token=${token}`, "_blank");
  }, [actionFilter, resourceFilter, userFilter, dateFrom, dateTo]);

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">جاري تحميل سجل العمليات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-gray-600 font-medium">تعذر تحميل سجل العمليات</p>
          <p className="text-sm text-gray-400 mt-1">تأكد من صلاحيات الوصول</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            سجل العمليات
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            متابعة وتتبع جميع العمليات التي يقوم بها المستخدمون في النظام
          </p>
        </div>
        <button
          onClick={handleExport}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <Download className="h-4 w-4" />
          تصدير CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">إجمالي العمليات</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">عمليات اليوم</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.today?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">هذا الأسبوع</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.this_week?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-xl">
              <Monitor className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">النتائج الحالية</p>
              <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart + Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Activity Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              النشاط اليومي (آخر 14 يوم)
            </h3>
          </div>
          <MiniBarChart data={stats?.daily_activity || {}} />
        </div>

        {/* Top Users */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-purple-500" />
            أكثر المستخدمين نشاطاً
          </h3>
          <div className="space-y-2">
            {(stats?.top_users || []).slice(0, 5).map((u, i) => {
              const roleCfg = getRoleConfig(u.user_role);
              return (
                <div
                  key={u.user_id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => { setUserFilter(u.user_id); setPage(1); }}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500" :
                    i === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                    i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500" :
                    "bg-gradient-to-br from-blue-400 to-blue-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{u.user_name}</div>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${roleCfg.cls}`}>
                      {roleCfg.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{u.count}</span>
                </div>
              );
            })}
            {(!stats?.top_users || stats.top_users.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</p>
            )}
          </div>
        </div>
      </div>

      {/* Action & Resource Breakdown */}
      {stats && (Object.keys(stats.by_action || {}).length > 0 || Object.keys(stats.by_resource || {}).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* By Action */}
          {Object.keys(stats.by_action || {}).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">حسب نوع العملية</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.by_action).map(([action, count]) => {
                  const cfg = getActionConfig(action);
                  return (
                    <button
                      key={action}
                      onClick={() => { setActionFilter(action); setPage(1); }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm ${cfg.color} ${actionFilter === action ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                    >
                      <i className={`${cfg.icon} text-[10px]`}></i>
                      {cfg.label}
                      <span className="bg-white/60 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Resource */}
          {Object.keys(stats.by_resource || {}).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">حسب المورد</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.by_resource).map(([resource, count]) => {
                  const cfg = getResourceConfig(resource);
                  return (
                    <button
                      key={resource}
                      onClick={() => { setResourceFilter(resource); setPage(1); }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:shadow-sm hover:bg-gray-100 ${resourceFilter === resource ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                    >
                      <i className={`${cfg.icon} text-[10px] text-gray-400`}></i>
                      {cfg.label}
                      <span className="bg-white rounded-full px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search + Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="بحث بالاسم، البريد، IP، أو التفاصيل..."
              className="w-full pr-10 pl-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>

          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl transition-all ${
              showFilters || hasActiveFilters
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            فلاتر متقدمة
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {[actionFilter, resourceFilter, userFilter, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Export (mobile) */}
          <button
            onClick={handleExport}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              مسح الكل
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">العملية</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="">الكل</option>
                {(filters?.actions || []).map((a) => (
                  <option key={a} value={a}>{getActionConfig(a).label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">المورد</label>
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="">الكل</option>
                {(filters?.resources || []).map((r) => (
                  <option key={r} value={r}>{getResourceConfig(r).label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">المستخدم</label>
              <select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="">الكل</option>
                {(filters?.users || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({getRoleConfig(u.role).label})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">من</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">إلى</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">لا توجد عمليات مسجلة</p>
            <p className="text-xs text-gray-400 mt-1">
              {hasActiveFilters ? "جرب تغيير معايير البحث أو الفلاتر" : "ستظهر العمليات هنا عند تنفيذها"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs">التاريخ</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs">المستخدم</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs">العملية</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs">المورد</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs">الوصف</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs">IP</th>
                  <th className="px-3 py-3.5 text-center font-semibold text-gray-600 text-xs w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const actionCfg = getActionConfig(log.action);
                  const resourceCfg = getResourceConfig(log.resource);
                  const roleCfg = getRoleConfig(log.user?.role || log.details?.user_role || "unknown");
                  return (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-500">{getRelativeTime(log.created_at)}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(log.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                            {(log.user?.full_name || "?").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {log.user?.full_name || log.details?.user_name || "-"}
                            </div>
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${roleCfg.cls}`}>
                              {roleCfg.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${actionCfg.color}`}>
                          <i className={`${actionCfg.icon} text-[9px]`}></i>
                          {actionCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <i className={`${resourceCfg.icon} text-[10px] text-gray-400`}></i>
                          {resourceCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[250px]">
                        <div className="text-xs text-gray-500 truncate" title={buildDescription(log)}>
                          {buildDescription(log)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-gray-400">{log.ip_address || "-"}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-xs text-gray-500">
            عرض {((page - 1) * 25) + 1} - {Math.min(page * 25, total)} من {total.toLocaleString()} عملية
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-xs text-gray-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                    page === p
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
