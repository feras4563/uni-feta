import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentPortalDashboard } from '../../lib/jwt-api';

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    enrolledSubjects: 0,
    totalCredits: 0,
    totalFees: 0,
    totalPaid: 0,
    totalBalance: 0,
    attendanceRate: 0,
    todayClasses: 0,
    publishedGrades: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
  const [currentEnrollments, setCurrentEnrollments] = useState<any[]>([]);
  const [recentInvoice, setRecentInvoice] = useState<any>(null);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const data = await fetchStudentPortalDashboard();
      setStudentInfo(data.student);
      setStats({
        enrolledSubjects: data.stats?.enrolled_subjects || 0,
        totalCredits: data.stats?.total_credits || 0,
        totalFees: data.stats?.total_fees || 0,
        totalPaid: data.stats?.total_paid || 0,
        totalBalance: data.stats?.total_balance || 0,
        attendanceRate: data.stats?.attendance_rate || 0,
        todayClasses: data.stats?.today_classes || 0,
        publishedGrades: data.stats?.published_grades || 0,
      });
      setTodayTimetable(data.today_timetable || []);
      setCurrentEnrollments(data.current_enrollments || []);
      setRecentInvoice(data.recent_invoice);
    } catch (error) {
      console.error('Failed to load student dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayName = DAY_NAMES[new Date().getDay()] || '';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {studentInfo?.photo_url ? (
                <img src={studentInfo.photo_url} alt="" className="w-16 h-16 rounded-full object-cover ml-4 border-2 border-gray-200" />
              ) : (
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center ml-4">
                  <i className="fas fa-user-graduate text-teal-600 text-2xl"></i>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحباً {studentInfo?.name || user?.fullName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {studentInfo?.department?.name ? `قسم ${studentInfo.department.name}` : user?.departmentName ? `قسم ${user.departmentName}` : 'طالب'}
                  {studentInfo?.year && <span className="text-gray-400 mr-2">• السنة {studentInfo.year}</span>}
                </p>
                {(studentInfo?.campus_id || user?.studentCampusId) && (
                  <div className="mt-1 text-sm text-gray-500">
                    <i className="fas fa-id-badge ml-1"></i>
                    الرقم الجامعي: {studentInfo?.campus_id || user?.studentCampusId}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-left ml-6">
                <div className="text-sm text-gray-500">اليوم</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <i className={`fas fa-sync-alt ml-2 ${loading ? 'animate-spin' : ''}`}></i>
                تحديث
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">التنقل السريع</h3>
            <div className="flex space-x-2 space-x-reverse">
              <button onClick={() => navigate('/student/subjects')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <i className="fas fa-book ml-2"></i>
                موادي
              </button>
              <button onClick={() => navigate('/student/grades')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <i className="fas fa-graduation-cap ml-2"></i>
                درجاتي
              </button>
              <button onClick={() => navigate('/student/fees')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <i className="fas fa-file-invoice-dollar ml-2"></i>
                رسومي
              </button>
              <button onClick={() => navigate('/student/schedule')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <i className="fas fa-calendar ml-2"></i>
                جدولي
              </button>
              <button onClick={() => navigate('/student/attendance')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <i className="fas fa-clipboard-check ml-2"></i>
                حضوري
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-book text-blue-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">المواد المسجلة</h3>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.enrolledSubjects}</p>
              <p className="text-xs text-gray-400">{stats.totalCredits} ساعة معتمدة</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">نسبة الحضور</h3>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : `${stats.attendanceRate}%`}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-graduation-cap text-purple-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">الدرجات المنشورة</h3>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.publishedGrades}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stats.totalBalance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <i className={`fas fa-file-invoice-dollar text-xl ${stats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">الرصيد المتبقي</h3>
              <p className={`text-2xl font-bold ${stats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {loading ? '...' : formatCurrency(stats.totalBalance)}
              </p>
              <p className="text-xs text-gray-400">من {formatCurrency(stats.totalFees)} إجمالي</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule + Current Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Today's Timetable */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <i className="fas fa-calendar-day ml-2 text-teal-500"></i>
            محاضرات اليوم ({todayName})
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayTimetable.length > 0 ? (
              todayTimetable.map((entry: any, index: number) => (
                <div key={entry.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-teal-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center ml-3">
                      <i className="fas fa-book text-teal-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {entry.subject?.name || 'مادة غير محددة'}
                        {entry.subject?.code && <span className="text-xs text-gray-500 mr-2">({entry.subject.code})</span>}
                      </h3>
                      <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                        {entry.teacher && <span><i className="fas fa-chalkboard-teacher ml-1"></i>{entry.teacher.name}</span>}
                        {entry.room && <span><i className="fas fa-door-open ml-1"></i>{entry.room.name || entry.room.code}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-teal-700">
                      {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <i className="fas fa-coffee text-gray-400"></i>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد محاضرات اليوم</h3>
                <p className="text-xs text-gray-500">يمكنك الاطلاع على جدولك الكامل من صفحة الجدول</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Enrolled Subjects */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <i className="fas fa-book-open ml-2 text-blue-500"></i>
            المواد المسجلة حالياً
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentEnrollments.length > 0 ? (
              currentEnrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center ml-3">
                      <i className="fas fa-book text-blue-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {enrollment.subject?.name || 'مادة غير محددة'}
                      </h3>
                      <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                        {enrollment.subject?.code && <span className="bg-gray-100 px-2 py-0.5 rounded">{enrollment.subject.code}</span>}
                        {enrollment.subject?.credits && <span>{enrollment.subject.credits} ساعات</span>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      enrollment.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      enrollment.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {enrollment.payment_status === 'paid' ? 'مدفوع' :
                       enrollment.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <i className="fas fa-book text-gray-400"></i>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد مواد مسجلة</h3>
                <p className="text-xs text-gray-500">لم يتم تسجيلك في أي مواد بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fee Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fee Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <i className="fas fa-file-invoice-dollar ml-2 text-orange-500"></i>
            ملخص الرسوم
          </h2>
          {recentInvoice ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">إجمالي الرسوم</span>
                <span className="font-bold text-gray-900">{formatCurrency(stats.totalFees)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">المبلغ المدفوع</span>
                <span className="font-bold text-green-700">{formatCurrency(stats.totalPaid)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${stats.totalBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <span className={`text-sm ${stats.totalBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>المتبقي</span>
                <span className={`font-bold ${stats.totalBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(stats.totalBalance)}</span>
              </div>
              <button
                onClick={() => navigate('/student/fees')}
                className="w-full mt-2 text-center text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                عرض كل الفواتير ←
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-file-invoice text-gray-400"></i>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
              <p className="text-xs text-gray-500">لم يتم إصدار أي فواتير بعد</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/student/grades')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-graduation-cap text-purple-600 ml-3"></i>
                <span className="font-medium text-gray-900">عرض الدرجات</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            <button
              onClick={() => navigate('/student/schedule')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-calendar-alt text-teal-600 ml-3"></i>
                <span className="font-medium text-gray-900">عرض الجدول الكامل</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            <button
              onClick={() => navigate('/student/attendance')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-clipboard-check text-green-600 ml-3"></i>
                <span className="font-medium text-gray-900">سجل الحضور</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            <button
              onClick={() => navigate('/student/fees')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-file-invoice-dollar text-orange-600 ml-3"></i>
                <span className="font-medium text-gray-900">الرسوم والفواتير</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
