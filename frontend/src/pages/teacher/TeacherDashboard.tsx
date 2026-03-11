import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchTeacherPortalDashboard } from '../../lib/jwt-api';
import { formatLongDate, formatNumber, toLatinDigits } from '../../lib/utils';

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalStudents: 0,
    todaySessions: 0,
    totalGrades: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await fetchTeacherPortalDashboard();

      setTeacherInfo(data.teacher);

      setStats({
        totalSubjects: data.stats?.total_subjects || 0,
        totalStudents: data.stats?.total_students || 0,
        todaySessions: data.stats?.today_sessions || 0,
        totalGrades: data.stats?.total_grades || 0,
      });

      // Today's timetable entries (from the weekly schedule)
      setTodayTimetable(data.today_timetable || []);

      // Upcoming classes from timetable
      setUpcomingClasses(data.upcoming_classes || []);

      // Recent grades as activity
      setRecentActivity((data.recent_grades || []).map((g: any) => ({
        type: 'grade_added',
        title: `تم إضافة درجة ${g.grade_name} - ${g.subject?.name || ''}`,
        description: `${g.student?.name || ''} (${toLatinDigits(g.student?.campus_id || '')}) - ${formatNumber(g.grade_value || 0)}/${formatNumber(g.max_grade || 0)}`,
        icon: 'fa-graduation-cap',
        time: g.created_at
      })));

    } catch (error) {
      console.error('Failed to load teacher stats:', error);
      setStats({ totalSubjects: 0, totalStudents: 0, todaySessions: 0, totalGrades: 0 });
      setTodayTimetable([]);
      setUpcomingClasses([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const todayName = DAY_NAMES[new Date().getDay()] || '';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {teacherInfo?.photo_url ? (
                <img src={teacherInfo.photo_url} alt="" className="w-16 h-16 rounded-full object-cover ml-4 border-2 border-gray-200" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center ml-4">
                  <i className="fas fa-chalkboard-teacher text-gray-600 text-2xl"></i>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحباً {teacherInfo?.name || user?.fullName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {teacherInfo?.department?.name ? `قسم ${teacherInfo.department.name}` : user?.departmentName ? `قسم ${user.departmentName}` : 'عضو هيئة التدريس'}
                  {teacherInfo?.specialization && <span className="text-gray-400 mr-2">• {teacherInfo.specialization}</span>}
                </p>
                {(teacherInfo?.campus_id || user?.teacherCampusId) && (
                  <div className="mt-1 text-sm text-gray-500">
                    <i className="fas fa-id-badge ml-1"></i>
                    الرقم الوظيفي: {toLatinDigits(teacherInfo?.campus_id || user?.teacherCampusId)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-left ml-6">
                <div className="text-sm text-gray-500">اليوم</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatLongDate(new Date())}
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
                onClick={() => navigate('/teacher/students')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <i className="fas fa-user-graduate ml-2"></i>
                طلابي
              </button>
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

      {/* Today's Schedule + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Today's Timetable */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <i className="fas fa-calendar-day ml-2 text-purple-500"></i>
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
                      <div className="text-left">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayTimetable.length > 0 ? (
              todayTimetable.map((entry: any, index: number) => (
                <div key={entry.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center ml-3">
                      <i className="fas fa-book text-blue-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {entry.subject?.name || 'مادة غير محددة'}
                        {entry.subject?.code && <span className="text-xs text-gray-500 mr-2">({entry.subject.code})</span>}
                      </h3>
                      <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                        {entry.room && (
                          <span><i className="fas fa-door-open ml-1"></i>{entry.room.name || entry.room.code}</span>
                        )}
                        {entry.student_group && (
                          <span><i className="fas fa-users ml-1"></i>{entry.student_group.name || entry.student_group.group_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-700">
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
                <p className="text-xs text-gray-500">
                  يمكنك الاطلاع على جدولك الكامل من صفحة الجدول
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <i className="fas fa-clock ml-2 text-green-500"></i>
            المحاضرات القادمة
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
            ) : upcomingClasses.length > 0 ? (
              upcomingClasses.map((entry: any, index: number) => (
                <div key={entry.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center ml-3">
                      <i className="fas fa-book text-green-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {entry.subject?.name || 'مادة غير محددة'}
                      </h3>
                      <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                        <span className="text-green-700 font-medium">
                          <i className="fas fa-calendar ml-1"></i>
                          {entry.upcoming_day_name} - {toLatinDigits(entry.upcoming_date)}
                        </span>
                        {entry.room && (
                          <span><i className="fas fa-door-open ml-1"></i>{entry.room.name || entry.room.code}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-700">
                      {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <i className="fas fa-calendar text-gray-400"></i>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد محاضرات قادمة</h3>
                <p className="text-xs text-gray-500">
                  لم يتم إنشاء جدول دراسي لك بعد
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/teacher/grades')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-plus-circle text-blue-600 ml-3"></i>
                <span className="font-medium text-gray-900">إدخال درجات الطلاب</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            
            <button 
              onClick={() => navigate('/teacher/schedule')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-calendar-alt text-purple-600 ml-3"></i>
                <span className="font-medium text-gray-900">عرض الجدول الكامل</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
            
            <button 
              onClick={() => navigate('/teacher/students')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-user-graduate text-green-600 ml-3"></i>
                <span className="font-medium text-gray-900">عرض قوائم الطلاب</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>

            <button 
              onClick={() => navigate('/teacher/sessions')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center">
                <i className="fas fa-qrcode text-orange-600 ml-3"></i>
                <span className="font-medium text-gray-900">الحصص والحضور</span>
              </div>
              <i className="fas fa-chevron-left text-gray-500"></i>
            </button>
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
    </div>
  );
}
