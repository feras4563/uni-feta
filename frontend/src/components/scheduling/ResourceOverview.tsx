import { SchedulingResources } from '../../lib/scheduling-api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

interface ResourceOverviewProps {
  resources: SchedulingResources;
  loading: boolean;
  error: any;
}

export default function ResourceOverview({ resources, loading, error }: ResourceOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="mr-3 text-gray-600">جاري تحميل الموارد...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <ErrorMessage message="فشل في تحميل موارد الجدولة" />
      </div>
    );
  }

  const calculateTeacherUtilization = () => {
    const totalTeachers = resources.teachers.length;
    const activeTeachers = resources.teachers.filter(t => t.subjects.length > 0).length;
    return totalTeachers > 0 ? Math.round((activeTeachers / totalTeachers) * 100) : 0;
  };

  const calculateRoomCapacity = () => {
    return resources.rooms.reduce((total, room) => total + room.capacity, 0);
  };

  const getTotalStudents = () => {
    return resources.students.reduce((total, group) => total + group.count, 0);
  };

  const getAvailableTimeSlots = () => {
    return resources.timeSlots.length * 5; // 5 days per week
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fas fa-chart-bar text-blue-600 ml-3"></i>
        نظرة عامة على الموارد
      </h2>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Teachers */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <i className="fas fa-chalkboard-teacher text-blue-600 text-lg ml-2"></i>
              <span className="font-medium text-blue-900">المدرسون</span>
            </div>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              {calculateTeacherUtilization()}% نشط
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mb-1">
            {resources.teachers.length}
          </div>
          <div className="text-sm text-blue-700">
            {resources.teachers.filter(t => t.subjects.length > 0).length} مدرس نشط
          </div>
        </div>

        {/* Rooms */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <i className="fas fa-door-open text-green-600 text-lg ml-2"></i>
              <span className="font-medium text-green-900">القاعات</span>
            </div>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
              {calculateRoomCapacity()} مقعد
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">
            {resources.rooms.length}
          </div>
          <div className="text-sm text-green-700">
            السعة الإجمالية: {calculateRoomCapacity()}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <i className="fas fa-book text-purple-600 text-lg ml-2"></i>
              <span className="font-medium text-purple-900">المواد</span>
            </div>
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
              {resources.subjects.reduce((sum, s) => sum + (s.hours_per_week || 0), 0)} ساعة
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-1">
            {resources.subjects.length}
          </div>
          <div className="text-sm text-purple-700">
            إجمالي الساعات الأسبوعية
          </div>
        </div>

        {/* Students */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <i className="fas fa-user-graduate text-orange-600 text-lg ml-2"></i>
              <span className="font-medium text-orange-900">الطلاب</span>
            </div>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
              {resources.students.length} مجموعة
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-900 mb-1">
            {getTotalStudents()}
          </div>
          <div className="text-sm text-orange-700">
            موزعون على {resources.students.length} مجموعات
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <i className="fas fa-users text-blue-500 ml-2"></i>
            تفاصيل المدرسين
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {resources.teachers.slice(0, 5).map(teacher => (
              <div key={teacher.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{teacher.name}</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-gray-600">{teacher.subjects.length} مواد</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {teacher.teaching_hours || 0}ساعة
                  </span>
                </div>
              </div>
            ))}
            {resources.teachers.length > 5 && (
              <div className="text-center text-gray-500 text-sm pt-2">
                و {resources.teachers.length - 5} مدرسين آخرين
              </div>
            )}
          </div>
        </div>

        {/* Rooms Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <i className="fas fa-building text-green-500 ml-2"></i>
            تفاصيل القاعات
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {resources.rooms.slice(0, 5).map(room => (
              <div key={room.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{room.name}</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-gray-600">{room.capacity} مقعد</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {room.room_type}
                  </span>
                </div>
              </div>
            ))}
            {resources.rooms.length > 5 && (
              <div className="text-center text-gray-500 text-sm pt-2">
                و {resources.rooms.length - 5} قاعات أخرى
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scheduling Capacity Analysis */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <i className="fas fa-analytics text-blue-600 ml-2"></i>
          تحليل السعة الجدولية
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600 mb-1">الفترات الزمنية المتاحة</div>
            <div className="font-bold text-blue-900">{getAvailableTimeSlots()} فترة</div>
          </div>
          <div>
            <div className="text-blue-600 mb-1">الساعات المطلوبة</div>
            <div className="font-bold text-blue-900">
              {resources.subjects.reduce((sum, s) => sum + (s.hours_per_week || 0), 0)} ساعة
            </div>
          </div>
          <div>
            <div className="text-blue-600 mb-1">معدل الاستغلال</div>
            <div className="font-bold text-blue-900">
              {Math.round((resources.subjects.reduce((sum, s) => sum + (s.hours_per_week || 0), 0) / getAvailableTimeSlots()) * 100)}%
            </div>
          </div>
          <div>
            <div className="text-blue-600 mb-1">الحالة</div>
            <div className="font-bold text-green-900">
              {getAvailableTimeSlots() >= resources.subjects.reduce((sum, s) => sum + (s.hours_per_week || 0), 0) ? 
                'ممكن الجدولة' : 'يحتاج تحسين'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

