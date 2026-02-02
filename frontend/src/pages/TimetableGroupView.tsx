import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, BookOpen, MapPin, Edit2 } from "lucide-react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { api } from "../lib/api-client";
import TimetableEntryEditModal from "../components/timetable/TimetableEntryEditModal";

const fetchGroupTimetable = async (groupId: string) => {
  return api.get<any>(`/timetable/group/${groupId}`);
};

export default function TimetableGroupView() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const { data: timetableData, isLoading, refetch } = useQuery({
    queryKey: ["group-timetable", groupId],
    queryFn: () => fetchGroupTimetable(groupId!),
    enabled: !!groupId,
  });

  if (isLoading) return <LoadingSpinner />;

  if (!timetableData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد بيانات للجدول</p>
        </div>
      </div>
    );
  }

  const { group, entries } = timetableData;

  // Days of the week
  const daysOfWeek = [
    { id: 0, name: 'الأحد' },
    { id: 1, name: 'الاثنين' },
    { id: 2, name: 'الثلاثاء' },
    { id: 3, name: 'الأربعاء' },
    { id: 4, name: 'الخميس' },
  ];

  // Time slots
  const timeSlots = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
  ];

  // Organize entries by day and time
  const getTimetableEntry = (dayId: number, timeSlot: { start: string; end: string }) => {
    return entries.find((entry: any) => {
      const entryStart = entry.start_time?.substring(0, 5);
      const entryEnd = entry.end_time?.substring(0, 5);
      return entry.day_of_week === dayId && entryStart === timeSlot.start && entryEnd === timeSlot.end;
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/timetable-generation')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          العودة
        </button>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            الجدول الدراسي - {group.name || 'المجموعة'}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">القسم: </span>
              <span className="font-medium">{group.department?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">الفصل الدراسي: </span>
              <span className="font-medium">{group.semester?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">عدد الحصص: </span>
              <span className="font-medium">{entries.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                  الوقت
                </th>
                {daysOfWeek.map((day) => (
                  <th
                    key={day.id}
                    className="border border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[150px]"
                  >
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slotIndex}>
                  <td className="border border-gray-200 p-3 bg-gray-50 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{slot.start} - {slot.end}</span>
                    </div>
                  </td>
                  {daysOfWeek.map((day) => {
                    const entry = getTimetableEntry(day.id, slot);
                    
                    return (
                      <td
                        key={day.id}
                        className={`border border-gray-200 p-3 ${
                          entry ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        {entry ? (
                          <div className="space-y-2 relative group">
                            <button
                              onClick={() => setEditingEntry(entry)}
                              className="absolute top-0 right-0 p-1 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                              title="تعديل الحصة"
                            >
                              <Edit2 className="h-3 w-3 text-blue-600" />
                            </button>
                            <div className="flex items-start gap-2">
                              <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="font-medium text-gray-900 text-sm">
                                {entry.subject?.name}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                {entry.teacher?.name}
                              </span>
                            </div>
                            {entry.room && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600">
                                  {entry.room.name}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 text-sm">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-3">الإحصائيات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">إجمالي الحصص: </span>
            <span className="font-medium">{entries.length}</span>
          </div>
          <div>
            <span className="text-gray-600">المواد: </span>
            <span className="font-medium">
              {new Set(entries.map((e: any) => e.subject_id)).size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">المدرسون: </span>
            <span className="font-medium">
              {new Set(entries.map((e: any) => e.teacher_id)).size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">القاعات: </span>
            <span className="font-medium">
              {new Set(entries.filter((e: any) => e.room_id).map((e: any) => e.room_id)).size}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <TimetableEntryEditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSuccess={() => {
            refetch();
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
