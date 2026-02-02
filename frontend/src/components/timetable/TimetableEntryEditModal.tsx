import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save, AlertCircle } from "lucide-react";
import { api } from "../../lib/api-client";

interface TimetableEntryEditModalProps {
  entry: any;
  onClose: () => void;
  onSuccess: () => void;
}

const fetchTeachers = async () => {
  return api.get<any[]>('/teachers', { paginate: 'false', active_only: true });
};

const fetchRooms = async () => {
  return api.get<any[]>('/rooms', { paginate: 'false' });
};

const updateTimetableEntry = async (id: string, data: any) => {
  return api.put<any>(`/timetable/entries/${id}`, data);
};

export default function TimetableEntryEditModal({ entry, onClose, onSuccess }: TimetableEntryEditModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    teacher_id: entry.teacher_id || '',
    room_id: entry.room_id || '',
    day_of_week: entry.day_of_week,
    start_time: entry.start_time?.substring(0, 5) || '',
    end_time: entry.end_time?.substring(0, 5) || '',
    notes: entry.notes || '',
  });

  const [error, setError] = useState<string | null>(null);

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTimetableEntry(entry.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['group-timetable'] });
      await queryClient.refetchQueries({ queryKey: ['group-timetable'] });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const message = error.message || 'فشل في تحديث الحصة';
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const updateData: any = {};
    
    if (formData.teacher_id !== entry.teacher_id) {
      updateData.teacher_id = formData.teacher_id;
    }
    
    if (formData.room_id !== entry.room_id) {
      updateData.room_id = formData.room_id || null;
    }
    
    if (formData.day_of_week !== entry.day_of_week) {
      updateData.day_of_week = formData.day_of_week;
    }
    
    if (formData.start_time !== entry.start_time?.substring(0, 5)) {
      updateData.start_time = formData.start_time;
    }
    
    if (formData.end_time !== entry.end_time?.substring(0, 5)) {
      updateData.end_time = formData.end_time;
    }
    
    if (formData.notes !== entry.notes) {
      updateData.notes = formData.notes;
    }

    if (Object.keys(updateData).length === 0) {
      onClose();
      return;
    }

    updateMutation.mutate(updateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">تعديل الحصة</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Current Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">معلومات الحصة الحالية</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">المادة: </span>
                <span className="font-medium">{entry.subject?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">اليوم: </span>
                <span className="font-medium">
                  {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][entry.day_of_week]}
                </span>
              </div>
              <div>
                <span className="text-gray-600">الوقت: </span>
                <span className="font-medium">
                  {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                </span>
              </div>
            </div>
          </div>

          {/* Day of Week Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اليوم <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value={0}>الأحد</option>
              <option value={1}>الاثنين</option>
              <option value={2}>الثلاثاء</option>
              <option value={3}>الأربعاء</option>
              <option value={4}>الخميس</option>
            </select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وقت البداية <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وقت النهاية <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المدرس <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">اختر المدرس</option>
              {teachers.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              سيتم التحقق من توفر المدرس في اليوم والوقت المحددين
            </p>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              القاعة
            </label>
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">بدون قاعة</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.building || 'المبنى الرئيسي'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              سيتم التحقق من توفر القاعة في هذا الوقت
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أضف ملاحظات إضافية..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
