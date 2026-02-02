import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, XCircle, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/jwt-auth';

interface JournalEntryLine {
  id: number;
  account_id: number;
  account: {
    id: number;
    account_name: string;
    account_number: string;
  };
  debit: string;
  credit: string;
  description: string;
  line_number: number;
}

interface JournalEntry {
  id: number;
  entry_number: string;
  entry_type: string;
  reference_number: string;
  entry_date: string;
  posting_date: string;
  series: string;
  company: string;
  notes: string;
  status: 'draft' | 'posted' | 'cancelled';
  total_debit: string;
  total_credit: string;
  created_by: number;
  posted_by: number | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
  lines: JournalEntryLine[];
  creator?: {
    name: string;
    email: string;
  };
  poster?: {
    name: string;
    email: string;
  };
}

export default function JournalEntryDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<JournalEntry>(`/journal-entries/${id}`);
      console.log('Journal entry loaded:', data);
      setEntry(data);
    } catch (error) {
      console.error('Error loading journal entry:', error);
      alert('خطأ في تحميل القيد');
      navigate('/finance');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!entry) return;

    if (!confirm('هل أنت متأكد من ترحيل هذا القيد؟\n\nبعد الترحيل لن تتمكن من تعديل القيد.')) {
      return;
    }

    try {
      await apiRequest(`/journal-entries/${entry.id}/post`, {
        method: 'POST',
      });
      alert('تم ترحيل القيد بنجاح');
      loadEntry();
    } catch (error: any) {
      console.error('Error posting entry:', error);
      alert('خطأ في ترحيل القيد: ' + (error.message || 'حدث خطأ غير متوقع'));
    }
  };

  const handleCancel = async () => {
    if (!entry) return;

    if (!confirm('هل أنت متأكد من إلغاء هذا القيد؟')) {
      return;
    }

    try {
      await apiRequest(`/journal-entries/${entry.id}/cancel`, {
        method: 'POST',
      });
      alert('تم إلغاء القيد بنجاح');
      loadEntry();
    } catch (error: any) {
      console.error('Error cancelling entry:', error);
      alert('خطأ في إلغاء القيد: ' + (error.message || 'حدث خطأ غير متوقع'));
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    if (!confirm('هل أنت متأكد من حذف هذا القيد؟\n\nهذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      await apiRequest(`/journal-entries/${entry.id}`, {
        method: 'DELETE',
      });
      alert('تم حذف القيد بنجاح');
      navigate('/finance');
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      alert('خطأ في حذف القيد: ' + (error.message || 'حدث خطأ غير متوقع'));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      posted: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      draft: 'مسودة',
      posted: 'مرحّل',
      cancelled: 'ملغى',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل القيد...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/finance')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  قيد يومية - {entry.entry_number}
                </h1>
                <p className="text-sm text-gray-500">{entry.entry_type}</p>
              </div>
              {getStatusBadge(entry.status)}
            </div>
            <div className="flex items-center gap-3">
              {entry.status === 'draft' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/finance/journal-entry/${entry.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                  <Button variant="outline" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                  <Button onClick={handlePost}>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    ترحيل القيد
                  </Button>
                </>
              )}
              {entry.status === 'posted' && (
                <Button variant="outline" onClick={handleCancel}>
                  <XCircle className="h-4 w-4 ml-2" />
                  إلغاء القيد
                </Button>
              )}
              {entry.status === 'cancelled' && (
                <span className="text-sm text-gray-500">القيد ملغى ولا يمكن تعديله</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Entry Information */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات القيد</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم القيد</label>
                <p className="text-gray-900">{entry.entry_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع القيد</label>
                <p className="text-gray-900">{entry.entry_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم المرجع</label>
                <p className="text-gray-900">{entry.reference_number || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <p className="text-gray-900">{new Date(entry.entry_date).toLocaleDateString('ar-SA')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الترحيل</label>
                <p className="text-gray-900">{new Date(entry.posting_date).toLocaleDateString('ar-SA')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السلسلة</label>
                <p className="text-gray-900">{entry.series}</p>
              </div>
            </div>
            {entry.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <p className="text-gray-900 whitespace-pre-wrap">{entry.notes}</p>
              </div>
            )}
          </div>

          {/* Journal Entry Lines */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">تفاصيل القيد</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">#</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">الحساب</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">مدين</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">دائن</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entry.lines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {line.account.account_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {line.account.account_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(3) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(3) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {line.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                      الإجمالي
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {parseFloat(entry.total_debit).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {parseFloat(entry.total_credit).toFixed(3)}
                    </td>
                    <td className="px-6 py-4">
                      {Math.abs(parseFloat(entry.total_debit) - parseFloat(entry.total_credit)) < 0.001 && (
                        <span className="text-green-600 text-sm font-medium">✓ متوازن</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات إضافية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإنشاء</label>
                <p className="text-gray-900">
                  {new Date(entry.created_at).toLocaleString('ar-SA')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">آخر تحديث</label>
                <p className="text-gray-900">
                  {new Date(entry.updated_at).toLocaleString('ar-SA')}
                </p>
              </div>
              {entry.posted_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الترحيل</label>
                  <p className="text-gray-900">
                    {new Date(entry.posted_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
