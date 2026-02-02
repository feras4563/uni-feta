import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { api } from '../lib/api-client';

interface PaymentMode {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  account_id: number;
  account?: {
    id: number;
    account_name: string;
    account_number: string;
  };
  type: 'cash' | 'bank' | 'card' | 'check' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchPaymentModes = async (): Promise<PaymentMode[]> => {
  return api.get('/payment-modes');
};

const deletePaymentMode = async (id: string): Promise<void> => {
  return api.delete(`/payment-modes/${id}`);
};

export default function PaymentModes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: paymentModes = [], isLoading } = useQuery({
    queryKey: ['payment-modes'],
    queryFn: fetchPaymentModes,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-modes'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف طريقة الدفع "${name}"؟`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error: any) {
        alert(error.message || 'فشل في حذف طريقة الدفع');
      }
    }
  };

  const filteredModes = paymentModes.filter((mode) =>
    mode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mode.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mode.account?.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      cash: 'نقدي',
      bank: 'بنكي',
      card: 'بطاقة',
      check: 'شيك',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">طرق الدفع</h1>
          <button
            onClick={() => navigate('/finance/payment-modes/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            إضافة طريقة دفع
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <input
            type="text"
            placeholder="البحث عن طريقة دفع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الاسم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحساب المرتبط
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredModes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>لا توجد طرق دفع</p>
                </td>
              </tr>
            ) : (
              filteredModes.map((mode) => (
                <tr key={mode.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mode.name}</div>
                    {mode.name_en && (
                      <div className="text-sm text-gray-500">{mode.name_en}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getTypeLabel(mode.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mode.account?.account_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {mode.account?.account_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        mode.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {mode.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/finance/payment-modes/${mode.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(mode.id, mode.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
