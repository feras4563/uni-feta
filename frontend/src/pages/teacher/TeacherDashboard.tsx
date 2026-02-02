import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchTeacherStats, fetchTeacherSubjects, fetchTeacherSessions } from '../../lib/teacher-api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalStudents: 0,
    todaySessions: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      if (!user?.teacherId) {
        console.warn('No teacher ID found in user object, using fallback stats');
        // Use fallback stats when teacher ID is not available
        setStats({
          totalSubjects: 0,
          totalStudents: 0,
          todaySessions: 0,
          averageAttendance: 0
        });
        setUpcomingSessions([]);
        setRecentActivity([]);
        return;
      }

      // Fetch teacher stats and sessions in parallel
      const [teacherStats, sessions] = await Promise.all([
        fetchTeacherStats(user.teacherId),
        fetchTeacherSessions(user.teacherId)
      ]);

      setStats(teacherStats);

      // Filter upcoming sessions (today and future)
      const today = new Date().toISOString().split('T')[0];
      const upcoming = sessions
        .filter(session => session.session_date >= today && session.status !== 'completed')
        .slice(0, 3); // Show only next 3 sessions
      
      setUpcomingSessions(upcoming);

      // Create recent activity from recent sessions
      const recentSessions = sessions
        .filter(session => session.status === 'completed')
        .slice(0, 3);
      
      setRecentActivity(recentSessions.map(session => ({
        type: 'session_completed',
        title: `تم تسجيل حضور حصة ${session.subject?.name || 'غير محدد'}`,
        description: `${session.session_date} - ${session.room || 'غير محدد'}`,
        icon: 'fa-check',
        time: session.updated_at
      })));

    } catch (error) {
      console.error('Failed to load teacher stats:', error);
      // Use fallback stats on error
      setStats({
        totalSubjects: 0,
        totalStudents: 0,
        todaySessions: 0,
        averageAttendance: 0
      });
      setUpcomingSessions([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center ml-4">
                <i className="fas fa-chalkboard-teacher text-gray-600 text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحباً {user?.fullName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {user?.departmentName ? `قسم ${user.departmentName}` : 'عضو هيئة التدريس'}
                </p>
                {user?.teacherId && (
                  <div className="mt-1 text-sm text-gray-500">
                    معرف المدرس: {user.teacherId}
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
                onClick={loadStats}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
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
              <button
                onClick={() => navigate('/teacher/sessions')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <i className="fas fa-qrcode ml-2"></i>
                الحصص والحضور
              </button>
              <button
                onClick={() => navigate('/teacher/grades')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <i className="fas fa-graduation-cap ml-2"></i>
                الدرجات
              </button>
              <button
                onClick={() => navigate('/teacher/schedule')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <i className="fas fa-calendar ml-2"></i>
                الجدول
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <i className="fas fa-chalkboard-teacher text-gray-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">المواد المدرسة</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalSubjects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <i className="fas fa-user-graduate text-gray-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الطلاب</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <i className="fas fa-calendar-check text-gray-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">حصص اليوم</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.todaySessions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <i className="fas fa-chart-line text-gray-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">معدل الحضور</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${stats.averageAttendance}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/teacher/sessions')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-qrcode text-gray-600 ml-3"></i>
                <span className="font-medium text-gray-900">إنشاء رمز QR للحصة</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            
            <button 
              onClick={() => navigate('/teacher/grades')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-plus text-gray-600 ml-3"></i>
                <span className="font-medium text-gray-900">إضافة درجة جديدة</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            
            <button 
              onClick={() => navigate('/teacher/sessions')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-users text-gray-600 ml-3"></i>
                <span className="font-medium text-gray-900">عرض الحضور</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الحصص القادمة</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="text-left">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.map((session, index) => (
                <div key={session.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {session.subject?.name || session.session_name || 'حصة غير محددة'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {session.room || 'قاعة غير محددة'} - {session.session_date}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {session.start_time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.end_time ? `حتى ${session.end_time}` : 'غير محدد'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <i className="fas fa-calendar text-gray-400"></i>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد حصص قادمة</h3>
                <p className="text-xs text-gray-500">
                  يمكنك إضافة حصص جديدة من صفحة الحصص والحضور
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">النشاط الأخير</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full ml-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-gray-100 rounded-full ml-4">
                  <i className={`fas ${activity.icon} text-gray-600`}></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-clock text-gray-400"></i>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد أنشطة حديثة</h3>
              <p className="text-xs text-gray-500">
                سيتم عرض الأنشطة الأخيرة هنا عند بدء استخدام النظام
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
