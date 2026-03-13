import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, fetchUnreadNotificationCount, markNotificationsAsRead, markAllNotificationsAsRead } from "@/lib/jwt-api";
import { Bell, Check, CheckCheck, X } from "lucide-react";

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: () => fetchUnreadNotificationCount(),
    refetchInterval: 30000,
  });

  const { data: notifData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({ limit: "20" }),
    enabled: open,
  });

  const unread = (countData as any)?.unread_count ?? 0;
  const notifications: any[] = (notifData as any)?.notifications ?? [];

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => markNotificationsAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notif: any) => {
    if (!notif.is_read) {
      markReadMutation.mutate([notif.id]);
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
    setOpen(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} س`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} يوم`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ maxHeight: "420px" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-900">الإشعارات</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  title="قراءة الكل"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  قراءة الكل
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
            {isLoading ? (
              <div className="text-center py-8 text-sm text-gray-500">جاري التحميل...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notif: any) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-right px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notif.is_read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{notif.title}</div>
                      {notif.body && <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.body}</div>}
                      <div className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
