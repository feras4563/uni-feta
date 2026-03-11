import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchDepartments, fetchDepartmentDetails, deleteDepartment } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { formatDate } from "../lib/utils";

export default function DepartmentsNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  const { data: departments, isLoading, error } = useQuery({
    queryKey: ["departments", searchTerm, statusFilter],
    queryFn: () => fetchDepartments(),
  });

  // Fetch detailed information for selected department
  const { data: departmentDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["department-details", selectedDepartment?.id],
    queryFn: () => fetchDepartmentDetails(selectedDepartment.id),
    enabled: !!selectedDepartment?.id
  });

  const filteredDepartments = useMemo(() => {
    let filtered = departments || [];
    
    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(search) ||
        dept.name_en?.toLowerCase().includes(search) ||
        dept.head_teacher?.name?.toLowerCase().includes(search) ||
        dept.head?.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(dept => 
        statusFilter === "locked" ? dept.is_locked : !dept.is_locked
      );
    }
    
    return filtered;
  }, [departments, searchTerm, statusFilter]);

  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartments, currentPage]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  const handleAdd = () => {
    navigate("/departments/create");
  };

  const handleEdit = (department: any) => {
    navigate(`/departments/${department.id}/edit`);
  };

  const handleView = (department: any) => {
    navigate(`/departments/${department.id}`);
  };

  const handleViewDetails = (department: any) => {
    setSelectedDepartment(department);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDepartment(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      try {
        await deleteDepartment(id);
        alert("تم حذف القسم بنجاح!");
        queryClient.invalidateQueries({ queryKey: ["departments"] });
        queryClient.removeQueries({ queryKey: ["department", id] });
        queryClient.removeQueries({ queryKey: ["department-details", id] });
      } catch (error: any) {
        console.error("Error deleting department:", error);
        alert("خطأ في حذف القسم: " + (error?.message || "حدث خطأ غير متوقع"));
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل الأقسام" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة الأقسام</h1>
                <p className="text-sm text-gray-600 mt-1">إدارة وتنظيم أقسام الجامعة</p>
              </div>
            </div>
            <div className="flex gap-3">
              {hasClientPermission("departments", "create") && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة قسم جديد
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  البحث
                </label>
                <input
                  type="text"
                  id="search"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  placeholder="البحث في اسم القسم، رئيس القسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة
                </label>
                <select
                  id="status"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">جميع الأقسام</option>
                  <option value="active">الأقسام النشطة</option>
                  <option value="locked">الأقسام المقفلة</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              عرض {filteredDepartments.length} من {departments?.length || 0} قسم
            </div>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              قائمة الأقسام
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    القسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    رئيس القسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDepartments.map((department: any, index: number) => (
                  <tr key={department.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg ml-3">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{department.name}</div>
                          {department.name_en && (
                            <div className="text-sm text-gray-500">{department.name_en}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {department.head_teacher?.name || department.head || 'غير محدد'}
                      </div>
                      {department.head_teacher?.name_en && (
                        <div className="text-sm text-gray-500">{department.head_teacher.name_en}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        department.is_locked 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {department.is_locked ? 'مقفل' : 'نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(department.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(department)}
                          className="p-2 text-blue-600 hover:text-blue-900 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                          title="عرض التفاصيل"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleView(department)}
                          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          title="عرض التفاصيل"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {hasClientPermission("departments", "edit") && (
                          <button
                            onClick={() => handleEdit(department)}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {hasClientPermission("departments", "delete") && (
                          <button
                            onClick={() => handleDelete(department.id)}
                            className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-100 transition-colors duration-200"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                صفحة {currentPage} من {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  السابق
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Department Details Modal */}
        {showDetailsModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">تفاصيل القسم: {selectedDepartment.name}</h2>
                  <button
                    onClick={handleCloseDetailsModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {detailsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">جاري تحميل التفاصيل...</p>
                  </div>
                ) : departmentDetails ? (
                  <div className="space-y-6">
                    {/* Department Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">معلومات القسم</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>الاسم:</strong> {departmentDetails.department.name}</div>
                        {departmentDetails.department.name_en && (
                          <div><strong>الاسم (إنجليزي):</strong> {departmentDetails.department.name_en}</div>
                        )}
                        <div><strong>رئيس القسم:</strong> {departmentDetails.department.head_teacher?.name || departmentDetails.department.head || 'غير محدد'}</div>
                        <div><strong>الحالة:</strong> {departmentDetails.department.is_locked ? 'مقفل' : 'نشط'}</div>
                      </div>
                    </div>

                    {/* Semesters */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">الفصول الدراسية ({departmentDetails.totalSemesters})</h3>
                      <div className="space-y-3">
                        {departmentDetails.semesters.map((semester: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900">{semester.name}</h4>
                              <span className="text-sm text-gray-500">{semester.totalSubjects} مادة</span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              إجمالي الساعات المعتمدة: {semester.totalCredits}
                            </div>
                            <div className="space-y-1">
                              {semester.subjects.slice(0, 3).map((subject: any) => (
                                <div key={subject.id} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                  {subject.code} - {subject.name} ({subject.credits} ساعة)
                                </div>
                              ))}
                              {semester.subjects.length > 3 && (
                                <div className="text-xs text-gray-400">
                                  +{semester.subjects.length - 3} مواد أخرى
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">خطأ في تحميل تفاصيل القسم</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}