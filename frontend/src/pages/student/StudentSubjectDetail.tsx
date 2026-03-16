import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStudentMySubjectDetail } from '../../lib/jwt-api';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const ASSIGNMENT_LABELS: Record<string, string> = {
  classwork: 'أعمال الفصل',
  midterm: 'الامتحان النصفي',
  final: 'الامتحان النهائي',
};

export default function StudentSubjectDetail() {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (subjectId) {
      void loadSubjectDetail();
    }
  }, [subjectId]);

  const loadSubjectDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchStudentMySubjectDetail(subjectId!);
      setData(response);
    } catch (err: any) {
      console.error('Failed to load subject detail:', err);
      setError(err?.message || 'تعذر تحميل تفاصيل المادة');
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = useMemo(() => {
    const total = data?.attendance?.stats?.total || 0;
    const present = data?.attendance?.stats?.present || 0;
    if (!total) return 0;
    return Math.round((present / total) * 100);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-xl bg-white"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-72 rounded-xl bg-white"></div>
              <div className="h-72 rounded-xl bg-white"></div>
            </div>
            <div className="space-y-6">
              <div className="h-52 rounded-xl bg-white"></div>
              <div className="h-52 rounded-xl bg-white"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.subject) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-10 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">تعذر تحميل المادة</h1>
          <p className="text-gray-500 mb-6">{error || 'المادة غير متاحة حالياً'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/student/subjects')}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              العودة إلى موادي
            </button>
            <button
              onClick={loadSubjectDetail}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { subject, enrollment, syllabus, schedule, assignments, attendance, grades, invoices } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/student/subjects')}
              className="mt-1 h-10 w-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                  {subject.code || 'بدون كود'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enrollment.attendance_allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {enrollment.attendance_allowed ? 'الحضور مسموح' : 'الحضور غير مسموح'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enrollment.payment_status === 'paid' ? 'bg-green-100 text-green-800' : enrollment.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {enrollment.payment_status === 'paid' ? 'مدفوع' : enrollment.payment_status === 'partial' ? 'دفع جزئي' : 'غير مدفوع'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-gray-500 mt-2">
                {subject.department?.name || enrollment.department?.name || 'بدون قسم'}
                {enrollment.semester?.name ? ` • ${enrollment.semester.name}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {syllabus?.available && (
              <a
                href={syllabus.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <i className="fas fa-file-pdf ml-2"></i>
                عرض السِّلَابِس
              </a>
            )}
            <button
              onClick={loadSubjectDetail}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-sync-alt ml-2"></i>
              تحديث
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">نظرة عامة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">الساعات المعتمدة</div>
                <div className="text-xl font-bold text-gray-900">{formatNumber(subject.credits || 0)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">نسبة الحضور</div>
                <div className="text-xl font-bold text-gray-900">{formatNumber(attendanceRate)}%</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">عدد الجلسات</div>
                <div className="text-xl font-bold text-gray-900">{formatNumber((data.sessions || []).length)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500 mb-1">عدد التقييمات</div>
                <div className="text-xl font-bold text-gray-900">{formatNumber((assignments || []).length)}</div>
              </div>
            </div>
            {subject.description && (
              <div className="mt-4 rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">وصف المادة</h3>
                <p className="text-sm text-gray-600 leading-7 whitespace-pre-wrap">{subject.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">الجدول</h2>
              <span className="text-sm text-gray-500">{formatNumber((schedule || []).length)} موعد</span>
            </div>
            {schedule?.length ? (
              <div className="space-y-3">
                {schedule.map((entry: any) => (
                  <div key={entry.id} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{DAY_NAMES[entry.day_of_week] || `يوم ${entry.day_of_week}`}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {entry.teacher?.name ? `المدرس: ${entry.teacher.name}` : 'المدرس غير محدد'}
                          {entry.room?.name || entry.room?.code ? ` • القاعة: ${entry.room?.name || entry.room?.code}` : ''}
                        </div>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-teal-50 text-teal-700 text-sm font-semibold">
                        {(entry.start_time || '').substring(0, 5)} - {(entry.end_time || '').substring(0, 5)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">لا يوجد جدول منشور لهذه المادة حالياً</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">التقييمات والواجبات</h2>
              <span className="text-sm text-gray-500">{formatNumber((assignments || []).length)} عنصر</span>
            </div>
            {assignments?.length ? (
              <div className="space-y-3">
                {assignments.map((assignment: any) => (
                  <div key={assignment.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {ASSIGNMENT_LABELS[assignment.type] || assignment.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.teacher?.name ? `المدرس: ${assignment.teacher.name}` : 'بدون مدرس محدد'}
                          {assignment.due_date ? ` • الاستحقاق: ${formatDate(assignment.due_date)}` : ''}
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{assignment.description}</p>
                        )}
                        {assignment.feedback && (
                          <p className="text-sm text-teal-700 mt-2">ملاحظات: {assignment.feedback}</p>
                        )}
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-center min-w-[120px]">
                        <div className="text-xs text-gray-500 mb-1">الدرجة</div>
                        <div className="text-lg font-bold text-gray-900">
                          {assignment.grade_value ?? '-'}
                          {assignment.max_grade ? ` / ${assignment.max_grade}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">لا توجد تقييمات أو واجبات منشورة لهذه المادة بعد</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">خطة المادة</h2>
            {subject.titles?.length ? (
              <div className="space-y-3">
                {subject.titles.map((title: any, index: number) => (
                  <div key={title.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="font-semibold text-gray-900 mb-2">{formatNumber(index + 1)}. {title.title}</div>
                    {title.description && (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-7">{title.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">لا توجد خطة تفصيلية منشورة لهذه المادة</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات سريعة</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">المدرس</span>
                <span className="font-medium text-gray-900">{subject.teacher?.name || 'غير محدد'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">الفصل</span>
                <span className="font-medium text-gray-900">{enrollment.semester?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">حالة التسجيل</span>
                <span className="font-medium text-gray-900">{enrollment.status || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">حالة الفاتورة</span>
                <span className="font-medium text-gray-900">{enrollment.invoice_status || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">الرصيد</span>
                <span className="font-medium text-gray-900">{enrollment.invoice_balance !== null && enrollment.invoice_balance !== undefined ? formatCurrency(enrollment.invoice_balance) : '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">السِّلَابِس</h2>
            {syllabus?.available ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-red-500">
                    <i className="fas fa-file-pdf"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{syllabus.name || 'ملف السِّلَابِس'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {syllabus.size ? `${(syllabus.size / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={syllabus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                      >
                        <i className="fas fa-eye ml-2"></i>
                        فتح
                      </a>
                      <a
                        href={syllabus.url}
                        download
                        className="inline-flex items-center px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-white transition-colors"
                      >
                        <i className="fas fa-download ml-2"></i>
                        تنزيل
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">لم يتم رفع ملف السِّلَابِس لهذه المادة بعد</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">المتطلبات السابقة</h2>
            {subject.prerequisite_subjects?.length ? (
              <div className="space-y-2">
                {subject.prerequisite_subjects.map((prerequisite: any) => (
                  <div key={prerequisite.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="font-medium text-gray-900">{prerequisite.name}</div>
                    <div className="text-xs text-gray-500">{prerequisite.code}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-500">لا توجد متطلبات سابقة</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">الفواتير المرتبطة</h2>
            {invoices?.length ? (
              <div className="space-y-3">
                {invoices.map((invoice: any) => (
                  <div key={invoice.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">{invoice.invoice_number}</div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {invoice.status}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">المبلغ الإجمالي: {formatCurrency(invoice.total_amount || 0)}</div>
                    <div className="text-sm text-gray-500">المتبقي: {formatCurrency(invoice.balance || 0)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-500">لا توجد فواتير مرتبطة مباشرة بهذه المادة</div>
            )}
          </div>
        </div>
      </div>

      {grades?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">كل الدرجات المنشورة</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3">العنوان</th>
                  <th className="pb-3">النوع</th>
                  <th className="pb-3">الدرجة</th>
                  <th className="pb-3">التاريخ</th>
                  <th className="pb-3">المدرس</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade: any) => (
                  <tr key={grade.id} className="border-b border-gray-50 last:border-b-0">
                    <td className="py-3 text-sm font-medium text-gray-900">{grade.grade_name}</td>
                    <td className="py-3 text-sm text-gray-600">{ASSIGNMENT_LABELS[grade.grade_type] || grade.grade_type}</td>
                    <td className="py-3 text-sm text-gray-600">{grade.grade_value} / {grade.max_grade}</td>
                    <td className="py-3 text-sm text-gray-600">{grade.grade_date ? formatDate(grade.grade_date) : '-'}</td>
                    <td className="py-3 text-sm text-gray-600">{grade.teacher?.name || '-'}</td>
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
