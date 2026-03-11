import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMySchedule } from '../../lib/jwt-api';

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const DAY_COLORS: Record<number, string> = {
  0: 'border-red-300 bg-red-50',
  1: 'border-blue-300 bg-blue-50',
  2: 'border-green-300 bg-green-50',
  3: 'border-purple-300 bg-purple-50',
  4: 'border-orange-300 bg-orange-50',
  5: 'border-gray-300 bg-gray-50',
  6: 'border-teal-300 bg-teal-50',
};

export default function StudentSchedule() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadSchedule();
  }, [user]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentMySchedule();
      setTimetable(data.timetable || []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by day
  const byDay = timetable.reduce((acc: Record<number, any[]>, entry: any) => {
    const day = entry.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  // Sort days (Sunday=0 to Saturday=6), skip days with no classes
  const sortedDays = Object.keys(byDay)
    .map(Number)
    .sort((a, b) => a - b);

  const todayDow = new Date().getDay();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fas fa-calendar-alt ml-2 text-teal-500"></i>
            جدولي الدراسي
          </h1>
          <p className="text-gray-600 mt-1">الجدول الأسبوعي للمحاضرات</p>
        </div>
        <button
          onClick={loadSchedule}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <i className={`fas fa-sync-alt ml-2 ${loading ? 'animate-spin' : ''}`}></i>
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedDays.length > 0 ? (
        <div className="space-y-6">
          {sortedDays.map(day => (
            <div key={day} className={`bg-white rounded-lg shadow border-r-4 ${DAY_COLORS[day] || 'border-gray-300 bg-gray-50'}`}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    <i className="fas fa-calendar-day ml-2 text-gray-500"></i>
                    {DAY_NAMES[day] || `يوم ${day}`}
                  </h2>
                  {day === todayDow && (
                    <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">
                      <i className="fas fa-star ml-1"></i>
                      اليوم
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{byDay[day].length} محاضرة</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {byDay[day]
                  .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
                  .map((entry: any) => (
                    <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center ml-4">
                            <i className="fas fa-book text-teal-600"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {entry.subject?.name || 'مادة غير محددة'}
                              {entry.subject?.code && <span className="text-xs text-gray-500 mr-2">({entry.subject.code})</span>}
                            </h3>
                            <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500 mt-1">
                              {entry.teacher && (
                                <span><i className="fas fa-chalkboard-teacher ml-1"></i>{entry.teacher.name}</span>
                              )}
                              {entry.room && (
                                <span><i className="fas fa-door-open ml-1"></i>{entry.room.name || entry.room.code}{entry.room.building ? ` - ${entry.room.building}` : ''}</span>
                              )}
                              {entry.student_group && (
                                <span><i className="fas fa-users ml-1"></i>{entry.student_group.name || entry.student_group.group_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="bg-teal-100 text-teal-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                          </div>
                          {entry.time_slot?.label && (
                            <p className="text-xs text-gray-400 mt-1 text-center">{entry.time_slot.label}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-calendar text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد جدول دراسي</h3>
          <p className="text-gray-500">لم يتم إنشاء جدول دراسي لك بعد</p>
        </div>
      )}
    </div>
  );
}
