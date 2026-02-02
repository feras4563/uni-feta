import { useState } from 'react';
import { SchedulingResources, AutoGenerationConstraints } from '../../lib/scheduling-api';
import Modal from '../ui/Modal';

interface AutoGenerateWizardProps {
  department: string;
  semester: string;
  resources: SchedulingResources;
  onGenerate: (constraints: AutoGenerationConstraints) => Promise<void>;
  onClose: () => void;
}

export default function AutoGenerateWizard({
  department,
  semester,
  resources,
  onGenerate,
  onClose
}: AutoGenerateWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [constraints, setConstraints] = useState<AutoGenerationConstraints>({
    maxHoursPerDay: 6,
    minBreakBetweenClasses: 0,
    preferredTimeSlots: ['S1', 'S2', 'S3'],
    avoidTimeSlots: [],
    roomPreferences: {},
    teacherPreferences: {}
  });

  const steps = [
    { id: 1, title: 'إعدادات أساسية', icon: 'fas fa-cog' },
    { id: 2, title: 'تفضيلات المدرسين', icon: 'fas fa-user-tie' },
    { id: 3, title: 'تفضيلات القاعات', icon: 'fas fa-door-open' },
    { id: 4, title: 'مراجعة وإنشاء', icon: 'fas fa-check' }
  ];

  const timeSlots = [
    { code: 'S1', label: '08:00 - 10:00' },
    { code: 'S2', label: '10:00 - 12:00' },
    { code: 'S3', label: '12:00 - 14:00' },
    { code: 'S4', label: '14:00 - 16:00' },
    { code: 'S5', label: '16:00 - 18:00' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(constraints);
    } catch (error) {
      console.error('Generation failed:', error);
      // Show error message to user
      alert(`فشل في إنشاء الجدول: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-1">الإعدادات الأساسية للجدولة</h3>
        <p className="text-gray-600 text-xs">حدد القيود الأساسية لإنشاء جدول محسّن ومتوازن</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Basic Settings */}
        <div className="bg-gray-50 rounded p-3 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <i className="fas fa-cog text-gray-600 ml-1"></i>
            الإعدادات الرئيسية
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                الحد الأقصى للساعات اليومية لكل مدرس
              </label>
              <select
                value={constraints.maxHoursPerDay}
                onChange={(e) => setConstraints({
                  ...constraints,
                  maxHoursPerDay: parseInt(e.target.value)
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white"
              >
                <option value={4}>4 ساعات يومياً</option>
                <option value={6}>6 ساعات يومياً</option>
                <option value={8}>8 ساعات يومياً</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                الحد الأدنى للراحة بين المحاضرات
              </label>
              <select
                value={constraints.minBreakBetweenClasses}
                onChange={(e) => setConstraints({
                  ...constraints,
                  minBreakBetweenClasses: parseInt(e.target.value)
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-transparent bg-white"
              >
                <option value={0}>بدون راحة إجبارية</option>
                <option value={1}>ساعة راحة واحدة</option>
                <option value={2}>ساعتا راحة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferred Times */}
        <div className="bg-gray-50 rounded p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
            <i className="fas fa-calendar-check text-gray-600 ml-1"></i>
            الفترات المفضلة
          </h4>
          
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {timeSlots.map(slot => (
              <label key={slot.code} className="flex items-center p-1 bg-white rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={constraints.preferredTimeSlots.includes(slot.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConstraints({
                        ...constraints,
                        preferredTimeSlots: [...constraints.preferredTimeSlots, slot.code]
                      });
                    } else {
                      setConstraints({
                        ...constraints,
                        preferredTimeSlots: constraints.preferredTimeSlots.filter(s => s !== slot.code)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 ml-1 w-3 h-3"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 text-xs">{slot.code}</span>
                  <div className="text-xs text-gray-600">{slot.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Avoid Times */}
        <div className="bg-gray-50 rounded p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
            <i className="fas fa-calendar-times text-gray-600 ml-1"></i>
            الفترات المتجنبة
          </h4>
          
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {timeSlots.map(slot => (
              <label key={slot.code} className="flex items-center p-1 bg-white rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={constraints.avoidTimeSlots.includes(slot.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConstraints({
                        ...constraints,
                        avoidTimeSlots: [...constraints.avoidTimeSlots, slot.code]
                      });
                    } else {
                      setConstraints({
                        ...constraints,
                        avoidTimeSlots: constraints.avoidTimeSlots.filter(s => s !== slot.code)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 ml-1 w-3 h-3"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 text-xs">{slot.code}</span>
                  <div className="text-xs text-gray-600">{slot.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-1">مراجعة المدرسين</h3>
        <p className="text-gray-600 text-xs">معلومات المدرسين المتاحين للجدولة</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        {/* Teachers List */}
        <div className="lg:col-span-3 bg-gray-50 rounded p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
            <i className="fas fa-chalkboard-teacher text-gray-600 ml-1"></i>
            المدرسون المتاحون ({resources.teachers.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {resources.teachers.map((teacher, index) => (
              <div key={teacher.id} className="bg-white rounded p-2 border border-gray-200">
                <div className="flex items-center mb-1">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center ml-1">
                    <i className="fas fa-user text-gray-600 text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-xs truncate">{teacher.name}</h5>
                    <p className="text-xs text-gray-600">مدرس #{index + 1}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">المواد:</span>
                    <span className="text-gray-900">
                      {teacher.subjects.length > 0 ? `${teacher.subjects.length}` : '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">الساعات:</span>
                    <span className="text-gray-900">{teacher.teaching_hours || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics & Info */}
        <div className="space-y-3">
          {/* Statistics */}
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">الإحصائيات</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">المدرسين</span>
                <span className="font-bold text-gray-900">{resources.teachers.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">النشطين</span>
                <span className="font-bold text-gray-900">{resources.teachers.filter(t => t.subjects.length > 0).length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">الساعات</span>
                <span className="font-bold text-gray-900">{resources.teachers.reduce((sum, t) => sum + (t.teaching_hours || 0), 0)}</span>
              </div>
            </div>
          </div>

          {/* Auto-Assignment Info */}
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
              <i className="fas fa-info-circle text-gray-600 ml-1"></i>
              معلومات الجدولة
            </h4>
            <div className="space-y-1 text-xs text-gray-700">
              <div className="flex items-start">
                <i className="fas fa-check text-gray-600 ml-1 mt-0.5 flex-shrink-0"></i>
                <span>تطبيق الإعدادات العامة</span>
              </div>
              <div className="flex items-start">
                <i className="fas fa-check text-gray-600 ml-1 mt-0.5 flex-shrink-0"></i>
                <span>تجنب التضارب تلقائياً</span>
              </div>
              <div className="flex items-start">
                <i className="fas fa-check text-gray-600 ml-1 mt-0.5 flex-shrink-0"></i>
                <span>توزيع متوازن للعبء</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">تفضيلات القاعات</h3>
        <p className="text-gray-600">مراجعة القاعات المتاحة وخصائصها</p>
      </div>

      {/* Rooms Overview */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-green-900 flex items-center">
            <i className="fas fa-door-open text-green-600 ml-3"></i>
            القاعات المتاحة ({resources.rooms.length})
          </h4>
          <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
            {resources.rooms.reduce((sum, r) => sum + r.capacity, 0)} مقعد إجمالي
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto pr-2">
          {resources.rooms.map((room, index) => (
            <div key={room.id} className="bg-white rounded-lg border border-green-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center ml-3">
                    <i className="fas fa-door-open text-green-600"></i>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">{room.name || room.code}</h5>
                    <p className="text-sm text-gray-600">قاعة #{index + 1}</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {room.capacity} مقعد
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <i className="fas fa-tag text-purple-500 ml-2 w-4"></i>
                  <span className="text-gray-600">النوع:</span>
                  <span className="text-gray-900 mr-2">{room.room_type || 'عادية'}</span>
                </div>

                <div className="flex items-center text-sm">
                  <i className="fas fa-building text-orange-500 ml-2 w-4"></i>
                  <span className="text-gray-600">المبنى:</span>
                  <span className="text-gray-900 mr-2">{room.building || 'المبنى الرئيسي'}</span>
                </div>

                <div className="flex items-center text-sm">
                  <i className="fas fa-users text-blue-500 ml-2 w-4"></i>
                  <span className="text-gray-600">السعة:</span>
                  <span className="text-gray-900 mr-2">{room.capacity} طالب</span>
                </div>

                <div className="flex items-center text-sm">
                  <i className="fas fa-check-circle text-green-500 ml-2 w-4"></i>
                  <span className="text-gray-600">الحالة:</span>
                  <span className="text-green-600 font-medium mr-2">متاحة للجدولة</span>
                </div>

                {room.equipment && Object.keys(room.equipment).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">المعدات:</p>
                    <div className="flex items-center">
                      <i className="fas fa-tools text-gray-500 text-xs ml-2"></i>
                      <span className="text-xs text-gray-700">معدات متخصصة متوفرة</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Types Distribution */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <i className="fas fa-chart-pie text-blue-600 ml-3"></i>
          توزيع أنواع القاعات
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(() => {
            const roomTypes = resources.rooms.reduce((acc, room) => {
              const type = room.room_type || 'عادية';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as { [key: string]: number });

            return Object.entries(roomTypes).map(([type, count]) => (
              <div key={type} className="bg-white rounded-lg border border-blue-200 p-4 text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">{count}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Auto-Assignment Info */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-start">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center ml-4 flex-shrink-0">
            <i className="fas fa-lightbulb text-orange-600 text-lg"></i>
          </div>
          <div>
            <h4 className="font-semibold text-orange-900 mb-3">خوارزمية توزيع القاعات</h4>
            <div className="space-y-2 text-sm text-orange-800">
              <div className="flex items-center">
                <i className="fas fa-check text-green-600 ml-2"></i>
                <span>سيتم اختيار القاعات تلقائياً بناءً على عدد الطلاب المسجلين</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-check text-green-600 ml-2"></i>
                <span>سيتم تجنب التضارب في استخدام القاعات</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-check text-green-600 ml-2"></i>
                <span>سيتم مراعاة نوع القاعة المناسب لكل مادة</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-check text-green-600 ml-2"></i>
                <span>سيتم تحسين استغلال السعة المتاحة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {resources.rooms.length}
          </div>
          <div className="text-sm text-gray-600">إجمالي القاعات</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {resources.rooms.reduce((sum, r) => sum + r.capacity, 0)}
          </div>
          <div className="text-sm text-gray-600">إجمالي المقاعد</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {Math.round(resources.rooms.reduce((sum, r) => sum + r.capacity, 0) / resources.rooms.length)}
          </div>
          <div className="text-sm text-gray-600">متوسط السعة</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {Math.max(...resources.rooms.map(r => r.capacity))}
          </div>
          <div className="text-sm text-gray-600">أكبر قاعة</div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">مراجعة الإعدادات والإنشاء</h3>
        <p className="text-gray-600">تأكد من الإعدادات قبل إنشاء الجدول التلقائي</p>
      </div>

      {/* Configuration Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <i className="fas fa-list-check text-gray-600 ml-3"></i>
          ملخص الإعدادات
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                <i className="fas fa-info-circle text-blue-500 ml-2"></i>
                المعلومات الأساسية
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">التخصص:</span>
                  <span className="font-medium text-gray-900">{department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الفصل الدراسي:</span>
                  <span className="font-medium text-gray-900">{semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الحد الأقصى يومياً:</span>
                  <span className="font-medium text-gray-900">{constraints.maxHoursPerDay} ساعات</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">فترة الراحة:</span>
                  <span className="font-medium text-gray-900">
                    {constraints.minBreakBetweenClasses === 0 ? 'بدون راحة إجبارية' : `${constraints.minBreakBetweenClasses} ساعة`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Preferences */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                <i className="fas fa-clock text-green-500 ml-2"></i>
                تفضيلات الأوقات
              </h5>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 block mb-2">الفترات المفضلة:</span>
                  <div className="flex flex-wrap gap-1">
                    {constraints.preferredTimeSlots.map(slot => {
                      const timeSlot = timeSlots.find(t => t.code === slot);
                      return (
                        <span key={slot} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {timeSlot?.label}
                        </span>
                      );
                    })}
                    {constraints.preferredTimeSlots.length === 0 && (
                      <span className="text-xs text-gray-500">لا توجد تفضيلات محددة</span>
                    )}
                  </div>
                </div>
                
                {constraints.avoidTimeSlots.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">الفترات المتجنبة:</span>
                    <div className="flex flex-wrap gap-1">
                      {constraints.avoidTimeSlots.map(slot => {
                        const timeSlot = timeSlots.find(t => t.code === slot);
                        return (
                          <span key={slot} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            {timeSlot?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-6 flex items-center">
          <i className="fas fa-chart-bar text-blue-600 ml-3"></i>
          ملخص الموارد المتاحة
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-chalkboard-teacher text-blue-600 text-xl"></i>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{resources.teachers.length}</div>
            <div className="text-sm text-gray-600">مدرس</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-door-open text-green-600 text-xl"></i>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{resources.rooms.length}</div>
            <div className="text-sm text-gray-600">قاعة</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-book text-purple-600 text-xl"></i>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">{resources.subjects.length}</div>
            <div className="text-sm text-gray-600">مادة</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-user-graduate text-orange-600 text-xl"></i>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {resources.students.reduce((sum, g) => sum + g.count, 0)}
            </div>
            <div className="text-sm text-gray-600">طالب</div>
          </div>
        </div>
      </div>

      {/* Generation Process Info */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-start">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center ml-4 flex-shrink-0">
            <i className="fas fa-cogs text-yellow-600 text-lg"></i>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 mb-3">عملية الإنشاء التلقائي</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
              <div className="space-y-2">
                <div className="flex items-center">
                  <i className="fas fa-check text-green-600 ml-2"></i>
                  <span>تحليل الموارد والقيود المتاحة</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-600 ml-2"></i>
                  <span>تطبيق خوارزمية الجدولة الذكية</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-600 ml-2"></i>
                  <span>التحقق من عدم وجود تضارب</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <i className="fas fa-check text-green-600 ml-2"></i>
                  <span>تحسين توزيع الأحمال</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-600 ml-2"></i>
                  <span>حفظ الجدول في قاعدة البيانات</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check text-green-600 ml-2"></i>
                  <span>إنشاء تقرير النتائج</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-start">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center ml-4 flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-red-600 text-lg"></i>
          </div>
          <div>
            <h4 className="font-semibold text-red-900 mb-3">ملاحظات مهمة قبل البدء</h4>
            <div className="space-y-2 text-sm text-red-800">
              <div className="flex items-start">
                <i className="fas fa-dot-circle text-red-600 mt-1 ml-2 text-xs"></i>
                <span>سيتم حذف الجدول الحالي بالكامل وإنشاء جدول جديد من الصفر</span>
              </div>
              <div className="flex items-start">
                <i className="fas fa-dot-circle text-red-600 mt-1 ml-2 text-xs"></i>
                <span>العملية غير قابلة للتراجع - تأكد من حفظ نسخة احتياطية إذا لزم الأمر</span>
              </div>
              <div className="flex items-start">
                <i className="fas fa-dot-circle text-red-600 mt-1 ml-2 text-xs"></i>
                <span>قد تستغرق العملية من 30 ثانية إلى دقيقتين حسب حجم البيانات</span>
              </div>
              <div className="flex items-start">
                <i className="fas fa-dot-circle text-red-600 mt-1 ml-2 text-xs"></i>
                <span>يمكن تعديل الجدول المُنشأ يدوياً بعد اكتمال العملية</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Expectations */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
          <i className="fas fa-bullseye text-green-600 ml-3"></i>
          النتائج المتوقعة
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex items-center text-green-800">
              <i className="fas fa-chart-line text-green-600 ml-2"></i>
              <span>جدول محسّن خالٍ من التضارب</span>
            </div>
            <div className="flex items-center text-green-800">
              <i className="fas fa-balance-scale text-green-600 ml-2"></i>
              <span>توزيع متوازن للأحمال التدريسية</span>
            </div>
            <div className="flex items-center text-green-800">
              <i className="fas fa-clock text-green-600 ml-2"></i>
              <span>استغلال أمثل للأوقات المفضلة</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-green-800">
              <i className="fas fa-home text-green-600 ml-2"></i>
              <span>توزيع ذكي للقاعات حسب السعة</span>
            </div>
            <div className="flex items-center text-green-800">
              <i className="fas fa-users text-green-600 ml-2"></i>
              <span>مراعاة أعداد الطلاب المسجلين</span>
            </div>
            <div className="flex items-center text-green-800">
              <i className="fas fa-edit text-green-600 ml-2"></i>
              <span>إمكانية التعديل اليدوي اللاحق</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal open={true} onClose={onClose}>
      <div 
        className="bg-white rounded-lg flex flex-col"
        style={{
          width: '98vw',
          height: '98vh',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
      >
        {/* Header - Minimal */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <i className="fas fa-magic text-gray-600 ml-2"></i>
              معالج الإنشاء التلقائي للجدول
            </h2>
            <p className="text-gray-600 text-xs">
              خطوة {currentStep} من {steps.length} - {steps.find(s => s.id === currentStep)?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={isGenerating}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Steps Indicator - Compact */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3 space-x-reverse">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${currentStep >= step.id 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {currentStep > step.id ? (
                        <i className="fas fa-check text-xs"></i>
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`
                      mr-2 text-xs font-medium
                      ${currentStep >= step.id ? 'text-gray-800' : 'text-gray-500'}
                    `}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-8 h-0.5 mx-2 rounded-full transition-all duration-300
                      ${currentStep > step.id ? 'bg-gray-800' : 'bg-gray-200'}
                    `}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content - Full Height, No Scroll */}
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          <div className="h-full">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
        </div>

        {/* Footer - Minimal */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isGenerating}
            className="flex items-center px-3 py-1 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <i className="fas fa-arrow-right ml-1"></i>
            السابق
          </button>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-3 py-1 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
            >
              إلغاء
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                disabled={isGenerating}
                className="flex items-center px-4 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50 font-medium transition-colors text-sm"
              >
                التالي
                <i className="fas fa-arrow-left mr-1"></i>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center px-4 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50 font-medium transition-colors text-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-2"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic ml-2"></i>
                    إنشاء الجدول
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
