import { useState } from 'react';
import { ScheduleEntry } from '../../lib/jwt-api';

interface ScheduleGridProps {
  schedule: ScheduleEntry[];
  department: string;
  semester: string;
  onUpdate: () => void;
  viewMode: 'grid' | 'list';
}

export default function ScheduleGrid({ 
  schedule, 
  department, 
  semester, 
  onUpdate, 
  viewMode 
}: ScheduleGridProps) {
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Define time slots and days
  const timeSlots = [
    { code: 'S1', label: '08:00 - 10:00', start: '08:00', end: '10:00' },
    { code: 'S2', label: '10:00 - 12:00', start: '10:00', end: '12:00' },
    { code: 'S3', label: '12:00 - 14:00', start: '12:00', end: '14:00' },
    { code: 'S4', label: '14:00 - 16:00', start: '14:00', end: '16:00' },
    { code: 'S5', label: '16:00 - 18:00', start: '16:00', end: '18:00' },
  ];

  const days = [
    { code: 'Sunday', label: 'الأحد' },
    { code: 'Monday', label: 'الاثنين' },
    { code: 'Tuesday', label: 'الثلاثاء' },
    { code: 'Wednesday', label: 'الأربعاء' },
    { code: 'Thursday', label: 'الخميس' },
  ];

  // Get schedule entry for specific day and time
  const getScheduleEntry = (day: string, timeSlot: string): ScheduleEntry | null => {
    return schedule.find(entry => 
      entry.day_of_week === day && entry.time_slot === timeSlot
    ) || null;
  };

  // Render individual schedule cell
  const renderScheduleCell = (day: string, timeSlot: string) => {
    const entry = getScheduleEntry(day, timeSlot);
    
    if (!entry) {
      return (
        <div className="h-28 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-all duration-200 group">
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <i className="fas fa-plus text-gray-300 text-lg mb-2 group-hover:text-gray-400 transition-colors"></i>
            <div className="text-xs font-medium">متاح</div>
            <div className="text-xs opacity-75">انقر للإضافة</div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="h-28 border border-gray-300 bg-white rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group"
        onClick={() => {
          setSelectedEntry(entry);
          setShowEditModal(true);
        }}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="text-xs font-bold text-gray-900 truncate mb-2 leading-tight">
            {entry.subject_name}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-700">
              <i className="fas fa-user text-gray-500 ml-1 w-3"></i>
              <span className="truncate">{entry.teacher_name}</span>
            </div>
            <div className="flex items-center text-xs text-gray-700">
              <i className="fas fa-door-open text-gray-500 ml-1 w-3"></i>
              <span className="truncate">{entry.room_name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
              {entry.current_enrollment || 0}/{entry.max_students || 0}
            </div>
            <i className="fas fa-edit text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"></i>
          </div>
        </div>
      </div>
    );
  };

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">{schedule.length}</div>
                <div className="text-sm text-gray-600">محاضرة</div>
              </div>
              <i className="fas fa-calendar-check text-gray-500 text-xl"></i>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">{schedule.length * 2}</div>
                <div className="text-sm text-gray-600">ساعة أسبوعياً</div>
              </div>
              <i className="fas fa-clock text-gray-500 text-xl"></i>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {new Set(schedule.map(s => s.teacher_id)).size}
                </div>
                <div className="text-sm text-gray-600">مدرس</div>
              </div>
              <i className="fas fa-chalkboard-teacher text-gray-500 text-xl"></i>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {new Set(schedule.map(s => s.room_id)).size}
                </div>
                <div className="text-sm text-gray-600">قاعة</div>
              </div>
              <i className="fas fa-door-open text-gray-500 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-6 gap-3 mb-4">
              <div className="p-4 bg-gray-100 rounded-lg text-center font-bold text-gray-800">
                <i className="fas fa-clock text-gray-600 block mb-1"></i>
                الوقت
              </div>
              {days.map(day => (
                <div key={day.code} className="p-4 bg-gray-200 rounded-lg text-center font-bold text-gray-800">
                  <i className="fas fa-calendar-day text-gray-600 block mb-1"></i>
                  {day.label}
                </div>
              ))}
            </div>

            {/* Schedule Grid */}
            {timeSlots.map(slot => (
              <div key={slot.code} className="grid grid-cols-6 gap-3 mb-3">
                {/* Time Slot Header */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-center border border-gray-200 shadow-sm">
                  <div className="font-bold text-gray-800 text-lg">{slot.code}</div>
                  <div className="text-xs text-gray-600 mt-1">{slot.label}</div>
                </div>
                
                {/* Schedule Cells */}
                {days.map(day => (
                  <div key={`${day.code}-${slot.code}`}>
                    {renderScheduleCell(day.code, slot.code)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <i className="fas fa-info-circle text-gray-600 ml-2"></i>
            مفتاح الرموز
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded ml-3 flex items-center justify-center">
                <i className="fas fa-book text-gray-600 text-xs"></i>
              </div>
              <span className="text-gray-700">محاضرة مجدولة</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded ml-3 flex items-center justify-center">
                <i className="fas fa-plus text-gray-400 text-xs"></i>
              </div>
              <span className="text-gray-700">وقت فارغ متاح</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-user text-gray-500 ml-3"></i>
              <span className="text-gray-700">اسم المدرس</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-door-open text-gray-500 ml-3"></i>
              <span className="text-gray-700">رقم القاعة</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      {days.map(day => (
        <div key={day.code} className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <i className="fas fa-calendar-day text-blue-500 ml-2"></i>
            {day.label}
          </h3>
          
          <div className="space-y-2">
            {timeSlots.map(slot => {
              const entry = getScheduleEntry(day.code, slot.code);
              
              return (
                <div key={slot.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-sm font-medium text-gray-600 min-w-[100px]">
                      {slot.label}
                    </div>
                    
                    {entry ? (
                      <div className="flex items-center space-x-6 space-x-reverse">
                        <div>
                          <div className="font-medium text-gray-900">{entry.subject_name}</div>
                          <div className="text-sm text-gray-600">
                            {entry.teacher_name} • {entry.room_name}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">لا توجد محاضرة</div>
                    )}
                  </div>
                  
                  {entry && (
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <i className="fas fa-edit"></i>
                      تعديل
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Statistics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">إحصائيات الجدول:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600">إجمالي المحاضرات</div>
            <div className="font-bold text-blue-900">{schedule.length}</div>
          </div>
          <div>
            <div className="text-blue-600">الساعات الأسبوعية</div>
            <div className="font-bold text-blue-900">{schedule.length * 2}</div>
          </div>
          <div>
            <div className="text-blue-600">عدد المدرسين</div>
            <div className="font-bold text-blue-900">
              {new Set(schedule.map(s => s.teacher_id)).size}
            </div>
          </div>
          <div>
            <div className="text-blue-600">عدد القاعات</div>
            <div className="font-bold text-blue-900">
              {new Set(schedule.map(s => s.room_id)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Edit Modal would go here - for now just showing the structure
}
