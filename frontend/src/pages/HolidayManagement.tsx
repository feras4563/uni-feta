import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHoliday,
  deleteHoliday,
  fetchHolidays,
  fetchSemesters,
  syncHolidaySchedule,
  type Holiday,
} from '@/lib/jwt-api';
import { CalendarDays, Plus, RefreshCw, Trash2 } from 'lucide-react';

const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function normalizeDate(value: Date): string {
  return value.toISOString().split('T')[0];
}

function isDateWithinHoliday(date: string, holiday: Holiday): boolean {
  return date >= holiday.start_date && date <= holiday.end_date;
}

export default function HolidayManagement() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedSemester, setSelectedSemester] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    start_date: normalizeDate(new Date()),
    end_date: normalizeDate(new Date()),
    is_recurring: false,
  });
  const [syncResult, setSyncResult] = useState<null | {
    created: number;
    updated: number;
    cancelled: number;
    skipped_holidays: number;
    total_entries: number;
  }>(null);

  const { data: holidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: fetchHolidays,
  });

  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: fetchSemesters,
  });

  const createMutation = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setFormData((prev) => ({ ...prev, name: '' }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncHolidaySchedule,
    onSuccess: (response) => {
      setSyncResult(response.result);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-sessions'] });
    },
  });

  const monthDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstDay.getDay();

    const cells: Array<{ type: 'blank' } | { type: 'day'; date: string; day: number }> = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ type: 'blank' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      cells.push({
        type: 'day',
        date: normalizeDate(date),
        day,
      });
    }

    return cells;
  }, [selectedMonth]);

  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>();

    monthDays.forEach((cell) => {
      if (cell.type !== 'day') return;
      const matches = holidays.filter((holiday) => isDateWithinHoliday(cell.date, holiday));
      if (matches.length > 0) {
        map.set(cell.date, matches);
      }
    });

    return map;
  }, [monthDays, holidays]);

  const handleCalendarDayClick = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      start_date: date,
      end_date: date,
    }));
  };

  const handleCreateHoliday = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return;

    createMutation.mutate({
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_recurring: formData.is_recurring,
    });
  };

  const handleSyncSchedule = () => {
    if (!selectedSemester) return;
    syncMutation.mutate(selectedSemester);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة العطل الأكاديمية</h1>
              <p className="text-sm text-gray-500 mt-1">تحديد العطل اليومية أو الفترات وإعادة مزامنة الحصص</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <CalendarDays className="h-4 w-4" />
              إجمالي العطل: {holidays.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">عرض تقويمي</h2>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {holidaysLoading ? (
              <div className="h-56 flex items-center justify-center text-gray-500">جاري تحميل العطل...</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-xs text-center text-gray-500 py-2 font-medium">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((cell, index) => {
                    if (cell.type === 'blank') {
                      return <div key={`blank-${index}`} className="h-24 rounded-lg bg-gray-50 border border-gray-100" />;
                    }

                    const dayHolidays = holidayByDate.get(cell.date) || [];
                    const isHoliday = dayHolidays.length > 0;

                    return (
                      <button
                        type="button"
                        key={cell.date}
                        onClick={() => handleCalendarDayClick(cell.date)}
                        className={`h-24 rounded-lg border p-2 text-right transition-colors ${
                          isHoliday
                            ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">{cell.day}</div>
                        {isHoliday && (
                          <div className="mt-1 space-y-1">
                            {dayHolidays.slice(0, 2).map((holiday) => (
                              <div key={`${cell.date}-${holiday.id}`} className="text-[11px] text-rose-700 truncate">
                                {holiday.name}
                              </div>
                            ))}
                            {dayHolidays.length > 2 && (
                              <div className="text-[10px] text-rose-600">+{dayHolidays.length - 2} أكثر</div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">إضافة عطلة</h2>
              <form onSubmit={handleCreateHoliday} className="space-y-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم العطلة"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_recurring: e.target.checked }))}
                  />
                  عطلة متكررة سنوياً
                </label>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ العطلة'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">مزامنة الجدول</h2>
              <div className="space-y-3">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">اختر الفصل الدراسي</option>
                  {semesters.map((semester: any) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSyncSchedule}
                  disabled={!selectedSemester || syncMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncMutation.isPending ? 'جاري المزامنة...' : 'Sync Schedule'}
                </button>

                {syncResult && (
                  <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 space-y-1">
                    <div>Sessions Created: {syncResult.created}</div>
                    <div>Sessions Updated: {syncResult.updated}</div>
                    <div>Sessions Cancelled: {syncResult.cancelled}</div>
                    <div>Holiday Skips: {syncResult.skipped_holidays}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">قائمة العطل</h2>
          {holidays.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد عطل مسجلة حالياً.</p>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{holiday.name}</p>
                    <p className="text-xs text-gray-500">
                      {holiday.start_date} → {holiday.end_date}
                      {holiday.is_recurring ? ' (متكررة)' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(holiday.id)}
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                    title="حذف"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
