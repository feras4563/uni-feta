import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Trash2, Filter } from 'lucide-react';
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
  paymentMode?: {
    name: string;
  };
}

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.data, obj.items, obj.results, obj.entries];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as T[];
    }
  }
  return [];
};

const fetchPaymentEntries = async (): Promise<PaymentEntry[]> => {
  const res = await api.get<unknown>('/payment-entries');
  return asArray<PaymentEntry>(res);
};

export default function PaymentEntryList() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'receive' | 'pay'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['payment-entries'],
    queryFn: fetchPaymentEntries,
  });

  const filteredEntries = entries.filter((entry) => {
    const matchesType = filterType === 'all' || entry.payment_type === filterType;
    const matchesSearch = 
      entry.party_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalReceive = entries
    .filter((e) => e.payment_type === 'receive')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalPay = entries
    .filter((e) => e.payment_type === 'pay')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قيود الدفع</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة قيود القبض والصرف</p>
        </div>
        <button
          onClick={() => navigate('/finance/payment-entry/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          إنشاء قيد جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي القبض</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalReceive.toLocaleString()} د.ل
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-arrow-down text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الصرف</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalPay.toLocaleString()} د.ل
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fas fa-arrow-up text-red-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الصافي</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(totalReceive - totalPay).toLocaleString()} د.ل
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-balance-scale text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="البحث برقم المرجع أو الطرف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل ({entries.length})
            </button>
            <button
              onClick={() => setFilterType('receive')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'receive'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              قبض ({entries.filter((e) => e.payment_type === 'receive').length})
            </button>
            <button
              onClick={() => setFilterType('pay')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'pay'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              دفع ({entries.filter((e) => e.payment_type === 'pay').length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد قيود دفع
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم المرجع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الطرف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    طريقة الدفع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {entry.reference_number ? (
                        <button
                          onClick={() => navigate(`/finance/payment-entry/${entry.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {entry.reference_number}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.payment_type === 'receive'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {entry.payment_type === 'receive' ? 'قبض' : 'دفع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.party_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.paymentMode?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.amount.toLocaleString()} د.ل
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.payment_date).toLocaleDateString('ar-LY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.is_posted
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {entry.is_posted ? 'مرحل' : 'مسودة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/finance/payment-entry/${entry.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!entry.is_posted && (
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
