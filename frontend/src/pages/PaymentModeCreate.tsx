import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../lib/api-client';

interface Account {
  id: number;
  account_name: string;
  account_number: string;
  account_type: string;
  is_group: boolean;
}

interface PaymentMode {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  account_id: number;
  type: 'cash' | 'bank' | 'card' | 'check' | 'other';
  is_active: boolean;
}

const fetchAccounts = async (): Promise<Account[]> => {
  return api.get('/accounts');
};

const fetchPaymentMode = async (id: string): Promise<PaymentMode> => {
  return api.get(`/payment-modes/${id}`);
};

const createPaymentMode = async (data: Partial<PaymentMode>): Promise<PaymentMode> => {
  return api.post('/payment-modes', data);
};

const updatePaymentMode = async (id: string, data: Partial<PaymentMode>): Promise<PaymentMode> => {
  return api.put(`/payment-modes/${id}`, data);
};

export default function PaymentModeCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    account_id: '',
    type: 'cash' as 'cash' | 'bank' | 'card' | 'check' | 'other',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const { data: paymentMode, isLoading: isLoadingMode } = useQuery({
    queryKey: ['payment-mode', id],
    queryFn: () => fetchPaymentMode(id!),
    enabled: isEditMode,
  });

  // Update form when payment mode data is loaded
  if (paymentMode && isEditMode && formData.name === '') {
    setFormData({
      name: paymentMode.name,
      name_en: paymentMode.name_en || '',
      description: paymentMode.description || '',
      account_id: paymentMode.account_id.toString(),
      type: paymentMode.type,
      is_active: paymentMode.is_active,
    });
  }

  const saveMutation = useMutation({
    mutationFn: (data: Partial<PaymentMode>) =>
      isEditMode ? updatePaymentMode(id!, data) : createPaymentMode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-modes'] });
      navigate('/finance/payment-modes');
    },
    onError: (error: any) => {
      if (error.errors) {
        setErrors(error.errors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToSend = {
      ...formData,
      account_id: parseInt(formData.account_id),
    };

    saveMutation.mutate(dataToSend);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isEditMode && isLoadingMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/finance/payment-modes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          العودة إلى قائمة طرق الدفع
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم بالإنجليزية
            </label>
            <input
              type="text"
              name="name_en"
              value={formData.name_en}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              النوع <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="cash">نقدي</option>
              <option value="bank">بنكي</option>
              <option value="card">بطاقة</option>
              <option value="check">شيك</option>
              <option value="other">أخرى</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحساب المرتبط <span className="text-red-500">*</span>
            </label>
            <select
              name="account_id"
              value={formData.account_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.account_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">اختر الحساب</option>
              {accounts
                .filter((acc) => acc.account_type === 'asset' && !acc.is_group)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.account_name}
                  </option>
                ))}
            </select>
            {errors.account_id && (
              <p className="mt-1 text-sm text-red-500">{errors.account_id}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">نشط</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/finance/payment-modes')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
