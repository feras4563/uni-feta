import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../lib/api-client';

interface PaymentMode {
  id: string;
  name: string;
  account_id: number;
  type: string;
}

interface Account {
  id: number;
  account_name: string;
  account_number: string;
  account_type: string;
  is_group: boolean;
}

interface Student {
  id: string;
  name: string;
  student_number: string;
}


const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.data, obj.items, obj.results, obj.students, obj.paymentModes, obj.accounts];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as T[];
    }
  }
  return [];
};

const fetchPaymentModes = async (): Promise<PaymentMode[]> => {
  const res = await api.get<unknown>('/payment-modes');
  return asArray<PaymentMode>(res);
};

const fetchAccounts = async (): Promise<Account[]> => {
  const res = await api.get<unknown>('/accounts');
  return asArray<Account>(res);
};

const fetchStudents = async (): Promise<Student[]> => {
  const res = await api.get<unknown>('/students', { paginate: 'false' });
  return asArray<Student>(res);
};

const createPaymentEntry = async (data: any): Promise<any> => {
  return api.post('/payment-entries', data);
};

export default function PaymentEntryCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    payment_mode_id: '',
    party_type: 'student',
    party_id: '',
    payment_type: 'receive' as 'receive' | 'pay',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    remarks: '',
    party_account_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: paymentModes = [] } = useQuery({
    queryKey: ['payment-modes'],
    queryFn: fetchPaymentModes,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    enabled: formData.party_type === 'student',
  });

  const saveMutation = useMutation({
    mutationFn: createPaymentEntry,
    onSuccess: (data) => {
      console.log('Payment entry created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['payment-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      alert('تم إنشاء قيد الدفع بنجاح');
      navigate('/finance');
    },
    onError: (error: any) => {
      console.error('Payment entry creation error:', error);
      if (error.errors) {
        setErrors(error.errors);
      } else {
        alert(error.message || 'فشل في إنشاء قيد الدفع');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToSend = {
      ...formData,
      amount: parseFloat(formData.amount),
      party_account_id: parseInt(formData.party_account_id),
    };

    console.log('Submitting payment entry:', dataToSend);
    saveMutation.mutate(dataToSend);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/finance')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          العودة
        </button>

        <h1 className="text-2xl font-bold text-gray-900">إنشاء قيد دفع</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع القيد <span className="text-red-500">*</span>
            </label>
            <select
              name="payment_type"
              value={formData.payment_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="receive">قبض (استلام نقود)</option>
              <option value="pay">دفع (صرف نقود)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع <span className="text-red-500">*</span>
            </label>
            <select
              name="payment_mode_id"
              value={formData.payment_mode_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.payment_mode_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">اختر طريقة الدفع</option>
              {paymentModes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
            {errors.payment_mode_id && (
              <p className="mt-1 text-sm text-red-500">{errors.payment_mode_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الطرف <span className="text-red-500">*</span>
            </label>
            <select
              name="party_type"
              value={formData.party_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="student">طالب</option>
              <option value="teacher">مدرس</option>
              <option value="supplier">مورد</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الطرف <span className="text-red-500">*</span>
            </label>
            {formData.party_type === 'student' ? (
              <select
                name="party_id"
                value={formData.party_id}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.party_id ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الطالب</option>
                {Array.isArray(students) &&
                  students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_number} - {student.name}
                  </option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                name="party_id"
                value={formData.party_id}
                onChange={handleChange}
                placeholder="معرف الطرف"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.party_id ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            )}
            {errors.party_id && <p className="mt-1 text-sm text-red-500">{errors.party_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حساب الطرف <span className="text-red-500">*</span>
            </label>
            <select
              name="party_account_id"
              value={formData.party_account_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.party_account_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">اختر الحساب</option>
              {accounts
                .filter((account) => !account.is_group)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.account_name}
                  </option>
                ))}
            </select>
            {errors.party_account_id && (
              <p className="mt-1 text-sm text-red-500">{errors.party_account_id}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.payment_type === 'receive'
                ? 'حساب الذمم المدينة أو الإيرادات'
                : 'حساب الذمم الدائنة أو المصروفات'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ الدفع <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم المرجع
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="رقم الإيصال أو الشيك"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ وترحيل'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/finance')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> سيتم إنشاء قيد يومي تلقائياً عند حفظ قيد الدفع
          </p>
        </div>
      </form>
    </div>
  );
}
