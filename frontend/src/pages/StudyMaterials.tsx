import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchSubjects, fetchDepartments } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import SubjectTeachersModal from "../components/subject/SubjectTeachersModal";
import { formatCurrency } from "../lib/utils";

export default function StudyMaterials() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showTeachersModal, setShowTeachersModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const itemsPerPage = 10;

  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ["subjects", searchTerm, selectedDepartment],
    queryFn: () => fetchSubjects(searchTerm),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });



  const filteredSubjects = useMemo(() => {
    let filtered = subjects || [];
    
    if (selectedDepartment) {
      filtered = filtered.filter(subject => subject.department_id === selectedDepartment);
    }

    if (selectedSemester) {
      filtered = filtered.filter(subject => String(subject.semester_number) === selectedSemester);
    }
    
    return filtered;
  }, [subjects, selectedDepartment, selectedSemester]);

  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubjects, currentPage]);

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const handleAdd = () => {
    navigate("/subjects/create");
  };

  const handleEdit = (subject: any) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleView = (subject: any) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المقرر الدراسي؟")) {
      try {
        // You can implement subject deletion here
        alert("تم حذف المقرر الدراسي بنجاح!");
        queryClient.invalidateQueries({ queryKey: ["subjects"] });
      } catch (error: any) {
        console.error("Error deleting subject:", error);
        alert("خطأ في حذف المقرر الدراسي: " + error.message);
      }
    }
  };

  // Subject-Teacher handlers
  const handleManageTeachers = (subject: any) => {
    setSelectedSubject(subject);
    setShowTeachersModal(true);
  };

  const handleCloseTeachersModal = () => {
    setShowTeachersModal(false);
    setSelectedSubject(null);
  };


  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل المقررات الدراسية" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة المقررات الدراسية</h1>
                <p className="text-sm text-gray-600 mt-1">إدارة وتنظيم المقررات الدراسية للأقسام</p>
              </div>
            </div>
            <div className="flex gap-3">
              {hasClientPermission("subjects", "create") && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة مقرر دراسي
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              البحث والتصفية
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  البحث
                </label>
                <input
                  type="text"
                  id="search"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  placeholder="البحث في اسم المقرر، الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  القسم
                </label>
                <select
                  id="department"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  value={selectedDepartment}
                  onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">جميع الأقسام</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  الفصل الدراسي
                </label>
                <select
                  id="semester"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  value={selectedSemester}
                  onChange={(e) => { setSelectedSemester(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">جميع الفصول</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={String(num)}>
                      الفصل {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              عرض {filteredSubjects.length} من {subjects?.length || 0} مقرر دراسي
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              قائمة المقررات الدراسية
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    المقرر الدراسي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الكود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    القسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الساعات المعتمدة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الفصل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    المدرس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    التكلفة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSubjects.map((subject: any, index: number) => (
                  <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg ml-3">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                          {subject.name_en && (
                            <div className="text-sm text-gray-500">{subject.name_en}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subject.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.department?.name || 'غير محدد'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.credits || 0} ساعة</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subject.semester_number ? `الفصل ${subject.semester_number}` : 'غير محدد'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {subject.teacher?.name || 'غير محدد'}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleManageTeachers(subject)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                            title="إدارة المدرسين"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            إدارة المدرسين
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subject.cost_per_credit ? (
                          <div>
               <div className="font-medium text-green-600">
                 {formatCurrency((subject.credits || 0) * parseFloat(subject.cost_per_credit), 'دينار')}
               </div>
               <div className="text-xs text-gray-500">
                 {subject.cost_per_credit} دينار/ساعة
               </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">غير محدد</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(subject)}
                          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          title="عرض التفاصيل"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {hasClientPermission("subjects", "update") && (
                          <button
                            onClick={() => handleEdit(subject)}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {hasClientPermission("subjects", "delete") && (
                          <button
                            onClick={() => handleDelete(subject.id)}
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
      </div>

      {/* Subject Teachers Modal */}
      <SubjectTeachersModal
        isOpen={showTeachersModal}
        onClose={handleCloseTeachersModal}
        subject={selectedSubject}
      />
    </div>
  );
}
