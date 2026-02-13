import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMyGrades } from '../../lib/jwt-api';

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [bySubject, setBySubject] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'subjects' | 'all'>('subjects');

  useEffect(() => {
    if (user) loadGrades();
  }, [user]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentMyGrades();
      setGrades(data.grades || []);
      setBySubject(data.by_subject || []);
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      midterm: 'اختبار نصفي',
      final: 'اختبار نهائي',
      assignment: 'واجب',
      quiz: 'اختبار قصير',
      project: 'مشروع',
      participation: 'مشاركة',
      homework: 'واجب منزلي',
      classwork: 'عمل صفي',
    };
    return map[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fas fa-graduation-cap ml-2 text-purple-500"></i>
            درجاتي
          </h1>
          <p className="text-gray-600 mt-1">عرض جميع الدرجات المنشورة</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setViewMode('subjects')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'subjects' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-th-large ml-1"></i>
            حسب المادة
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-list ml-1"></i>
            عرض الكل
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'subjects' ? (
        /* By Subject View */
        bySubject.length > 0 ? (
          <div className="space-y-6">
            {bySubject.map((subjectGroup: any, idx: number) => (
              <div key={idx} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center ml-3">
                        <i className="fas fa-book text-purple-600"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{subjectGroup.subject?.name || 'مادة'}</h3>
                        {subjectGroup.subject?.code && (
                          <span className="text-xs text-gray-500">{subjectGroup.subject.code}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <span className="text-sm text-gray-500">{subjectGroup.grade_count} درجة</span>
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getGradeColor(subjectGroup.average)}`}>
                        المعدل: {subjectGroup.average}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {subjectGroup.grades.map((grade: any) => {
                    const percentage = grade.max_grade > 0 ? Math.round((grade.grade_value / grade.max_grade) * 100) : 0;
                    return (
                      <div key={grade.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="font-medium text-gray-900">{grade.grade_name}</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {getGradeTypeLabel(grade.grade_type)}
                              </span>
                            </div>
                            {grade.feedback && (
                              <p className="text-xs text-gray-500 mt-1">
                                <i className="fas fa-comment ml-1"></i>
                                {grade.feedback}
                              </p>
                            )}
                            {grade.grade_date && (
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(grade.grade_date).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getGradeColor(percentage)}`}>
                              {grade.grade_value} / {grade.max_grade}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-center">{percentage}%</p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                percentage >= 70 ? 'bg-green-500' :
                                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <i className="fas fa-graduation-cap text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد درجات منشورة</h3>
            <p className="text-gray-500">لم يتم نشر أي درجات بعد</p>
          </div>
        )
      ) : (
        /* All Grades View */
        grades.length > 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">المادة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">الدرجة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">النوع</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">العلامة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">النسبة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">المدرس</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grades.map((grade: any) => {
                    const percentage = grade.max_grade > 0 ? Math.round((grade.grade_value / grade.max_grade) * 100) : 0;
                    return (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {grade.subject?.name || '-'}
                          {grade.subject?.code && <span className="text-xs text-gray-400 mr-1">({grade.subject.code})</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{grade.grade_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {getGradeTypeLabel(grade.grade_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {grade.grade_value} / {grade.max_grade}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${getGradeColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{grade.teacher?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {grade.grade_date ? new Date(grade.grade_date).toLocaleDateString('ar-SA') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <i className="fas fa-graduation-cap text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد درجات منشورة</h3>
            <p className="text-gray-500">لم يتم نشر أي درجات بعد</p>
          </div>
        )
      )}
    </div>
  );
}
