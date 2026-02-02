import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDepartments } from '../lib/api';
import { fetchSchedulingResources, generateAutoSchedule, fetchDepartmentSchedule } from '../lib/scheduling-api';
import ScheduleGrid from '../components/scheduling/ScheduleGrid';
import AutoGenerateWizard from '../components/scheduling/AutoGenerateWizard';
import ResourceOverview from '../components/scheduling/ResourceOverview';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function SchedulingPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('Fall 2024');
  const [showAutoWizard, setShowAutoWizard] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const queryClient = useQueryClient();

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments
  });

  // Fetch scheduling resources for selected department
  const { data: resources, isLoading: resourcesLoading, error: resourcesError } = useQuery({
    queryKey: ['scheduling-resources', selectedDepartment],
    queryFn: () => fetchSchedulingResources(selectedDepartment),
    enabled: !!selectedDepartment
  });

  // Fetch current schedule for selected department
  const { data: currentSchedule, isLoading: scheduleLoading, error: scheduleError } = useQuery({
    queryKey: ['department-schedule', selectedDepartment, selectedSemester],
    queryFn: () => fetchDepartmentSchedule(selectedDepartment, selectedSemester),
    enabled: !!selectedDepartment
  });

  // Auto-select first department when departments load
  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0].id);
    }
  }, [departments, selectedDepartment]);

  const handleAutoGenerate = async (constraints: any) => {
    try {
      await generateAutoSchedule(selectedDepartment, selectedSemester, constraints);
      // Refresh the schedule data
      queryClient.invalidateQueries({ queryKey: ['department-schedule', selectedDepartment, selectedSemester] });
      setShowAutoWizard(false);
    } catch (error) {
      console.error('Auto-generation failed:', error);
    }
  };

  const handleScheduleUpdate = () => {
    // Refresh schedule data after manual updates
    queryClient.invalidateQueries({ queryKey: ['department-schedule', selectedDepartment, selectedSemester] });
  };

  if (departmentsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-calendar-alt text-blue-600 ml-3"></i>
                نظام الجدولة الأكاديمية
              </h1>
              <p className="text-gray-600 mt-2">إدارة وتنظيم الجداول الدراسية لجميع التخصصات</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className={`fas ${viewMode === 'grid' ? 'fa-list' : 'fa-th'} ml-2`}></i>
                {viewMode === 'grid' ? 'عرض القائمة' : 'عرض الجدول'}
              </button>
            </div>
          </div>

          {/* Department and Semester Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-building text-blue-500 ml-2"></i>
                التخصص
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
              >
                <option value="">اختر التخصص</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {departments.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">لا توجد تخصصات متاحة</p>
              )}
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-calendar text-green-500 ml-2"></i>
                الفصل الدراسي
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 font-medium"
              >
                <option value="Fall 2024">خريف 2024</option>
                <option value="Spring 2025">ربيع 2025</option>
                <option value="Summer 2025">صيف 2025</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowAutoWizard(true)}
                  disabled={!selectedDepartment}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  <i className="fas fa-magic ml-2"></i>
                  إنشاء تلقائي
                </button>
                <button
                  disabled={!selectedDepartment || !currentSchedule?.length}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  <i className="fas fa-download ml-2"></i>
                  تصدير
                </button>
                <button
                  disabled={!selectedDepartment || !currentSchedule?.length}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  <i className="fas fa-print ml-2"></i>
                  طباعة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Overview */}
        {selectedDepartment && resources && (
          <ResourceOverview 
            resources={resources} 
            loading={resourcesLoading}
            error={resourcesError}
          />
        )}

        {/* Schedule Display */}
        {selectedDepartment && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                جدول {departments.find(d => d.id === selectedDepartment)?.name} - {selectedSemester}
              </h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-gray-500">
                  آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>

            {scheduleLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
                <span className="mr-3 text-gray-600">جاري تحميل الجدول...</span>
              </div>
            ) : scheduleError ? (
              <ErrorMessage message="فشل في تحميل الجدول" />
            ) : (
              <ScheduleGrid 
                schedule={currentSchedule || []}
                department={selectedDepartment}
                semester={selectedSemester}
                onUpdate={handleScheduleUpdate}
                viewMode={viewMode}
              />
            )}
          </div>
        )}

        {/* Auto-Generate Wizard Modal */}
        {showAutoWizard && (
          <AutoGenerateWizard
            department={selectedDepartment}
            semester={selectedSemester}
            resources={resources}
            onGenerate={handleAutoGenerate}
            onClose={() => setShowAutoWizard(false)}
          />
        )}
      </div>
    </div>
  );
}
