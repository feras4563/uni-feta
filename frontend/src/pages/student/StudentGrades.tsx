import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMyGrades } from '../../lib/jwt-api';
import { formatDate } from '../../lib/utils';

// Grade type columns shown in the summary table
const GRADE_COLUMNS = [
  { key: 'classwork', label: 'أعمال الفصل' },
  { key: 'midterm', label: 'النصفي' },
  { key: 'final', label: 'النهائي' },
] as const;

export default function StudentGrades() {
  const { user } = useAuth();
  const [bySubject, setBySubject] = useState<any[]>([]);
  const [overallGPA, setOverallGPA] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadGrades();
  }, [user]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const data: any = await fetchStudentMyGrades();
      setBySubject(Array.isArray(data.by_subject) ? data.by_subject : []);
      setOverallGPA(Number(data.overall_gpa) || 0);
      setTotalCredits(Number(data.total_credits) || 0);
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate grades by type for a subject: sum value / sum max
  const getTypeAggregate = (subjectGrades: any[], type: string) => {
    const matched = subjectGrades.filter((g: any) => g.grade_type === type);
    if (matched.length === 0) return null;
    const totalVal = matched.reduce((s: number, g: any) => s + parseFloat(g.grade_value), 0);
    const totalMax = matched.reduce((s: number, g: any) => s + parseFloat(g.max_grade), 0);
    return { value: totalVal, max: totalMax, count: matched.length };
  };

  // Which columns actually have data across all subjects
  const activeColumns = GRADE_COLUMNS.filter(col =>
    bySubject.some((s: any) => s.grades.some((g: any) => g.grade_type === col.key))
  );

  const failedCount = bySubject.filter((s: any) => s.needs_retake).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          <i className="fas fa-graduation-cap ml-2 text-gray-500"></i>
          كشف الدرجات
        </h1>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-sm text-gray-500">الدرجات المنشورة للفصل الحالي</p>
          {bySubject.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                المعدل التراكمي: <span className="font-bold text-gray-800">{overallGPA.toFixed(2)}</span>
                <span className="text-gray-400"> / 4.0</span>
              </span>
              <span className="text-sm text-gray-500">
                إجمالي الوحدات: <span className="font-bold text-gray-800">{totalCredits}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded w-full"></div>
            ))}
          </div>
        </div>
      ) : bySubject.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <i className="fas fa-graduation-cap text-gray-300 text-4xl mb-4"></i>
          <h3 className="text-base font-medium text-gray-900 mb-1">لا توجد درجات منشورة</h3>
          <p className="text-sm text-gray-500">لم يتم نشر أي درجات بعد</p>
        </div>
      ) : (
        <>
          {/* Main Grades Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">المادة</th>
                    <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">الرمز</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">الوحدات</th>
                    {activeColumns.map(col => (
                      <th key={col.key} className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{col.label}</th>
                    ))}
                    <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap bg-gray-100">المجموع</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap bg-gray-100">النسبة</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">التقدير</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bySubject.map((subjectGroup: any) => {
                    const subjectId = subjectGroup.subject?.id;
                    const isFailing = subjectGroup.needs_retake;
                    const isExpanded = expandedSubject === subjectId;
                    const letterGrade = subjectGroup.letter_grade;

                    return (
                      <tr
                        key={subjectId}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                        onClick={() => setExpandedSubject(isExpanded ? null : subjectId)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          <div className="flex items-center">
                            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'left'} text-gray-400 text-[10px] ml-2 transition-transform`}></i>
                            {subjectGroup.subject?.name || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-500 font-mono text-xs">{subjectGroup.subject?.code || '—'}</td>
                        <td className="px-3 py-3 text-center text-gray-700 font-medium">{subjectGroup.credits || subjectGroup.subject?.credits || '—'}</td>
                        {activeColumns.map(col => {
                          const agg = getTypeAggregate(subjectGroup.grades, col.key);
                          if (!agg) return <td key={col.key} className="px-3 py-3 text-center text-gray-300">—</td>;
                          const pct = agg.max > 0 ? (agg.value / agg.max) * 100 : 0;
                          return (
                            <td key={col.key} className="px-3 py-3 text-center">
                              <span className={`font-medium ${pct < 50 ? 'text-red-600' : 'text-gray-800'}`}>
                                {agg.value}/{agg.max}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center bg-gray-50/50">
                          <span className={`font-bold ${isFailing ? 'text-red-600' : 'text-gray-900'}`}>
                            {subjectGroup.total_value}/{subjectGroup.total_max}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center bg-gray-50/50">
                          <span className={`font-bold ${isFailing ? 'text-red-600' : subjectGroup.average >= 70 ? 'text-green-700' : 'text-gray-900'}`}>
                            {subjectGroup.average}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {letterGrade && (
                            <span className={`font-bold ${isFailing ? 'text-red-600' : 'text-gray-800'}`}>
                              {letterGrade.letter}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {isFailing ? (
                            <span className="text-red-600 text-xs font-medium">راسب — إعادة</span>
                          ) : (
                            <span className="text-green-700 text-xs font-medium">ناجح</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer row: overall */}
                {bySubject.length > 1 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-4 py-3 font-bold text-gray-700" colSpan={3 + activeColumns.length}>المعدل العام (موزون بالوحدات)</td>
                      <td className="px-3 py-3 text-center bg-gray-100" colSpan={2}>
                        <span className="font-bold text-gray-900">
                          GPA {overallGPA.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 mr-1">({totalCredits} وحدة)</span>
                      </td>
                      <td className="px-3 py-3 text-center" colSpan={2}>
                        {failedCount > 0 && (
                          <span className="text-xs text-red-600">{failedCount} مادة تحتاج إعادة</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Expanded detail panel — shows below the table when a subject is clicked */}
          {expandedSubject && (() => {
            const subjectGroup = bySubject.find((s: any) => s.subject?.id === expandedSubject);
            if (!subjectGroup) return null;
            return (
              <div className="mt-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    تفاصيل درجات: {subjectGroup.subject?.name}
                    {subjectGroup.subject?.code && <span className="text-gray-400 font-normal mr-2">({subjectGroup.subject.code})</span>}
                  </h3>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedSubject(null); }} className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-right px-4 py-2 font-medium text-gray-500">التقييم</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">النوع</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">الدرجة</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">النسبة</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-500">التقدير</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">المدرس</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">التاريخ</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subjectGroup.grades.map((grade: any) => {
                      const pct = grade.percentage ?? (grade.max_grade > 0 ? Math.round((grade.grade_value / grade.max_grade) * 100) : 0);
                      const lg = grade.letter_grade;
                      const typeLabels: Record<string, string> = {
                        classwork: 'أعمال الفصل', midterm: 'الامتحان النصفي', final: 'الامتحان النهائي',
                      };
                      return (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-900">{grade.grade_name}</td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs">{typeLabels[grade.grade_type] || grade.grade_type}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`font-medium ${pct < 50 ? 'text-red-600' : 'text-gray-900'}`}>
                              {grade.grade_value}/{grade.max_grade}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`font-medium ${pct < 50 ? 'text-red-600' : pct >= 70 ? 'text-green-700' : 'text-gray-700'}`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`font-medium ${pct < 50 ? 'text-red-600' : 'text-gray-700'}`}>
                              {lg?.letter || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs">{grade.teacher?.name || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">
                            {grade.grade_date ? formatDate(grade.grade_date) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">
                            {grade.feedback || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Compact grade scale — inline, not a big card */}
          <div className="mt-4 flex items-center gap-3 text-[11px] text-gray-400">
            <span className="font-medium text-gray-500">سلم التقديرات:</span>
            {[
              { letter: 'A', range: '90+' },
              { letter: 'B', range: '80-89' },
              { letter: 'C', range: '70-79' },
              { letter: 'D', range: '60-69' },
              { letter: 'D-', range: '50-59' },
              { letter: 'F', range: '<50' },
            ].map((g, i) => (
              <span key={g.letter}>
                <span className="font-bold text-gray-500">{g.letter}</span> {g.range}%
                {i < 5 && <span className="mx-1 text-gray-300">|</span>}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
