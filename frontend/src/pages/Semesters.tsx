import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchSemesters, fetchStudyYears, createSemester, updateSemester, deleteSemester, setCurrentSemester } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

export default function Semesters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [studyYearFilter, setStudyYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any | null>(null);
  const itemsPerPage = 10;

  const { data: semesters, isLoading, error } = useQuery({
    queryKey: ["semesters", searchTerm, studyYearFilter, statusFilter],
    queryFn: () => fetchSemesters(),
  });

  const { data: studyYears } = useQuery({
    queryKey: ["study-years"],
    queryFn: () => fetchStudyYears(),
  });

  const filteredSemesters = useMemo(() => {
    let filtered = semesters || [];
    
    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(semester => 
        semester.name.toLowerCase().includes(search) ||
        semester.name_en?.toLowerCase().includes(search) ||
        semester.code.toLowerCase().includes(search) ||
        semester.description?.toLowerCase().includes(search)
      );
    }

    if (studyYearFilter) {
      filtered = filtered.filter(semester => semester.study_year_id === studyYearFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(semester => {
        if (statusFilter === "current") return semester.is_current;
        if (statusFilter === "active") return semester.is_active && !semester.is_current;
        if (statusFilter === "inactive") return !semester.is_active;
        return true;
      });
    }
    
    return filtered;
  }, [semesters, searchTerm, studyYearFilter, statusFilter]);

  const paginatedSemesters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSemesters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSemesters, currentPage]);

  const totalPages = Math.ceil(filteredSemesters.length / itemsPerPage);

  const handleAdd = () => {
    setEditingSemester(null);
    setShowModal(true);
  };

  const handleEdit = (semester: any) => {
    setEditingSemester(semester);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الفصل الدراسي؟")) {
      try {
        await deleteSemester(id);
        queryClient.invalidateQueries({ queryKey: ["semesters"] });
        alert("تم حذف الفصل الدراسي بنجاح!");
      } catch (error: any) {
        console.error("Error deleting semester:", error);
        alert("خطأ في حذف الفصل الدراسي: " + error.message);
      }
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await setCurrentSemester(id);
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      alert("تم تعيين الفصل الدراسي كحالي بنجاح!");
    } catch (error: any) {
      console.error("Error setting current semester:", error);
      alert("خطأ في تعيين الفصل الدراسي: " + error.message);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل الفصول الدراسية" />;

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
                <h1 className="text-3xl font-bold text-gray-900">إدارة الفصول الدراسية</h1>
                <p className="text-sm text-gray-600 mt-1">إدارة وتنظيم الفصول الدراسية</p>
              </div>
            </div>
            <div className="flex gap-3">
              {hasClientPermission("semesters", "create") && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة فصل دراسي
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  البحث
                </label>
                <input
                  type="text"
                  id="search"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  placeholder="البحث في اسم الفصل، الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="study_year" className="block text-sm font-medium text-gray-700 mb-2">
                  السنة الدراسية
                </label>
                <select
                  id="study_year"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  value={studyYearFilter}
                  onChange={(e) => setStudyYearFilter(e.target.value)}
                >
                  <option value="">جميع السنوات</option>
                  {studyYears?.map((year: any) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
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
                  <option value="">جميع الفصول</option>
                  <option value="current">الفصل الحالي</option>
                  <option value="active">الفصول النشطة</option>
                  <option value="inactive">الفصول غير النشطة</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              عرض {filteredSemesters.length} من {semesters?.length || 0} فصل دراسي
            </div>
          </div>
        </div>

        {/* Semesters Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              قائمة الفصول الدراسية
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الفصل الدراسي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    السنة الدراسية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الفترة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSemesters.map((semester: any, index: number) => (
                  <tr key={semester.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg ml-3">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{semester.name}</div>
                          {semester.name_en && (
                            <div className="text-sm text-gray-500">{semester.name_en}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">الكود: {semester.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {semester.study_years?.name || 'غير محدد'}
                      </div>
                      {semester.study_years?.name_en && (
                        <div className="text-sm text-gray-500">{semester.study_years.name_en}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(semester.start_date).toLocaleDateString('ar-SA')} - {new Date(semester.end_date).toLocaleDateString('ar-SA')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.ceil((new Date(semester.end_date).getTime() - new Date(semester.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7))} أسبوع
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {semester.is_current && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            الفصل الحالي
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          semester.is_active 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {semester.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {!semester.is_current && semester.is_active && (
                          <button
                            onClick={() => handleSetCurrent(semester.id)}
                            className="p-2 text-green-600 hover:text-green-900 rounded-lg hover:bg-green-100 transition-colors duration-200"
                            title="تعيين كحالي"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {hasClientPermission("semesters", "update") && (
                          <button
                            onClick={() => handleEdit(semester)}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {hasClientPermission("semesters", "delete") && !semester.is_current && (
                          <button
                            onClick={() => handleDelete(semester.id)}
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

        {/* Semester Modal */}
        {showModal && (
          <SemesterModal
            semester={editingSemester}
            studyYears={studyYears || []}
            onClose={() => setShowModal(false)}
            onSave={() => {
              setShowModal(false);
              queryClient.invalidateQueries({ queryKey: ["semesters"] });
            }}
          />
        )}
      </div>
    </div>
  );
}

// Semester Modal Component
function SemesterModal({ semester, studyYears, onClose, onSave }: { semester: any | null, studyYears: any[], onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: semester?.name || "",
    name_en: semester?.name_en || "",
    code: semester?.code || "",
    study_year_id: semester?.study_year_id || "",
    start_date: semester?.start_date || "",
    end_date: semester?.end_date || "",
    is_active: semester?.is_active ?? true,
    description: semester?.description || ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (semester) {
        await updateSemester(semester.id, formData);
      } else {
        await createSemester(formData);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving semester:", error);
      alert("خطأ في حفظ الفصل الدراسي: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {semester ? "تعديل الفصل الدراسي" : "إضافة فصل دراسي جديد"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                اسم الفصل الدراسي *
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: الفصل الأول"
              />
            </div>

            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-2">
                الاسم بالإنجليزية
              </label>
              <input
                type="text"
                id="name_en"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: Fall Semester"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                كود الفصل *
              </label>
              <input
                type="text"
                id="code"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثال: F24"
              />
            </div>

            <div>
              <label htmlFor="study_year_id" className="block text-sm font-medium text-gray-700 mb-2">
                السنة الدراسية *
              </label>
              <select
                id="study_year_id"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={formData.study_year_id}
                onChange={(e) => setFormData({ ...formData, study_year_id: e.target.value })}
              >
                <option value="">اختر السنة الدراسية</option>
                {studyYears.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ البداية *
                </label>
                <input
                  type="date"
                  id="start_date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ النهاية *
                </label>
                <input
                  type="date"
                  id="end_date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الفصل الدراسي..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="is_active" className="mr-2 text-sm text-gray-700">
                نشط
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? "جاري الحفظ..." : (semester ? "تحديث" : "إضافة")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

