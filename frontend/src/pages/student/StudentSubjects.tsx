import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMySubjects } from '../../lib/jwt-api';

export default function StudentSubjects() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentMySubjects();
      setEnrollments(data || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? enrollments : enrollments.filter(e => e.status === filter);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      enrolled: { label: 'مسجل', cls: 'bg-blue-100 text-blue-800' },
      active: { label: 'نشط', cls: 'bg-green-100 text-green-800' },
      completed: { label: 'مكتمل', cls: 'bg-gray-100 text-gray-800' },
      dropped: { label: 'منسحب', cls: 'bg-red-100 text-red-800' },
      failed: { label: 'راسب', cls: 'bg-red-100 text-red-800' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.cls}`}>{s.label}</span>;
  };

  const getPaymentBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      paid: { label: 'مدفوع', cls: 'bg-green-100 text-green-800' },
      partial: { label: 'جزئي', cls: 'bg-yellow-100 text-yellow-800' },
      unpaid: { label: 'غير مدفوع', cls: 'bg-red-100 text-red-800' },
    };
    const s = map[status] || { label: status || 'غير محدد', cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs rounded-full ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          <i className="fas fa-book ml-2 text-blue-500"></i>
          موادي الدراسية
        </h1>
        <p className="text-gray-600 mt-1">جميع المواد المسجلة في الفصول الدراسية</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-sm text-gray-600">تصفية:</span>
          {[
            { value: 'all', label: 'الكل' },
            { value: 'enrolled', label: 'مسجل' },
            { value: 'active', label: 'نشط' },
            { value: 'completed', label: 'مكتمل' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === f.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="text-sm text-gray-400 mr-4">({filtered.length} مادة)</span>
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((enrollment: any) => (
            <div key={enrollment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center ml-3">
                      <i className="fas fa-book text-blue-600"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{enrollment.subject?.name || 'مادة غير محددة'}</h3>
                      {enrollment.subject?.code && (
                        <span className="text-xs text-gray-500">{enrollment.subject.code}</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(enrollment.status)}
                </div>

                <div className="space-y-2 text-sm">
                  {enrollment.subject?.credits && (
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-clock ml-2 text-gray-400 w-4"></i>
                      <span>{enrollment.subject.credits} ساعات معتمدة</span>
                    </div>
                  )}
                  {enrollment.subject?.department?.name && (
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-building ml-2 text-gray-400 w-4"></i>
                      <span>{enrollment.subject.department.name}</span>
                    </div>
                  )}
                  {enrollment.semester?.name && (
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-calendar ml-2 text-gray-400 w-4"></i>
                      <span>{enrollment.semester.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-xs text-gray-500">الدفع:</span>
                    {getPaymentBadge(enrollment.payment_status)}
                  </div>
                  {enrollment.attendance_allowed ? (
                    <span className="text-xs text-green-600"><i className="fas fa-check-circle ml-1"></i>الحضور مسموح</span>
                  ) : (
                    <span className="text-xs text-red-600"><i className="fas fa-times-circle ml-1"></i>الحضور غير مسموح</span>
                  )}
                </div>

                {enrollment.grade !== null && enrollment.grade !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">الدرجة النهائية:</span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-bold text-gray-900">{enrollment.grade}</span>
                        {enrollment.grade_letter && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-bold">{enrollment.grade_letter}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-book text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مواد</h3>
          <p className="text-gray-500">لم يتم تسجيلك في أي مواد بعد</p>
        </div>
      )}
    </div>
  );
}
