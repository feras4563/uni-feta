import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchMySubjects, fetchMyStudents } from '../../lib/jwt-api';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [studentGroups, setStudentGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedSubject]);

  const loadSubjects = async () => {
    try {
      const data = await fetchMySubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const params: any = {};
      if (selectedSubject !== 'all') {
        params.subject_id = selectedSubject;
      }
      const data = await fetchMyStudents(params);
      setStudentGroups(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Flatten all students for search
  const allStudents = studentGroups.flatMap((group: any) =>
    (group.students || []).map((s: any) => ({
      ...s,
      subjectName: group.subject?.name,
      subjectCode: group.subject?.code,
    }))
  );

  // Filter by search
  const filteredStudents = searchTerm
    ? allStudents.filter(s =>
        s.student?.name?.includes(searchTerm) ||
        s.student?.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student?.campus_id?.includes(searchTerm) ||
        s.student?.email?.includes(searchTerm)
      )
    : allStudents;

  // Get unique students count
  const uniqueStudentIds = new Set(allStudents.map(s => s.student?.id));
  const totalUniqueStudents = uniqueStudentIds.size;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">طلابي</h1>
        <p className="text-gray-600 text-sm">عرض الطلاب المسجلين في موادك الدراسية</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-user-graduate text-blue-600 text-lg"></i>
            </div>
            <div className="mr-3">
              <div className="text-sm text-gray-500">إجمالي الطلاب</div>
              <div className="text-xl font-bold text-gray-900">{totalUniqueStudents}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-book text-green-600 text-lg"></i>
            </div>
            <div className="mr-3">
              <div className="text-sm text-gray-500">المواد الدراسية</div>
              <div className="text-xl font-bold text-gray-900">{subjects.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-clipboard-list text-purple-600 text-lg"></i>
            </div>
            <div className="mr-3">
              <div className="text-sm text-gray-500">إجمالي التسجيلات</div>
              <div className="text-xl font-bold text-gray-900">{allStudents.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب المادة</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المواد</option>
              {subjects.map((s: any) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject?.name} ({s.subject?.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="بحث بالاسم أو الرقم الجامعي..."
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Students Content */}
      {loadingStudents ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلاب...</p>
        </div>
      ) : studentGroups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-user-graduate text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد طلاب</h3>
          <p className="text-gray-500">لا يوجد طلاب مسجلين في موادك حالياً</p>
        </div>
      ) : selectedSubject === 'all' ? (
        /* Grouped by Subject View */
        <div className="space-y-6">
          {studentGroups.map((group: any, groupIdx: number) => (
            <div key={groupIdx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ml-3">
                    <i className="fas fa-book text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {group.subject?.name}
                      {group.subject?.code && <span className="text-gray-500 font-normal mr-2">({group.subject.code})</span>}
                    </h3>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {group.student_count} طالب
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">#</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الرقم الجامعي</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">اسم الطالب</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">الحالة</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">الحضور</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">الدرجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(group.students || [])
                      .filter((s: any) =>
                        !searchTerm ||
                        s.student?.name?.includes(searchTerm) ||
                        s.student?.campus_id?.includes(searchTerm)
                      )
                      .map((enrollment: any, idx: number) => (
                        <tr key={enrollment.enrollment_id || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2 text-sm font-mono text-gray-700">
                            {enrollment.student?.campus_id}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              {enrollment.student?.photo_url ? (
                                <img src={enrollment.student.photo_url} alt="" className="w-7 h-7 rounded-full ml-2 object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center ml-2">
                                  <i className="fas fa-user text-gray-400 text-xs"></i>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{enrollment.student?.name}</div>
                                {enrollment.student?.email && (
                                  <div className="text-xs text-gray-500">{enrollment.student.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              enrollment.status === 'enrolled' || enrollment.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : enrollment.status === 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {enrollment.status === 'enrolled' || enrollment.status === 'active' ? 'مسجل' :
                               enrollment.status === 'completed' ? 'مكتمل' : enrollment.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {enrollment.attendance_allowed ? (
                              <i className="fas fa-check-circle text-green-500"></i>
                            ) : (
                              <i className="fas fa-times-circle text-red-400"></i>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {enrollment.grade != null ? (
                              <span className="text-sm font-medium text-gray-900">
                                {enrollment.grade}
                                {enrollment.grade_letter && (
                                  <span className="text-xs text-gray-500 mr-1">({enrollment.grade_letter})</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single Subject - Flat Table */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">
              {filteredStudents.length} طالب
              {searchTerm && ` (نتائج البحث عن "${searchTerm}")`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الرقم الجامعي</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">اسم الطالب</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">البريد</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الهاتف</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((enrollment: any, idx: number) => (
                  <tr key={enrollment.enrollment_id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-700">
                      {enrollment.student?.campus_id}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        {enrollment.student?.photo_url ? (
                          <img src={enrollment.student.photo_url} alt="" className="w-7 h-7 rounded-full ml-2 object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center ml-2">
                            <i className="fas fa-user text-gray-400 text-xs"></i>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{enrollment.student?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{enrollment.student?.email || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{enrollment.student?.phone || '—'}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        enrollment.status === 'enrolled' || enrollment.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status === 'enrolled' || enrollment.status === 'active' ? 'مسجل' : enrollment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
