import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMyAttendance } from '../../lib/jwt-api';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAttendance();
  }, [user]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentMyAttendance();
      setRecords(data.records || []);
      setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 });
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string; icon: string }> = {
      present: { label: 'حاضر', cls: 'bg-green-100 text-green-800', icon: 'fa-check-circle' },
      absent: { label: 'غائب', cls: 'bg-red-100 text-red-800', icon: 'fa-times-circle' },
      late: { label: 'متأخر', cls: 'bg-yellow-100 text-yellow-800', icon: 'fa-clock' },
      excused: { label: 'معذور', cls: 'bg-blue-100 text-blue-800', icon: 'fa-info-circle' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-800', icon: 'fa-question-circle' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium ${s.cls}`}>
        <i className={`fas ${s.icon} ml-1`}></i>
        {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fas fa-clipboard-check ml-2 text-green-500"></i>
            سجل الحضور
          </h1>
          <p className="text-gray-600 mt-1">سجل الحضور والغياب في المحاضرات</p>
        </div>
        <button
          onClick={loadAttendance}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <i className={`fas fa-sync-alt ml-2 ${loading ? 'animate-spin' : ''}`}></i>
          تحديث
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
          <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-green-200 text-center">
          <p className="text-xs text-green-600 mb-1">حاضر</p>
          <p className="text-2xl font-bold text-green-600">{loading ? '...' : stats.present}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-red-200 text-center">
          <p className="text-xs text-red-600 mb-1">غائب</p>
          <p className="text-2xl font-bold text-red-600">{loading ? '...' : stats.absent}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-yellow-200 text-center">
          <p className="text-xs text-yellow-600 mb-1">متأخر</p>
          <p className="text-2xl font-bold text-yellow-600">{loading ? '...' : stats.late}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-blue-200 text-center">
          <p className="text-xs text-blue-600 mb-1">معذور</p>
          <p className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.excused}</p>
        </div>
        <div className={`bg-white rounded-lg shadow p-4 border text-center ${stats.attendance_rate >= 75 ? 'border-green-200' : 'border-red-200'}`}>
          <p className="text-xs text-gray-500 mb-1">نسبة الحضور</p>
          <p className={`text-2xl font-bold ${stats.attendance_rate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
            {loading ? '...' : `${stats.attendance_rate}%`}
          </p>
        </div>
      </div>

      {/* Attendance Rate Visual */}
      {!loading && stats.total > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">نسبة الحضور الإجمالية</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                stats.attendance_rate >= 75 ? 'bg-green-500' :
                stats.attendance_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(stats.attendance_rate, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span className="font-bold">{stats.attendance_rate}%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : records.length > 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">المادة</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">الحصة</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">الوقت</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">وقت التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {record.class_session?.subject?.name || '-'}
                      {record.class_session?.subject?.code && (
                        <span className="text-xs text-gray-400 mr-1">({record.class_session.subject.code})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.class_session?.session_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.class_session?.session_date
                        ? new Date(record.class_session.session_date).toLocaleDateString('ar-SA')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.class_session?.start_time?.substring(0, 5) || '-'}
                      {record.class_session?.end_time && ` - ${record.class_session.end_time.substring(0, 5)}`}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.check_in_time ? record.check_in_time.substring(0, 5) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-clipboard-check text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات حضور</h3>
          <p className="text-gray-500">لم يتم تسجيل أي حضور بعد</p>
        </div>
      )}
    </div>
  );
}
