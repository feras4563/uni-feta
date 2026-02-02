import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchDepartments, 
  fetchSemesters, 
  fetchStudentGroups,
  fetchTeachers,
  fetchSubjects,
  fetchRooms,
  fetchTimeSlots,
  fetchTimetableEntries,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  fetchTeacherSubjects,
  getRegisteredStudentsBySemester
} from "@/lib/api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock,
  Users,
  BookOpen,
  Building,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 1, label: "الأحد" },
  { value: 2, label: "الاثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
  { value: 6, label: "الجمعة" },
  { value: 7, label: "السبت" }
];

const TIME_SLOTS = [
  { start: "08:00", end: "09:30", label: "الحصة الأولى" },
  { start: "09:45", end: "11:15", label: "الحصة الثانية" },
  { start: "11:30", end: "13:00", label: "الحصة الثالثة" },
  { start: "13:15", end: "14:45", label: "الحصة الرابعة" },
  { start: "15:00", end: "16:30", label: "الحصة الخامسة" },
  { start: "16:45", end: "18:15", label: "الحصة السادسة" }
];

export default function EnhancedTimetableGeneration() {
  const queryClient = useQueryClient();
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAutoGeneration, setShowAutoGeneration] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: studentGroups } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(),
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers(),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects(),
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => fetchRooms(),
  });

  const { data: timeSlots } = useQuery({
    queryKey: ["time-slots"],
    queryFn: () => fetchTimeSlots(),
  });

  // Fetch timetable entries for selected filters
  const { data: timetableEntries, isLoading: timetableLoading } = useQuery({
    queryKey: ["timetable-entries", selectedDepartment, selectedSemester, selectedGroup],
    queryFn: () => fetchTimetableEntries(selectedSemester, selectedDepartment, selectedGroup),
    enabled: !!(selectedDepartment && selectedSemester)
  });

  // Filter student groups by selected department and semester
  const filteredGroups = useMemo(() => {
    if (!studentGroups || !selectedDepartment || !selectedSemester) return [];
    return studentGroups.filter(group => 
      group.department_id === selectedDepartment && 
      group.semester_id === selectedSemester
    );
  }, [studentGroups, selectedDepartment, selectedSemester]);

  // Get teacher-subject assignments for the selected department and semester
  const { data: teacherAssignments } = useQuery({
    queryKey: ["teacher-assignments", selectedDepartment, selectedSemester],
    queryFn: async () => {
      if (!teachers || !selectedDepartment || !selectedSemester) return [];
      
      console.log('🔍 Fetching teacher assignments for:', {
        selectedDepartment,
        selectedSemester,
        teachersCount: teachers.length
      });
      
      // Direct query to teacher_subjects table instead of using fetchTeacherSubjects
      const { data: assignments, error } = await supabase
        .from('teacher_subjects')
        .select(`
          *,
          subject:subjects(id, name, code, credits),
          department:departments(id, name, name_en),
          teacher:teachers(id, name, email)
        `)
        .eq('department_id', selectedDepartment)
        .eq('semester_id', selectedSemester)
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Error fetching assignments:', error);
        return [];
      }
      
      console.log('📚 Direct assignments found:', assignments?.length || 0);
      console.log('📋 Assignments data:', assignments);
      
      return assignments || [];
    },
    enabled: !!(teachers && selectedDepartment && selectedSemester)
  });

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

  const handleAutoGeneration = async () => {
    if (!selectedDepartment || !selectedSemester) {
      alert("يرجى اختيار القسم والفصل الدراسي أولاً");
      return;
    }

    console.log('🚀 Starting auto generation with:', {
      selectedDepartment,
      selectedSemester,
      teacherAssignments: teacherAssignments?.length || 0,
      filteredGroups: filteredGroups?.length || 0,
      rooms: rooms?.length || 0
    });

    try {
      // Get available teacher-subject assignments
      const availableAssignments = teacherAssignments || [];
      console.log('📋 Available assignments:', availableAssignments);
      
      if (availableAssignments.length === 0) {
        console.error('❌ No assignments found. Debug info:', {
          selectedDepartment,
          selectedSemester,
          teachersCount: teachers?.length || 0,
          allAssignments: teacherAssignments
        });
        alert("لا توجد تكليفات مدرسين بالمواد للقسم والفصل المحددين");
        return;
      }

      // Get available groups
      const availableGroups = filteredGroups;
      if (availableGroups.length === 0) {
        alert("لا توجد مجموعات طلاب للقسم والفصل المحددين");
        return;
      }

      // Get available rooms
      const availableRooms = rooms || [];
      if (availableRooms.length === 0) {
        alert("لا توجد قاعات متاحة");
        return;
      }

      // Generate timetable entries
      const generatedEntries = await generateTimetableEntries(
        availableAssignments,
        availableGroups,
        availableRooms,
        selectedDepartment,
        selectedSemester
      );

      // Save generated entries
      for (const entry of generatedEntries) {
        try {
          await createTimetableEntry(entry);
        } catch (error) {
          console.warn("Failed to create timetable entry:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["timetable-entries"] });
      alert(`تم إنشاء ${generatedEntries.length} درس في الجدول الدراسي`);
    } catch (error: any) {
      alert("خطأ في إنشاء الجدول التلقائي: " + error.message);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    if (!timetableEntries || !teacherAssignments || !filteredGroups) return null;
    
    const totalEntries = timetableEntries.length;
    const uniqueSubjects = new Set(timetableEntries.map(e => e.subject_id)).size;
    const uniqueTeachers = new Set(timetableEntries.map(e => e.teacher_id)).size;
    const uniqueGroups = new Set(timetableEntries.map(e => e.group_id)).size;
    const availableAssignments = teacherAssignments.length;
    
    return {
      totalEntries,
      uniqueSubjects,
      uniqueTeachers,
      uniqueGroups,
      availableAssignments,
      totalGroups: filteredGroups.length
    };
  }, [timetableEntries, teacherAssignments, filteredGroups]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء الجدول الدراسي المحسن</h1>
        <p className="text-gray-600">إنشاء وإدارة الجدول الدراسي بناءً على تكليفات المدرسين والمجموعات</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalEntries}</div>
                <div className="text-sm text-gray-600">إجمالي الدروس</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <div className="text-2xl font-bold text-gray-900">{stats.uniqueSubjects}</div>
                <div className="text-sm text-gray-600">المواد المجدولة</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="mr-4">
                <div className="text-2xl font-bold text-gray-900">{stats.uniqueTeachers}</div>
                <div className="text-sm text-gray-600">المدرسين المشاركين</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-orange-600" />
              <div className="mr-4">
                <div className="text-2xl font-bold text-gray-900">{stats.uniqueGroups}</div>
                <div className="text-sm text-gray-600">المجموعات المجدولة</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-indigo-600" />
              <div className="mr-4">
                <div className="text-2xl font-bold text-gray-900">{stats.availableAssignments}</div>
                <div className="text-sm text-gray-600">التكليفات المتاحة</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-pink-600" />
              <div className="mr-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalGroups}</div>
                <div className="text-sm text-gray-600">المجموعات المتاحة</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedGroup("");
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر القسم</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedGroup("");
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الفصل</option>
              {semesters?.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedDepartment || !selectedSemester}
            >
              <option value="">جميع المجموعات</option>
              {filteredGroups.map(group => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                شبكة
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                جدول
              </button>
            </div>
            
            <button
              onClick={handleAutoGeneration}
              disabled={!selectedDepartment || !selectedSemester}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              إنشاء تلقائي
            </button>
            
            <button
              onClick={handleAdd}
              disabled={!selectedDepartment || !selectedSemester}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              إضافة درس
            </button>
          </div>
        </div>
      </div>

      {/* Timetable Display */}
      {selectedDepartment && selectedSemester ? (
        <TimetableDisplay
          entries={timetableEntries || []}
          viewMode={viewMode}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={timetableLoading}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">اختر القسم والفصل الدراسي</h3>
          <p className="mt-1 text-sm text-gray-500">لبدء إنشاء وإدارة الجدول الدراسي</p>
        </div>
      )}

      {/* Timetable Entry Modal */}
      {showModal && (
        <TimetableEntryModal
          entry={editingEntry}
          departments={departments || []}
          semesters={semesters || []}
          studentGroups={filteredGroups}
          subjects={subjects || []}
          teachers={teachers || []}
          rooms={rooms || []}
          timeSlots={timeSlots || []}
          selectedDepartment={selectedDepartment}
          selectedSemester={selectedSemester}
          teacherAssignments={teacherAssignments || []}
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

// Timetable Display Component
function TimetableDisplay({ entries, viewMode, onEdit, onDelete, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
        <p className="mt-2 text-sm text-gray-600">جاري تحميل الجدول...</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return <TimetableGrid entries={entries} onEdit={onEdit} onDelete={onDelete} />;
  }

  return <TimetableTable entries={entries} onEdit={onEdit} onDelete={onDelete} />;
}

// Timetable Grid Component
function TimetableGrid({ entries, onEdit, onDelete }: any) {
  const entriesByDayAndTime = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    DAYS_OF_WEEK.forEach(day => {
      TIME_SLOTS.forEach(slot => {
        const key = `${day.value}-${slot.start}`;
        grouped[key] = entries.filter((entry: any) => 
          entry.day_of_week === day.value && entry.start_time === slot.start
        );
      });
    });
    return grouped;
  }, [entries]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-8 gap-2">
        <div className="font-semibold text-gray-900 text-center py-2">الوقت</div>
        {DAYS_OF_WEEK.map(day => (
          <div key={day.value} className="font-semibold text-gray-900 text-center py-2">
            {day.label}
          </div>
        ))}
        
        {TIME_SLOTS.map(slot => (
          <React.Fragment key={slot.start}>
            <div className="text-sm text-gray-600 py-4 border-t text-center">
              {slot.start} - {slot.end}
            </div>
            {DAYS_OF_WEEK.map(day => {
              const key = `${day.value}-${slot.start}`;
              const dayEntries = entriesByDayAndTime[key] || [];
              return (
                <div key={`${slot.start}-${day.value}`} className="border-t py-2 min-h-[80px]">
                  {dayEntries.map((entry: any) => (
                    <div 
                      key={entry.id}
                      className="bg-blue-100 border border-blue-200 rounded p-2 mb-1 text-xs cursor-pointer hover:bg-blue-200"
                      onClick={() => onEdit(entry)}
                    >
                      <div className="font-medium">{entry.subjects?.name}</div>
                      <div className="text-gray-600">{entry.teachers?.name}</div>
                      <div className="text-gray-600">{entry.student_groups?.group_name}</div>
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
  );
}

// Timetable Table Component
function TimetableTable({ entries, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">قائمة الدروس</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اليوم</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدرس</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المجموعة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القاعة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry: any) => (
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
                  {entry.student_groups?.group_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.rooms?.room_number} - {entry.rooms?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(entry)}
                      className="text-blue-600 hover:text-blue-900"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
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

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد دروس</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة درس جديد أو استخدم الإنشاء التلقائي.</p>
        </div>
      )}
    </div>
  );
}

// Timetable Entry Modal Component
function TimetableEntryModal({ 
  entry, 
  departments, 
  semesters, 
  studentGroups, 
  subjects, 
  teachers, 
  rooms, 
  timeSlots,
  selectedDepartment,
  selectedSemester,
  teacherAssignments,
  onClose, 
  onSave 
}: any) {
  const [form, setForm] = useState({
    semester_id: entry?.semester_id || selectedSemester || "",
    department_id: entry?.department_id || selectedDepartment || "",
    group_id: entry?.group_id || "",
    subject_id: entry?.subject_id || "",
    teacher_id: entry?.teacher_id || "",
    room_id: entry?.room_id || "",
    day_of_week: entry?.day_of_week || 1,
    start_time: entry?.start_time || "",
    end_time: entry?.end_time || "",
    notes: entry?.notes || ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter subjects based on selected teacher
  const availableSubjects = useMemo(() => {
    if (!form.teacher_id || !teacherAssignments) return subjects || [];
    
    const teacherSubjectIds = teacherAssignments
      .filter((assignment: any) => assignment.teacher_id === form.teacher_id)
      .map((assignment: any) => assignment.subject_id);
    
    return (subjects || []).filter((subject: any) => 
      teacherSubjectIds.includes(subject.id)
    );
  }, [form.teacher_id, teacherAssignments, subjects]);

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
          {entry ? "تعديل الدرس" : "إضافة درس جديد"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدرس</label>
            <select
              value={form.teacher_id}
              onChange={(e) => setForm(prev => ({ ...prev, teacher_id: e.target.value, subject_id: "" }))}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
            <select
              value={form.subject_id}
              onChange={(e) => setForm(prev => ({ ...prev, subject_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!form.teacher_id}
            >
              <option value="">اختر المادة</option>
              {availableSubjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            {!form.teacher_id && (
              <p className="text-xs text-gray-500 mt-1">يرجى اختيار المدرس أولاً</p>
            )}
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

// Helper function to generate timetable entries automatically
async function generateTimetableEntries(
  assignments: any[],
  groups: any[],
  rooms: any[],
  departmentId: string,
  semesterId: string
) {
  const entries = [];
  
  // Track teacher, room, and group schedules
  const teacherSchedule: { [key: string]: string[] } = {};
  const roomSchedule: { [key: string]: string[] } = {};
  const groupSchedule: { [key: string]: string[] } = {};
  
  // Initialize tracking
  assignments.forEach(assignment => {
    teacherSchedule[assignment.teacher_id] = [];
  });
  rooms.forEach(room => {
    roomSchedule[room.id] = [];
  });
  groups.forEach(group => {
    groupSchedule[group.id] = [];
  });

  // Generate entries for each assignment
  for (const assignment of assignments) {
    const subject = assignment.subjects;
    
    // Determine sessions per week based on credit hours
    // Typically: 1 credit = 1 session per week, 2 credits = 2 sessions, etc.
    const creditsHours = subject?.credits || 2;
    const sessionsPerWeek = creditsHours; // Can be adjusted based on your academic policy
    
    // Find available groups for this subject (groups in the same department and semester)
    const availableGroups = groups.filter(group => 
      group.department_id === departmentId && 
      group.semester_id === semesterId &&
      group.current_students > 0 // Only groups with students
    );

    if (availableGroups.length === 0) continue;

    // Schedule sessions for each group
    for (const group of availableGroups) {
      let sessionsScheduled = 0;
      
      // Try to schedule the required number of sessions
      for (const day of DAYS_OF_WEEK) {
        if (sessionsScheduled >= sessionsPerWeek) break;
        
        for (const slot of TIME_SLOTS) {
          if (sessionsScheduled >= sessionsPerWeek) break;
          
          const teacherSlotKey = `${assignment.teacher_id}-${day.value}-${slot.start}`;
          const groupSlotKey = `${group.id}-${day.value}-${slot.start}`;
          const roomSlotKey = `${day.value}-${slot.start}`;
          
          // Check if teacher is available at this time
          if (teacherSchedule[assignment.teacher_id]?.includes(teacherSlotKey)) {
            continue;
          }
          
          // Check if group is available at this time
          if (groupSchedule[group.id]?.includes(groupSlotKey)) {
            continue;
          }
          
          // Check teacher availability preferences from master data
          // TODO: Add teacher availability check from teachers table
          // For now, we assume teachers are available during regular hours (8:00-16:45)
          const slotHour = parseInt(slot.start.split(':')[0]);
          if (slotHour < 8 || slotHour >= 17) {
            continue; // Skip evening/early morning slots unless teacher explicitly available
          }
          
          // Find available room with sufficient capacity
          const availableRoom = rooms.find(room => 
            !roomSchedule[room.id]?.includes(roomSlotKey) &&
            (room.capacity || 30) >= (group.current_students || 0)
          );
          
          if (!availableRoom) continue;
          
          // Create timetable entry
          const entry = {
            semester_id: semesterId,
            department_id: departmentId,
            group_id: group.id,
            subject_id: assignment.subject_id,
            teacher_id: assignment.teacher_id,
            room_id: availableRoom.id,
            day_of_week: day.value,
            start_time: slot.start,
            end_time: slot.end,
            notes: `إنشاء تلقائي - الحصة ${sessionsScheduled + 1}/${sessionsPerWeek}`
          };
          
          entries.push(entry);
          
          // Update tracking
          if (!teacherSchedule[assignment.teacher_id]) {
            teacherSchedule[assignment.teacher_id] = [];
          }
          teacherSchedule[assignment.teacher_id].push(teacherSlotKey);
          
          if (!roomSchedule[availableRoom.id]) {
            roomSchedule[availableRoom.id] = [];
          }
          roomSchedule[availableRoom.id].push(roomSlotKey);
          
          if (!groupSchedule[group.id]) {
            groupSchedule[group.id] = [];
          }
          groupSchedule[group.id].push(groupSlotKey);
          
          sessionsScheduled++;
        }
      }
    }
  }
  
  return entries;
}


