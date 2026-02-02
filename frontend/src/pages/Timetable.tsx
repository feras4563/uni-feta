import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchTimetableEntries, 
  createTimetableEntry, 
  updateTimetableEntry, 
  deleteTimetableEntry,
  fetchSemesters,
  fetchDepartments,
  fetchStudentGroups,
  fetchSubjects,
  fetchTeachers,
  fetchRooms,
  fetchTimeSlots
} from "@/lib/api";
import { Plus, Search, Edit, Trash2, Calendar, Clock } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 1, label: "الأحد" },
  { value: 2, label: "الاثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
  { value: 6, label: "الجمعة" },
  { value: 7, label: "السبت" }
];

export default function Timetable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data: timetableEntries, isLoading } = useQuery({
    queryKey: ["timetable-entries", semesterFilter, departmentFilter, groupFilter],
    queryFn: () => fetchTimetableEntries(semesterFilter, departmentFilter, groupFilter),
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: studentGroups } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects(),
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers(),
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => fetchRooms(),
  });

  const { data: timeSlots } = useQuery({
    queryKey: ["time-slots"],
    queryFn: () => fetchTimeSlots(),
  });

  const filteredEntries = useMemo(() => {
    if (!timetableEntries) return [];
    return timetableEntries.filter(entry => {
      const matchesSearch = entry.subjects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.teachers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.rooms?.room_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [timetableEntries, searchTerm]);

  const handleAdd = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الدرس؟")) {
      try {
        await deleteTimetableEntry(id);
        queryClient.invalidateQueries({ queryKey: ["timetable-entries"] });
        alert("تم حذف الدرس بنجاح!");
      } catch (error: any) {
        alert("خطأ في حذف الدرس: " + error.message);
      }
    }
  };

  // Group entries by day for grid view
  const entriesByDay = useMemo(() => {
    const grouped: { [key: number]: any[] } = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day.value] = filteredEntries.filter(entry => entry.day_of_week === day.value);
    });
    return grouped;
  }, [filteredEntries]);

  if (isLoading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الجدول الدراسي</h1>
        <p className="text-gray-600">إدارة الجدول الدراسي والحصص</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{timetableEntries?.length || 0}</div>
              <div className="text-sm text-gray-600">إجمالي الحصص</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(timetableEntries?.map(entry => entry.subjects?.id)).size || 0}
              </div>
              <div className="text-sm text-gray-600">المواد المجدولة</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(timetableEntries?.map(entry => entry.teachers?.id)).size || 0}
              </div>
              <div className="text-sm text-gray-600">المدرسين المشاركين</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(timetableEntries?.map(entry => entry.rooms?.id)).size || 0}
              </div>
              <div className="text-sm text-gray-600">القاعات المستخدمة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="البحث في الجدول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الفصول</option>
              {semesters?.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الأقسام</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المجموعات</option>
              {studentGroups?.map(group => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                جدول
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                شبكة
              </button>
            </div>
            
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة حصة
            </button>
          </div>
        </div>
      </div>

      {/* Timetable Content */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">قائمة الحصص</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اليوم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدرس</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القاعة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {DAYS_OF_WEEK.find(d => d.value === entry.day_of_week)?.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.start_time} - {entry.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.subjects?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.teachers?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.rooms?.room_number} - {entry.rooms?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.student_groups?.group_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-900"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد حصص</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة حصة جديدة.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-8 gap-4">
            <div className="font-semibold text-gray-900">الوقت</div>
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="font-semibold text-gray-900 text-center">
                {day.label}
              </div>
            ))}
            
            {timeSlots?.map(slot => (
              <React.Fragment key={slot.id}>
                <div className="text-sm text-gray-600 py-4 border-t">
                  {slot.start_time} - {slot.end_time}
                </div>
                {DAYS_OF_WEEK.map(day => {
                  const dayEntries = entriesByDay[day.value]?.filter(entry => 
                    entry.start_time === slot.start_time
                  );
                  return (
                    <div key={`${slot.id}-${day.value}`} className="border-t py-2 min-h-[60px]">
                      {dayEntries?.map(entry => (
                        <div 
                          key={entry.id}
                          className="bg-blue-100 border border-blue-200 rounded p-2 mb-1 text-xs cursor-pointer hover:bg-blue-200"
                          onClick={() => handleEdit(entry)}
                        >
                          <div className="font-medium">{entry.subjects?.name}</div>
                          <div className="text-gray-600">{entry.teachers?.name}</div>
                          <div className="text-gray-600">{entry.rooms?.room_number}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Entry Modal */}
      {showModal && (
        <TimetableEntryModal
          entry={editingEntry}
          semesters={semesters || []}
          departments={departments || []}
          studentGroups={studentGroups || []}
          subjects={subjects || []}
          teachers={teachers || []}
          rooms={rooms || []}
          timeSlots={timeSlots || []}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["timetable-entries"] });
          }}
        />
      )}
    </div>
  );
}

// Timetable Entry Modal Component
function TimetableEntryModal({ 
  entry, 
  semesters, 
  departments, 
  studentGroups, 
  subjects, 
  teachers, 
  rooms, 
  timeSlots, 
  onClose, 
  onSave 
}: any) {
  const [form, setForm] = useState({
    semester_id: entry?.semester_id || "",
    department_id: entry?.department_id || "",
    group_id: entry?.group_id || "",
    subject_id: entry?.subject_id || "",
    teacher_id: entry?.teacher_id || "",
    room_id: entry?.room_id || "",
    time_slot_id: entry?.time_slot_id || "",
    day_of_week: entry?.day_of_week || 1,
    start_time: entry?.start_time || "",
    end_time: entry?.end_time || "",
    notes: entry?.notes || ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (entry) {
        await updateTimetableEntry(entry.id, form);
      } else {
        await createTimetableEntry(form);
      }
      onSave();
    } catch (error: any) {
      alert("خطأ في حفظ البيانات: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {entry ? "تعديل الحصة" : "إضافة حصة جديدة"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي</label>
            <select
              value={form.semester_id}
              onChange={(e) => setForm(prev => ({ ...prev, semester_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر الفصل</option>
              {semesters.map((semester: any) => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm(prev => ({ ...prev, department_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر القسم</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة</label>
            <select
              value={form.group_id}
              onChange={(e) => setForm(prev => ({ ...prev, group_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر المجموعة</option>
              {studentGroups.map((group: any) => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
            <select
              value={form.subject_id}
              onChange={(e) => setForm(prev => ({ ...prev, subject_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر المادة</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدرس</label>
            <select
              value={form.teacher_id}
              onChange={(e) => setForm(prev => ({ ...prev, teacher_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر المدرس</option>
              {teachers.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القاعة</label>
            <select
              value={form.room_id}
              onChange={(e) => setForm(prev => ({ ...prev, room_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر القاعة</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>{room.room_number} - {room.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اليوم</label>
            <select
              value={form.day_of_week}
              onChange={(e) => setForm(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وقت البداية</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وقت النهاية</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : (entry ? "تحديث" : "حفظ")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
