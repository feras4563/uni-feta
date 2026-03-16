import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudents, fetchDepartments, deleteStudent, exportStudents } from "../lib/jwt-api";
import StudentQRModal from "../components/students/StudentQRModal";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/JWTAuthContext";
import { formatDate, formatNumber } from "../lib/utils";

export default function StudentsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 15;
  const queryClient = useQueryClient();

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.name?.toLowerCase().includes(term) ||
        s.name_en?.toLowerCase().includes(term) ||
        s.campus_id?.toLowerCase().includes(term) ||
        s.national_id_passport?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.includes(term)
      );
    }
    if (departmentFilter) filtered = filtered.filter((s: any) => s.department_id === departmentFilter);
    if (yearFilter) filtered = filtered.filter((s: any) => s.year === parseInt(yearFilter));
    if (statusFilter) filtered = filtered.filter((s: any) => s.status === statusFilter);
    if (genderFilter) filtered = filtered.filter((s: any) => s.gender === genderFilter);
    if (nationalityFilter) {
      if (nationalityFilter === 'foreign') {
        filtered = filtered.filter((s: any) => s.nationality && s.nationality !== 'ليبيا' && s.nationality !== 'ليبي' && s.nationality !== 'ليبية');
      } else {
        filtered = filtered.filter((s: any) => s.nationality === nationalityFilter);
      }
    }

    return filtered;
  }, [students, searchTerm, departmentFilter, yearFilter, statusFilter, genderFilter, nationalityFilter]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(start, start + studentsPerPage);
  }, [filteredStudents, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, departmentFilter, yearFilter, statusFilter, genderFilter, nationalityFilter]);

  const getDepartmentName = (departmentId: string) => {
    if (!departmentId) return 'غير محدد';
    const dept = departments.find((d: any) => d.id === departmentId);
    return dept ? dept.name : 'غير محدد';
  };

  const viewStudentQR = (student: any) => {
    setSelectedStudent({
      ...student,
      department_name: student.department?.name || getDepartmentName(student.department_id)
    });
    setShowQRModal(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await deleteStudent(studentId);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert('خطأ في حذف الطالب');
    }
  };

  const hasActiveFilters = departmentFilter || yearFilter || statusFilter || genderFilter || nationalityFilter;
  const clearFilters = () => {
    setDepartmentFilter("");
    setYearFilter("");
    setStatusFilter("");
    setGenderFilter("");
    setNationalityFilter("");
    setSearchTerm("");
  };

  const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
  const getPhotoUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      active: { label: 'نشط', cls: 'bg-gray-100 text-gray-800' },
      inactive: { label: 'غير نشط', cls: 'bg-red-50 text-red-700' },
      graduated: { label: 'متخرج', cls: 'bg-gray-200 text-gray-700' },
      suspended: { label: 'معلق', cls: 'bg-yellow-50 text-yellow-700' },
    };
    const c = map[status] || map.inactive;
    return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.label}</span>;
  };

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>تعذر تحميل بيانات الطلاب.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatNumber(students.length)} طالب مسجل
            {user?.role === 'teacher' && user?.departmentName && ` - قسم ${user.departmentName}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const params: Record<string, string> = {};
              if (searchTerm) params.search = searchTerm;
              if (departmentFilter) params.department_id = departmentFilter;
              if (yearFilter) params.year = yearFilter;
              if (statusFilter) params.status = statusFilter;
              if (genderFilter) params.gender = genderFilter;
              if (nationalityFilter) params.nationality = nationalityFilter;
              exportStudents(params);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            تصدير CSV
          </button>
          <button
            onClick={() => navigate('/university-forms')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            النماذج الجامعية
          </button>
          {canCreate('students') && (
            <button
              onClick={() => navigate('/students/create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
              إضافة طالب
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، الرقم، الهوية، البريد..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400">
            <option value="">جميع الأقسام</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400">
            <option value="">جميع السنوات</option>
            <option value="1">السنة الأولى</option>
            <option value="2">السنة الثانية</option>
            <option value="3">السنة الثالثة</option>
            <option value="4">السنة الرابعة</option>
            <option value="5">السنة الخامسة</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400">
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="graduated">متخرج</option>
            <option value="suspended">معلق</option>
          </select>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400">
            <option value="">الجنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
          <select value={nationalityFilter} onChange={(e) => setNationalityFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-400">
            <option value="">الجنسية</option>
            <option value="ليبيا">ليبي</option>
            <option value="foreign">وافد (غير ليبي)</option>
            <option value="مصر">مصري</option>
            <option value="تونس">تونسي</option>
            <option value="الجزائر">جزائري</option>
            <option value="المغرب">مغربي</option>
            <option value="السودان">سوداني</option>
            <option value="فلسطين">فلسطيني</option>
            <option value="سوريا">سوري</option>
            <option value="العراق">عراقي</option>
            <option value="الأردن">أردني</option>
            <option value="لبنان">لبناني</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-800 underline">مسح الفلاتر</button>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          عرض {filteredStudents.length} من {students.length} طالب
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-right font-medium text-gray-600">الطالب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">رقم الطالب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الهوية</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">القسم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">السنة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">التسجيل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getPhotoUrl(student.photo_url) ? (
                          <img src={getPhotoUrl(student.photo_url)!} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        {student.name_en && <div className="text-xs text-gray-400">{student.name_en}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{student.campus_id || '-'}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{student.national_id_passport || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{getDepartmentName(student.department_id)}</td>
                  <td className="px-4 py-3 text-gray-700">{student.year ? `سنة ${student.year}` : '-'}</td>
                  <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(student.enrollment_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                        title="عرض الملف الشخصي"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                        onClick={() => viewStudentQR(student)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                        title="رمز QR"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                      </button>
                      {canDelete('students') && (
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">صفحة {currentPage} من {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">السابق</button>
            {visiblePages.map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 text-xs rounded-lg ${p === currentPage ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">التالي</button>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <StudentQRModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        student={selectedStudent}
      />
    </div>
  );
}