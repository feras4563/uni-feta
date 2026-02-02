import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDepartments, fetchDepartmentWithStats, deleteDepartment } from "../lib/api";
import { fetchDepartmentsSimple } from "../lib/api-simple";
import DepartmentModal from "../features/departments/DepartmentModal";

interface DepartmentStats {
  students_count: number;
  active_students: number;
  subjects_count: number;
  total_fees: number;
}

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentStats, setDepartmentStats] = useState<Record<string, DepartmentStats>>({});
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ["departments", search],
    queryFn: fetchDepartmentsSimple
  });

  // Load department statistics
  const loadDepartmentStats = async () => {
    const stats: Record<string, DepartmentStats> = {};
    
    for (const dept of departments) {
      try {
        const result = await fetchDepartmentWithStats(dept.id);
        stats[dept.id] = {
          students_count: result.students.total,
          active_students: result.students.active,
          subjects_count: result.subjects.total,
          total_fees: result.fees.totalAmount
        };
      } catch (error) {
        console.error(`Error loading stats for department ${dept.id}:`, error);
        stats[dept.id] = {
          students_count: 0,
          active_students: 0,
          subjects_count: 0,
          total_fees: 0
        };
      }
    }
    
    setDepartmentStats(stats);
  };

  // Load stats when departments change
  useMemo(() => {
    if (departments.length > 0) {
      loadDepartmentStats();
    }
  }, [departments]);

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept: any) => {
      const matchesSearch = !search || 
        dept.name?.toLowerCase().includes(search.toLowerCase()) || 
        dept.name_en?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "locked" && dept.is_locked) || 
        (statusFilter === "active" && !dept.is_locked);
      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const total = filteredDepartments.length;
    const active = filteredDepartments.filter((d: any) => !d.is_locked).length;
    const locked = filteredDepartments.filter((d: any) => d.is_locked).length;
    
    const totalStudents = Object.values(departmentStats).reduce((sum, stats) => sum + stats.students_count, 0);
    const totalSubjects = Object.values(departmentStats).reduce((sum, stats) => sum + stats.subjects_count, 0);

    return { total, active, locked, totalStudents, totalSubjects };
  }, [filteredDepartments, departmentStats]);

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setModalOpen(true);
  };

  const handleViewDetails = async (department: any) => {
    try {
      const details = await fetchDepartmentWithStats(department.id);
      setSelectedDepartment(details);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error("Error loading department details:", error);
    }
  };

  const handleAdd = () => {
    setEditingDepartment(null);
    setModalOpen(true);
  };

  const createDepartmentFullScreen = () => {
    navigate("/departments/create");
  };

  const viewDepartmentFullScreen = (department: any) => {
    navigate(`/departments/${department.id}`);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingDepartment(null);
  };

  const handleDetailsModalClose = () => {
    setDetailsModalOpen(false);
    setSelectedDepartment(null);
  };

  const handleDepartmentSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["departments"] });
    handleModalClose();
    // Reload stats
    setTimeout(loadDepartmentStats, 500);
  };

  const handleDelete = async (department: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${department.name}"؟\n\nتحذير: لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    try {
      await deleteDepartment(department.id);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      // Show success message
      alert("تم حذف القسم بنجاح");
    } catch (error: any) {
      console.error("Error deleting department:", error);
      alert(error.message || "فشل حذف القسم. قد يحتوي القسم على طلاب مسجلين.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات الأقسام...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-1 text-sm text-gray-500">تعذر تحميل بيانات الأقسام. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 21h19.5m-18-18v18m2.25-18h15M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                    </svg>
                  </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة الأقسام الأكاديمية</h1>
                <p className="text-sm text-gray-600 mt-1">إدارة وتنظيم الأقسام والتخصصات الأكاديمية</p>
                  </div>
                </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                title="تصدير البيانات"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير
              </button>
              <div className="relative group">
              <button
                onClick={handleAdd}
                type="button"
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                  title="إضافة قسم جديد"
              >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                إضافة قسم جديد
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleAdd}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إضافة سريع (نافذة منبثقة)
                    </button>
                    <button
                      onClick={createDepartmentFullScreen}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      إضافة في صفحة كاملة
              </button>
            </div>
          </div>
        </div>
                </div>
              </div>
            </div>
          </div>

      <div className="p-8">
        {/* Professional Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{overallStats.total}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">إجمالي الأقسام</div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 21h19.5m-18-18v18m2.25-18h15M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                    </svg>
                  </div>
                </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{overallStats.active}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">أقسام نشطة</div>
                </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{overallStats.locked}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">أقسام مغلقة</div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{overallStats.totalStudents}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">إجمالي الطلاب</div>
                </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{overallStats.totalSubjects}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">إجمالي المقررات</div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>
              </div>
            </div>
          </div>

        {/* Professional Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
              البحث والتصفية
            </h3>
                  </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="البحث في الأقسام..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 bg-white"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="locked">مغلق</option>
              </select>
            </div>
            
            {/* Results Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                عرض {filteredDepartments.length} من أصل {departments.length} قسم
                {filteredDepartments.length !== departments.length && (
                  <span className="text-gray-500"> (تم تصفية {departments.length - filteredDepartments.length} نتيجة)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Professional Departments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              قائمة الأقسام الأكاديمية
            </h3>
          </div>
          
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">لا توجد أقسام</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة أقسام جديدة إلى النظام.</p>
              <div className="mt-6">
                <button
                  onClick={handleAdd}
                  type="button"
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة قسم جديد
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">القسم</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الاسم الإنجليزي</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">رئيس القسم</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">عدد الطلاب</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">عدد المقررات</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDepartments.map((department: any, index: number) => {
                      const stats = departmentStats[department.id] || { students_count: 0, subjects_count: 0 };
                      return (
                      <tr key={department.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded-lg ml-3">
                              <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 21h19.5m-18-18v18m2.25-18h15M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                              </svg>
                                </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{department.name}</div>
                              <div className="text-xs text-gray-500">#{department.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{department.name_en || 'غير محدد'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {department.head_teacher?.name || department.head || 'غير محدد'}
                            {department.head_teacher?.name_en && (
                              <div className="text-xs text-gray-500">({department.head_teacher.name_en})</div>
                            )}
                          </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-1 bg-blue-100 rounded ml-2">
                              <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stats.students_count}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-1 bg-indigo-100 rounded ml-2">
                              <svg className="h-3 w-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{stats.subjects_count}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              department.is_locked 
                                ? 'bg-red-50 text-red-700 ring-red-600/20' 
                                : 'bg-green-50 text-green-700 ring-green-600/20'
                            }`}>
                              {department.is_locked ? 'مغلق' : 'نشط'}
                            </span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <button
                              onClick={() => viewDepartmentFullScreen(department)}
                              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                              title="عرض في صفحة كاملة"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </button>
                              <button
                                onClick={() => handleViewDetails(department)}
                              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                              title="عرض التفاصيل (نافذة منبثقة)"
                              >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              </button>
                              <button
                                onClick={() => handleEdit(department)}
                              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                              title="تعديل"
                              >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(department)}
                              className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-100 transition-colors duration-200"
                              title="حذف"
                              >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <DepartmentModal
        open={modalOpen}
        onClose={handleModalClose}
        department={editingDepartment}
        onSaved={handleDepartmentSaved}
      />

      {/* Department Details Modal */}
      {detailsModalOpen && selectedDepartment && (
        <DepartmentDetailsModal
          open={detailsModalOpen}
          onClose={handleDetailsModalClose}
          departmentData={selectedDepartment}
        />
      )}
    </div>
  );
}

// Department Details Modal Component
function DepartmentDetailsModal({ 
  open, 
  onClose, 
  departmentData 
}: { 
  open: boolean; 
  onClose: () => void; 
  departmentData: any; 
}) {
  if (!open || !departmentData) return null;

  const { department, students, subjects, fees } = departmentData;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18h15M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">{department.name}</h3>
                <p className="text-sm text-gray-500">تفاصيل القسم الأكاديمي</p>
              </div>
            </div>
          </div>

          {/* Department Info */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>الاسم العربي:</strong> {department.name}</p>
                <p><strong>الاسم الإنجليزي:</strong> {department.name_en || 'غير محدد'}</p>
              </div>
              <div>
                <p><strong>رئيس القسم:</strong> {department.head_teacher?.name || department.head || 'غير محدد'}
                  {department.head_teacher?.name_en && (
                    <span className="text-gray-500"> ({department.head_teacher.name_en})</span>
                  )}
                </p>
                <p><strong>الحالة:</strong> 
                  <span className={`mr-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    department.is_locked 
                      ? 'bg-red-50 text-red-700 ring-red-600/20' 
                      : 'bg-green-50 text-green-700 ring-green-600/20'
                  }`}>
                    {department.is_locked ? 'مغلق' : 'نشط'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{students.total}</div>
                <div className="text-sm text-blue-800">إجمالي الطلاب</div>
                <div className="text-xs text-blue-600 mt-1">{students.active} نشط</div>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{subjects.total}</div>
                <div className="text-sm text-indigo-800">المقررات الدراسية</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{fees.totalAmount.toLocaleString()}</div>
                <div className="text-sm text-green-800">إجمالي الرسوم (دينار)</div>
                <div className="text-xs text-green-600 mt-1">{fees.paid} مدفوع / {fees.unpaid} غير مدفوع</div>
              </div>
            </div>
          </div>

          {/* Students and Subjects Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Students */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">الطلاب المسجلون</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {students.data.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    لا يوجد طلاب مسجلون في هذا القسم
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {students.data.slice(0, 10).map((student: any) => (
                      <div key={student.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">#{student.id}</div>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          student.status === 'active' 
                            ? 'bg-green-50 text-green-700 ring-green-600/20' 
                            : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                        }`}>
                          {student.status === 'active' ? 'نشط' : student.status}
                        </span>
                      </div>
                    ))}
                    {students.data.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        و {students.data.length - 10} طالب آخر...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subjects */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">المقررات الدراسية</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {subjects.data.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    لا توجد مقررات مسجلة في هذا القسم
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {subjects.data.slice(0, 10).map((subject: any) => (
                      <div key={subject.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                            <div className="text-xs text-gray-500">كود: {subject.code}</div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {subject.credits} ساعة معتمدة
                          </div>
                        </div>
                      </div>
                    ))}
                    {subjects.data.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        و {subjects.data.length - 10} مقرر آخر...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}