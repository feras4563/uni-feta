import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getTeacherSubjectGroups,
  createAttendanceSession,
  getAttendanceSession,
  getSessionAttendance
} from "@/lib/api";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  UserCheck, 
  Plus,
  Eye,
  Clock,
  MapPin
} from "lucide-react";
import { useAuth } from "@/contexts/JWTAuthContext";

export default function TeacherSubjectGroups() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Fetch teacher's subject groups
  const { data: subjectGroups, isLoading } = useQuery({
    queryKey: ["teacher-subject-groups", user?.id],
    queryFn: () => getTeacherSubjectGroups(user?.id, "2024-2025"),
    enabled: !!user?.id,
  });

  const handleCreateAttendanceSession = async (group: any) => {
    setSelectedGroup(group);
    setShowAttendanceModal(true);
  };

  const handleViewAttendance = async (group: any) => {
    setSelectedGroup(group);
    setShowSessionModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل مجموعات المقررات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">مجموعات المقررات</h1>
        <p className="text-gray-600">إدارة مجموعات الطلاب لمقرراتك</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{subjectGroups?.length || 0}</div>
              <div className="text-sm text-gray-600">إجمالي المجموعات</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {subjectGroups?.reduce((sum, group) => sum + group.current_students, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">إجمالي الطلاب</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-lg font-bold text-gray-900">2024-2025</div>
              <div className="text-sm text-gray-600">العام الأكاديمي</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <div className="text-lg font-bold text-gray-900">نشط</div>
              <div className="text-sm text-gray-600">حالة المجموعات</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Groups Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">مجموعات المقررات</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المجموعة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المقرر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطلاب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفصل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjectGroups?.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {group.group_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{group.subjects?.name}</div>
                      <div className="text-gray-500 text-xs">{group.subjects?.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.departments?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.current_students >= group.max_students ? 'bg-red-100 text-red-800' :
                      group.current_students > 0 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {group.current_students}/{group.max_students}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.max_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.semester_name || group.semesters?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCreateAttendanceSession(group)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        title="تسجيل الحضور"
                      >
                        <UserCheck className="h-4 w-4" />
                        حضور
                      </button>
                      <button
                        onClick={() => handleViewAttendance(group)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="عرض سجل الحضور"
                      >
                        <Eye className="h-4 w-4" />
                        سجل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subjectGroups?.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مجموعات مقررات</h3>
            <p className="mt-1 text-sm text-gray-500">لم يتم تعيينك لأي مقررات بعد.</p>
          </div>
        )}
      </div>

      {/* Attendance Session Modal */}
      {showAttendanceModal && selectedGroup && (
        <AttendanceSessionModal
          group={selectedGroup}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}

      {/* Attendance History Modal */}
      {showSessionModal && selectedGroup && (
        <AttendanceHistoryModal
          group={selectedGroup}
          onClose={() => setShowSessionModal(false)}
        />
      )}
    </div>
  );
}

// Attendance Session Creation Modal
function AttendanceSessionModal({ group, onClose }: { group: any; onClose: () => void }) {
  const [form, setForm] = useState({
    session_title: "",
    session_date: new Date().toISOString().split('T')[0],
    start_time: "09:00",
    end_time: "10:00",
    room_id: "",
    location: "",
    session_type: "lecture",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createAttendanceSession({
        group_id: group.id,
        subject_id: group.subject_id,
        teacher_id: group.teacher_id,
        session_title: form.session_title,
        session_date: form.session_date,
        start_time: form.start_time,
        end_time: form.end_time,
        room_id: form.room_id || null,
        location: form.location,
        session_type: form.session_type,
        notes: form.notes,
        status: 'scheduled'
      });

      alert("تم إنشاء جلسة الحضور بنجاح");
      onClose();
    } catch (error: any) {
      alert("خطأ في إنشاء جلسة الحضور: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">إنشاء جلسة حضور</h3>
          <p className="text-sm text-gray-500 mt-1">{group.subjects?.name} - {group.group_name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان الجلسة
              </label>
              <input
                type="text"
                value={form.session_title}
                onChange={(e) => setForm({...form, session_title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={form.session_date}
                  onChange={(e) => setForm({...form, session_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الجلسة
                </label>
                <select
                  value={form.session_type}
                  onChange={(e) => setForm({...form, session_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="lecture">محاضرة</option>
                  <option value="lab">مختبر</option>
                  <option value="seminar">ندوة</option>
                  <option value="exam">امتحان</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وقت البداية
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({...form, start_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وقت النهاية
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({...form, end_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="مثال: قاعة 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الجلسة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Attendance History Modal
function AttendanceHistoryModal({ group, onClose }: { group: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">سجل الحضور</h3>
          <p className="text-sm text-gray-500 mt-1">{group.subjects?.name} - {group.group_name}</p>
        </div>
        
        <div className="px-6 py-4">
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد جلسات حضور</h3>
            <p className="mt-1 text-sm text-gray-500">لم يتم إنشاء أي جلسات حضور لهذه المجموعة بعد.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}











