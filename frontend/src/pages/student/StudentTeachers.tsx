import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMyTeachers } from '../../lib/jwt-api';

interface TeacherItem {
  id: string;
  name: string;
  name_en?: string;
  email?: string;
  campus_id?: string;
  specialization?: string;
  photo_url?: string;
  department?: {
    id: string;
    name: string;
    name_en?: string;
  } | null;
  subjects: Array<{
    id: string;
    name: string;
    name_en?: string;
    code?: string;
  }>;
}

export default function StudentTeachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTeachers();
    }
  }, [user]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentMyTeachers();
      setTeachers(data?.teachers || []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fas fa-chalkboard-teacher ml-2 text-indigo-500"></i>
            مدرسي
          </h1>
          <p className="text-gray-600 mt-1">قائمة المدرسين المرتبطين بموادك المسجلة</p>
        </div>
        <button
          onClick={loadTeachers}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <i className={`fas fa-sync-alt ml-2 ${loading ? 'animate-spin' : ''}`}></i>
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {teacher.photo_url ? (
                    <img
                      src={teacher.photo_url}
                      alt={teacher.name}
                      className="w-12 h-12 rounded-full object-cover ml-3 border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ml-3 font-bold">
                      {teacher.name?.charAt(0) || 'م'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{teacher.name}</h3>
                    {teacher.specialization && (
                      <p className="text-xs text-gray-500 mt-0.5">{teacher.specialization}</p>
                    )}
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  {teacher.subjects.length} مادة
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {teacher.department?.name && (
                  <div>
                    <i className="fas fa-building ml-2 text-gray-400"></i>
                    {teacher.department.name}
                  </div>
                )}
                {teacher.email && (
                  <div dir="ltr" className="text-left">
                    <i className="fas fa-envelope ml-2 text-gray-400"></i>
                    {teacher.email}
                  </div>
                )}
                {teacher.campus_id && (
                  <div>
                    <i className="fas fa-id-badge ml-2 text-gray-400"></i>
                    {teacher.campus_id}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">المواد التي يدرسها لك:</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <span key={subject.id} className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700">
                      {subject.name}
                      {subject.code ? ` (${subject.code})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-chalkboard-teacher text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد مدرسون حالياً</h3>
          <p className="text-gray-500">لم يتم ربط موادك الحالية بمدرسين بعد.</p>
        </div>
      )}
    </div>
  );
}
