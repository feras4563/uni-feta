import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchMySchedule } from '../../lib/jwt-api';

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const DAY_NAMES_EN: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

interface ScheduleEntry {
  type: string;
  subject: any;
  room: any;
  time_slot?: any;
  group?: any;
  start_time?: string;
  end_time?: string;
  subject_id?: string;
  class_type?: string;
}

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-red-100 border-red-300 text-red-800',
];

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const data = await fetchMySchedule();
      setScheduleData(data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build a color map for subjects
  const getSubjectColor = (subjectId: string, colorMap: Map<string, string>) => {
    if (!colorMap.has(subjectId)) {
      colorMap.set(subjectId, COLORS[colorMap.size % COLORS.length]);
    }
    return colorMap.get(subjectId)!;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل الجدول...</p>
        </div>
      </div>
    );
  }

  const timetable = scheduleData?.timetable || [];
  const classSchedules = scheduleData?.schedules || [];
  const colorMap = new Map<string, string>();

  // Group timetable entries by day
  const timetableByDay: Record<number, any[]> = {};
  timetable.forEach((entry: any) => {
    const day = entry.day_of_week;
    if (!timetableByDay[day]) timetableByDay[day] = [];
    timetableByDay[day].push(entry);
  });

  // Group class schedules by day
  const schedulesByDay: Record<number, any[]> = {};
  classSchedules.forEach((entry: any) => {
    const day = entry.day_of_week;
    if (!schedulesByDay[day]) schedulesByDay[day] = [];
    schedulesByDay[day].push(entry);
  });

  // Merge both into a unified view
  const allDays = [0, 1, 2, 3, 4]; // Sunday to Thursday

  const hasData = timetable.length > 0 || classSchedules.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">الجدول الدراسي</h1>
            <p className="text-gray-600 text-sm">جدول المحاضرات والحصص الخاص بك</p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-th ml-1"></i>
              شبكة
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-list ml-1"></i>
              قائمة
            </button>
            <button
              onClick={loadSchedule}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <i className="fas fa-sync-alt ml-1"></i>
              تحديث
            </button>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-calendar text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد جدول حالياً</h3>
          <p className="text-gray-500">لم يتم إنشاء جدول دراسي لك بعد. يرجى التواصل مع الإدارة.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b border-l border-gray-200 w-24">
                    اليوم
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b border-gray-200" colSpan={10}>
                    المحاضرات
                  </th>
                </tr>
              </thead>
              <tbody>
                {allDays.map(day => {
                  const dayTimetable = timetableByDay[day] || [];
                  const daySchedules = (schedulesByDay[day] || []).filter((s: any) => s.subject_id);
                  const allEntries: ScheduleEntry[] = [
                    ...dayTimetable.map((e: any) => ({
                      type: 'timetable',
                      subject: e.subject,
                      room: e.room,
                      time_slot: e.time_slot || e.timeSlot,
                      group: e.student_group || e.studentGroup || e.group,
                      start_time: e.start_time || e.time_slot?.start_time || e.timeSlot?.start_time,
                      end_time: e.end_time || e.time_slot?.end_time || e.timeSlot?.end_time,
                      subject_id: e.subject_id,
                    })),
                    ...daySchedules.map((e: any) => ({
                      type: 'schedule',
                      subject: e.subject,
                      room: e.room ? { name: e.room } : null,
                      start_time: e.start_time,
                      end_time: e.end_time,
                      subject_id: e.subject_id,
                      class_type: e.class_type,
                    })),
                  ].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

                  return (
                    <tr key={day} className="border-b border-gray-200">
                      <td className="px-4 py-4 border-l border-gray-200 bg-gray-50">
                        <div className="text-sm font-bold text-gray-900">{DAY_NAMES[day]}</div>
                        <div className="text-xs text-gray-500">{DAY_NAMES_EN[day]}</div>
                      </td>
                      <td className="px-4 py-3">
                        {allEntries.length === 0 ? (
                          <span className="text-gray-400 text-sm">لا توجد محاضرات</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {allEntries.map((entry, idx) => {
                              const color = entry.subject_id ? getSubjectColor(entry.subject_id, colorMap) : 'bg-gray-100 border-gray-300 text-gray-700';
                              return (
                                <div key={idx} className={`px-3 py-2 rounded-lg border ${color} min-w-[180px]`}>
                                  <div className="text-sm font-medium">
                                    {entry.subject?.name || 'غير محدد'}
                                  </div>
                                  <div className="text-xs mt-1 opacity-75">
                                    {entry.start_time && entry.end_time ? (
                                      <span>
                                        <i className="fas fa-clock ml-1"></i>
                                        {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                                      </span>
                                    ) : entry.time_slot ? (
                                      <span>
                                        <i className="fas fa-clock ml-1"></i>
                                        {entry.time_slot.label || entry.time_slot.code}
                                      </span>
                                    ) : null}
                                  </div>
                                  {entry.room && (
                                    <div className="text-xs mt-0.5 opacity-75">
                                      <i className="fas fa-door-open ml-1"></i>
                                      {entry.room.name || entry.room.code || entry.room}
                                    </div>
                                  )}
                                  {entry.group && (
                                    <div className="text-xs mt-0.5 opacity-75">
                                      <i className="fas fa-users ml-1"></i>
                                      {entry.group.name}
                                    </div>
                                  )}
                                  {entry.class_type && (
                                    <div className="text-xs mt-0.5 opacity-75">
                                      <i className="fas fa-tag ml-1"></i>
                                      {entry.class_type === 'lecture' ? 'محاضرة' :
                                       entry.class_type === 'lab' ? 'مختبر' :
                                       entry.class_type === 'tutorial' ? 'تمرين' : entry.class_type}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {allDays.map(day => {
            const dayTimetable = timetableByDay[day] || [];
            const daySchedules = (schedulesByDay[day] || []).filter((s: any) => s.subject_id);
            const allEntries: ScheduleEntry[] = [
              ...dayTimetable.map((e: any) => ({
                type: 'timetable',
                subject: e.subject,
                room: e.room,
                time_slot: e.time_slot || e.timeSlot,
                group: e.student_group || e.studentGroup || e.group,
                start_time: e.start_time || e.time_slot?.start_time || e.timeSlot?.start_time,
                end_time: e.end_time || e.time_slot?.end_time || e.timeSlot?.end_time,
                subject_id: e.subject_id,
              })),
              ...daySchedules.map((e: any) => ({
                type: 'schedule',
                subject: e.subject,
                room: e.room ? { name: e.room } : null,
                start_time: e.start_time,
                end_time: e.end_time,
                subject_id: e.subject_id,
                class_type: e.class_type,
              })),
            ].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

            if (allEntries.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">
                    {DAY_NAMES[day]} <span className="text-gray-500 font-normal">({DAY_NAMES_EN[day]})</span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {allEntries.map((entry, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center ml-3">
                          <i className="fas fa-book text-blue-600"></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.subject?.name || 'غير محدد'}
                            {entry.subject?.code && (
                              <span className="text-xs text-gray-500 mr-2">({entry.subject.code})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                            {entry.room && (
                              <span><i className="fas fa-door-open ml-1"></i>{entry.room.name || entry.room}</span>
                            )}
                            {entry.group && (
                              <span><i className="fas fa-users ml-1"></i>{entry.group.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        {entry.start_time && entry.end_time ? (
                          <div className="text-sm font-medium text-gray-700">
                            {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                          </div>
                        ) : entry.time_slot ? (
                          <div className="text-sm font-medium text-gray-700">
                            {entry.time_slot.label || entry.time_slot.code}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
