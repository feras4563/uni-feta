import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { api } from '../lib/api-client';

interface PaymentEntry {
  id: string;
  payment_mode_id: string;
  party_type: string;
  party_id: string;
  payment_type: 'receive' | 'pay';
  amount: number;
  payment_date: string;
  reference_number: string;
  remarks: string;
  is_posted: boolean;
  created_at: string;
  journal_entry_id?: number;
  paymentMode?: {
    id: string;
    name: string;
    account?: {
      account_name: string;
      account_number: string;
    };
  };
  journalEntry?: {
    id: number;
    entry_number: string;
    entry_type: string;
    status: string;
    total_debit: number;
    total_credit: number;
    lines?: Array<{
      id: number;
      account_id: number;
      debit: number;
      credit: number;
      description: string;
      account?: {
        account_name: string;
        account_number: string;
      };
    }>;
  };
}

const fetchPaymentEntry = async (id: string): Promise<PaymentEntry> => {
  return api.get(`/payment-entries/${id}`);
};

export default function PaymentEntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: entry, isLoading, error } = useQuery({
    queryKey: ['payment-entry', id],
    queryFn: () => fetchPaymentEntry(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">حدث خطأ في تحميل البيانات</p>
          <button
            onClick={() => navigate('/finance')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            العودة إلى القائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/finance')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          العودة إلى قيود الدفع
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تفاصيل قيد الدفع</h1>
            <p className="text-sm text-gray-500 mt-1">
              {entry.reference_number || `قيد ${entry.payment_type === 'receive' ? 'قبض' : 'دفع'}`}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              entry.is_posted
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {entry.is_posted ? 'مرحل' : 'مسودة'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Details Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الدفع</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">نوع القيد</label>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      entry.payment_type === 'receive'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {entry.payment_type === 'receive' ? 'قبض (استلام نقود)' : 'دفع (صرف نقود)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">المبلغ</label>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(entry.amount).toLocaleString()} د.ل
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">تاريخ الدفع</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(entry.payment_date).toLocaleDateString('ar-LY')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">رقم المرجع</label>
                <p className="text-gray-900">{entry.reference_number || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">نوع الطرف</label>
                <p className="text-gray-900">
                  {entry.party_type === 'student' ? 'طالب' : 
                   entry.party_type === 'teacher' ? 'مدرس' :
                   entry.party_type === 'supplier' ? 'مورد' : 'أخرى'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">معرف الطرف</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="h-4 w-4 text-gray-400" />
                  {entry.party_id}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">طريقة الدفع</label>
                <p className="text-gray-900">{entry.paymentMode?.name || '-'}</p>
              </div>

              {entry.paymentMode?.account && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">حساب طريقة الدفع</label>
                  <p className="text-gray-900">
                    {entry.paymentMode.account.account_number} - {entry.paymentMode.account.account_name}
                  </p>
                </div>
              )}

              {entry.journalEntry && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">القيد اليومي المرتبط</label>
                  <button
                    onClick={() => navigate(`/finance/journal-entry/${entry.journalEntry!.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    {entry.journalEntry.entry_number}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              )}

              {entry.remarks && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">ملاحظات</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{entry.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Journal Entry Details */}
          {entry.journalEntry && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                القيد اليومي المرتبط
              </h2>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">رقم القيد</label>
                    <button
                      onClick={() => navigate(`/finance/journal-entry/${entry.journalEntry!.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                    >
                      {entry.journalEntry.entry_number}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">نوع القيد</label>
                    <p className="text-gray-900">{entry.journalEntry.entry_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">إجمالي المدين</label>
                    <p className="text-gray-900">{Number(entry.journalEntry.total_debit).toLocaleString()} د.ل</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">إجمالي الدائن</label>
                    <p className="text-gray-900">{Number(entry.journalEntry.total_credit).toLocaleString()} د.ل</p>
                  </div>
                </div>
              </div>

              {entry.journalEntry.lines && entry.journalEntry.lines.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحساب</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">مدين</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">دائن</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {entry.journalEntry.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {line.account?.account_number} - {line.account?.account_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{line.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">معلومات إضافية</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">تاريخ الإنشاء</label>
                <p className="text-sm text-gray-900">
                  {new Date(entry.created_at).toLocaleString('ar-LY')}
                </p>
              </div>
              {entry.journal_entry_id && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">رقم القيد اليومي</label>
                  <p className="text-sm text-gray-900">#{entry.journal_entry_id}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">معرف قيد الدفع</label>
                <p className="text-xs text-gray-500 font-mono break-all">{entry.id}</p>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">إجراءات</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/finance')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                العودة إلى القائمة
              </button>
              {entry.journalEntry && (
                <button
                  onClick={() => navigate(`/finance/journal-entry/${entry.journalEntry!.id}`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  عرض القيد اليومي
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
