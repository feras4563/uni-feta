import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import type { APIClientError } from '../lib/api-client';
import { deleteTimetableEntry, fetchScheduleOverview, fetchTeachers } from '../lib/jwt-api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

type SelectOption = {
  id: string;
  name: string;
  name_en?: string;
  study_year_id?: string;
};

type ScheduleEntry = {
  id: string;
  source_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  department: SelectOption | null;
  teacher: SelectOption | null;
  subject: { id: string; name: string; code?: string | null } | null;
  student_group: { id: string; name: string } | null;
  room: { id?: string | null; name: string; code?: string | null; building?: string | null } | null;
  time_slot: { id: string; code: string; label: string } | null;
  semester: { id: string; name: string; study_year_id: string } | null;
};

type ScheduleOverviewResponse = {
  entries: ScheduleEntry[];
  stats: { total_entries: number };
  filters: {
    departments: SelectOption[];
    study_years: SelectOption[];
    semesters: (SelectOption & { study_year_id: string })[];
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getErrorDetails(error: unknown) {
  const apiError = error as APIClientError | undefined;
  return apiError?.details?.length ? apiError.details : [];
}

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

function formatTime(value?: string) {
  if (!value) return '--:--';
  return value.substring(0, 5);
}

export default function SchedulingPage() {
  const queryClient = useQueryClient();
  const { canDelete } = usePermissions();
  const [departmentId, setDepartmentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studyYearId, setStudyYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [deleteError, setDeleteError] = useState<{ message: string; details: string[] } | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const canDeleteTimetable = canDelete('timetable');

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (departmentId) params.department_id = departmentId;
    if (teacherId) params.teacher_id = teacherId;
    if (semesterId) params.semester_id = semesterId;
    else if (studyYearId) params.study_year_id = studyYearId;
    return params;
  }, [departmentId, teacherId, studyYearId, semesterId]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<ScheduleOverviewResponse>({
    queryKey: ['schedule-overview', departmentId, teacherId, studyYearId, semesterId],
    queryFn: () => fetchScheduleOverview(queryParams),
  });

  const { data: teachers = [] } = useQuery<SelectOption[]>({
    queryKey: ['schedule-teachers', departmentId],
    queryFn: () => fetchTeachers('', true, departmentId || undefined),
  });

  const groupedEntries = useMemo(() => {
    const groups: Record<number, ScheduleEntry[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    (data?.entries || []).forEach((entry) => {
      if (groups[entry.day_of_week] !== undefined) groups[entry.day_of_week].push(entry);
    });
    Object.values(groups).forEach((d) => d.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return groups;
  }, [data?.entries]);

  const filteredSemesters = useMemo(() => {
    const all = data?.filters?.semesters || [];
    return studyYearId ? all.filter((s) => s.study_year_id === studyYearId) : all;
  }, [data?.filters?.semesters, studyYearId]);

  const clearFilters = () => {
    setDepartmentId('');
    setTeacherId('');
    setStudyYearId('');
    setSemesterId('');
    setDeleteError(null);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);

    if (teacherId && !teachers.some((teacher) => teacher.id === teacherId)) {
      setTeacherId('');
    }
  };

  const handleDelete = async (entry: ScheduleEntry) => {
    if (!canDeleteTimetable || !entry.source_id) return;

    const confirmed = confirm(`هل أنت متأكد من حذف حصة ${entry.subject?.name || 'هذه المادة'}؟`);
    if (!confirmed) return;

    setDeletingEntryId(entry.id);
    setDeleteError(null);

    try {
      await deleteTimetableEntry(entry.source_id);
      await queryClient.invalidateQueries({ queryKey: ['schedule-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['timetable-entries'] });
    } catch (deleteRequestError) {
      setDeleteError({
        message: getErrorMessage(deleteRequestError, 'تعذر حذف الحصة'),
        details: getErrorDetails(deleteRequestError),
      });
    } finally {
      setDeletingEntryId(null);
    }
  };

  const hasEntries = (data?.entries || []).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-calendar-alt text-blue-600 ml-3"></i>
                الجدول الدراسي
              </h1>
              <p className="text-gray-600 mt-2">
                عرض الجدول الدراسي مع تصفية حسب القسم والمدرس والسنة الدراسية والفصل
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className={`fas fa-sync-alt ml-2 ${isFetching ? 'animate-spin' : ''}`}></i>
              تحديث
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-building text-blue-500 ml-2"></i>
                التخصص
              </label>
              <select
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
              >
                <option value="">كل التخصصات</option>
                {(data?.filters?.departments || []).map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-chalkboard-teacher text-green-500 ml-2"></i>
                المدرس
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
              >
                <option value="">كل المدرسين</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-calendar-alt text-indigo-500 ml-2"></i>
                السنة الدراسية
              </label>
              <select
                value={studyYearId}
                onChange={(e) => { setStudyYearId(e.target.value); setSemesterId(''); }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
              >
                <option value="">كل السنوات</option>
                {(data?.filters?.study_years || []).map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-calendar-week text-purple-500 ml-2"></i>
                الفصل الدراسي
              </label>
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
              >
                <option value="">كل الفصول</option>
                {filteredSemesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <i className="fas fa-times ml-2"></i>
              مسح الفلاتر
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-10">
            <LoadingSpinner className="py-8" />
          </div>
        ) : error ? (
          <ErrorMessage message="فشل في تحميل بيانات الجداول" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">قائمة الجداول</h2>

              {deleteError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="font-semibold mb-2">{deleteError.message}</div>
                  {deleteError.details.length > 0 && (
                    <ul className="space-y-1 pr-4 list-disc">
                      {deleteError.details.map((detail, index) => (
                        <li key={`${detail}-${index}`}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!hasEntries ? (
                <div className="text-center py-10 text-gray-500">
                  <i className="fas fa-calendar-times text-3xl mb-3"></i>
                  <p>لا توجد جداول متاحة بهذه الفلاتر حالياً.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700">
                        <th className="px-3 py-2 text-right">اليوم</th>
                        <th className="px-3 py-2 text-right">الوقت</th>
                        <th className="px-3 py-2 text-right">المادة</th>
                        <th className="px-3 py-2 text-right">المدرس</th>
                        <th className="px-3 py-2 text-right">التخصص</th>
                        <th className="px-3 py-2 text-right">المجموعة/القاعة</th>
                        {canDeleteTimetable ? <th className="px-3 py-2 text-right">الإجراءات</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.entries || []).map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2">{DAY_NAMES[entry.day_of_week] ?? `يوم ${entry.day_of_week}`}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </td>
                          <td className="px-3 py-2">
                            {entry.subject?.name || '-'}
                            {entry.subject?.code ? <span className="text-xs text-gray-500 mr-2">({entry.subject.code})</span> : null}
                          </td>
                          <td className="px-3 py-2">{entry.teacher?.name || '-'}</td>
                          <td className="px-3 py-2">{entry.department?.name || '-'}</td>
                          <td className="px-3 py-2">
                            {entry.student_group?.name || '-'}
                            {entry.room?.name ? <span className="text-xs text-gray-500 mr-2">{entry.room.name}</span> : null}
                          </td>
                          {canDeleteTimetable ? (
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleDelete(entry)}
                                disabled={deletingEntryId === entry.id}
                                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingEntryId === entry.id ? 'جاري الحذف...' : 'حذف'}
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">العرض الأسبوعي</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Object.entries(groupedEntries).map(([day, entries]) => (
                  <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                      {DAY_NAMES[Number(day)] ?? `يوم ${day}`}
                    </div>
                    <div className="p-3 space-y-2 min-h-[120px]">
                      {entries.length === 0 ? (
                        <div className="text-xs text-gray-400">لا توجد حصص</div>
                      ) : (
                        entries.map((entry) => (
                          <div key={entry.id} className="p-2 rounded-md bg-blue-50 border border-blue-100">
                            <div className="text-xs text-blue-800 font-semibold">
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </div>
                            <div className="text-sm text-gray-900">{entry.subject?.name || 'مادة غير محددة'}</div>
                            <div className="text-xs text-gray-600">{entry.teacher?.name || '-'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
