import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { api } from "@/lib/api-client";
import { Search, Clock, User, Filter, Activity } from "lucide-react";

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
  user?: {
    id: string;
    full_name: string;
    role: string;
    email: string;
  };
}

interface PaginatedResponse {
  data: ActionLog[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "إنشاء", color: "bg-green-100 text-green-800" },
  update: { label: "تعديل", color: "bg-blue-100 text-blue-800" },
  delete: { label: "حذف", color: "bg-red-100 text-red-800" },
  view: { label: "عرض", color: "bg-gray-100 text-gray-800" },
  enroll: { label: "تسجيل مواد", color: "bg-purple-100 text-purple-800" },
  register: { label: "تسجيل فصل", color: "bg-indigo-100 text-indigo-800" },
};

const RESOURCE_LABELS: Record<string, string> = {
  students: "الطلاب",
  "student-registration": "تسجيل الفصول",
  "student-enrollments": "تسجيل المواد",
  fees: "الرسوم",
  teachers: "المدرسين",
  departments: "الأقسام",
  subjects: "المقررات",
};

export default function ActionLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("per_page", "30");
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resource", resourceFilter);
    if (userFilter) params.set("user_id", userFilter);
    return params.toString();
  }, [page, actionFilter, resourceFilter, userFilter]);

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["action-logs", queryParams],
    queryFn: () => api.get(`/action-logs?${queryParams}`),
  });

  const { data: stats } = useQuery({
    queryKey: ["action-logs-stats"],
    queryFn: () => api.get<any>("/action-logs/statistics"),
  });

  const logs = data?.data || [];
  const totalPages = data?.last_page || 1;
  const total = data?.total || 0;

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date.toLocaleDateString("ar-LY", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  const getActionConfig = (action: string) =>
    ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-800" };

  const getResourceLabel = (resource: string) =>
    RESOURCE_LABELS[resource] || resource;

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      manager: { label: "مدير", cls: "bg-green-100 text-green-800" },
      staff: { label: "موظف", cls: "bg-blue-100 text-blue-800" },
      teacher: { label: "مدرس", cls: "bg-purple-100 text-purple-800" },
    };
    const c = map[role] || { label: role, cls: "bg-gray-100 text-gray-800" };
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${c.cls}`}>
        {c.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>تعذر تحميل سجل العمليات.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">سجل العمليات</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          متابعة جميع العمليات التي يقوم بها المستخدمون في النظام
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي العمليات</p>
              <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عمليات اليوم</p>
              <p className="text-xl font-bold text-gray-900">{stats?.today || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">النتائج الحالية</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>تصفية:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400"
          >
            <option value="">جميع العمليات</option>
            <option value="create">إنشاء</option>
            <option value="update">تعديل</option>
            <option value="delete">حذف</option>
            <option value="enroll">تسجيل مواد</option>
            <option value="register">تسجيل فصل</option>
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400"
          >
            <option value="">جميع الموارد</option>
            <option value="students">الطلاب</option>
            <option value="student-registration">تسجيل الفصول</option>
            <option value="student-enrollments">تسجيل المواد</option>
            <option value="fees">الرسوم</option>
          </select>
          {(actionFilter || resourceFilter) && (
            <button
              onClick={() => { setActionFilter(""); setResourceFilter(""); setUserFilter(""); setPage(1); }}
              className="text-xs text-gray-500 hover:text-gray-800 underline"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity className="mx-auto h-12 w-12 mb-3" />
            <p>لا توجد عمليات مسجلة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-right font-medium text-gray-600">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">المستخدم</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الدور</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">العملية</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">المورد</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">التفاصيل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const actionConfig = getActionConfig(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {log.user?.full_name || log.details?.user_name || "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {log.user?.email || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getRoleBadge(log.user?.role || log.details?.user_role || "unknown")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${actionConfig.color}`}>
                          {actionConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {getResourceLabel(log.resource)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {log.details?.student_name && (
                          <span>الطالب: {log.details.student_name}</span>
                        )}
                        {log.details?.subject_count && (
                          <span> | {log.details.subject_count} مقرر</span>
                        )}
                        {log.resource_id && (
                          <span className="font-mono text-gray-400 mr-1">#{log.resource_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">
                        {log.ip_address || "-"}
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
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            صفحة {page} من {totalPages} ({total} عملية)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              السابق
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
