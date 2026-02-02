import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/jwt-auth';

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
type RootAccountType = 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';

interface AccountFormData {
  accountName: string;
  accountNumber: string;
  accountType: AccountType | '';
  parentAccountId: string;
  rootAccountType: RootAccountType | '';
  description: string;
  isGroup: boolean;
}

interface ParentAccount {
  id: number;
  value: number;
  label: string;
  account_name: string;
  account_number: string;
  level: number;
  root_account_type: string;
}

const accountTypes = [
  { value: 'asset', label: 'أصل (Asset)' },
  { value: 'liability', label: 'خصم (Liability)' },
  { value: 'equity', label: 'حقوق ملكية (Equity)' },
  { value: 'revenue', label: 'إيراد (Revenue)' },
  { value: 'expense', label: 'مصروف (Expense)' }
];

const rootAccountTypes = [
  { value: 'assets', label: 'الأصول (Assets)', code: '1' },
  { value: 'liabilities', label: 'الخصوم (Liabilities)', code: '2' },
  { value: 'equity', label: 'حقوق الملكية (Equity)', code: '3' },
  { value: 'revenue', label: 'الإيرادات (Revenue)', code: '4' },
  { value: 'expenses', label: 'المصروفات (Expenses)', code: '5' }
];


export default function AddAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AccountFormData>({
    accountName: '',
    accountNumber: '',
    accountType: '',
    parentAccountId: '',
    rootAccountType: '',
    description: '',
    isGroup: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentAccounts, setParentAccounts] = useState<ParentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch parent accounts
  useEffect(() => {
    fetchParentAccounts();
  }, []);

  const fetchParentAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<ParentAccount[]>('/accounts/parent-accounts');
      setParentAccounts(data);
    } catch (error) {
      console.error('Error fetching parent accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AccountFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'اسم الحساب مطلوب';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'رقم الحساب مطلوب';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'نوع الحساب مطلوب';
    }

    if (!formData.rootAccountType) {
      newErrors.rootAccountType = 'نوع الحساب الجذر مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setSaving(true);
        
        const payload = {
          account_name: formData.accountName,
          account_number: formData.accountNumber,
          account_type: formData.accountType,
          root_account_type: formData.rootAccountType,
          parent_account_id: formData.parentAccountId || null,
          description: formData.description || null,
          is_active: true,
          is_group: formData.isGroup,
        };

        await apiRequest('/accounts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        alert('تم إضافة الحساب بنجاح');
        navigate('/finance');
      } catch (error: any) {
        console.error('Error saving account:', error);
        if (error.message) {
          alert('خطأ: ' + error.message);
        } else {
          alert('حدث خطأ أثناء حفظ الحساب');
        }
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/finance');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRight className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">إضافة حساب جديد</h1>
                <p className="text-sm text-gray-500">أضف حساب جديد إلى دليل الحسابات</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-6 space-y-6">
              {/* Account Name */}
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الحساب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => handleChange('accountName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="مثال: النقدية في الصندوق"
                />
                {errors.accountName && (
                  <p className="mt-1 text-sm text-red-500">{errors.accountName}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الحساب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="مثال: 110101"
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.accountNumber}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  يجب أن يكون رقم الحساب فريداً ويتبع نظام الترقيم المحاسبي
                </p>
              </div>

              {/* Root Account Type */}
              <div>
                <label htmlFor="rootAccountType" className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحساب الجذر <span className="text-red-500">*</span>
                </label>
                <select
                  id="rootAccountType"
                  value={formData.rootAccountType}
                  onChange={(e) => handleChange('rootAccountType', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.rootAccountType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر نوع الحساب الجذر</option>
                  {rootAccountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - ({type.code})
                    </option>
                  ))}
                </select>
                {errors.rootAccountType && (
                  <p className="mt-1 text-sm text-red-500">{errors.rootAccountType}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  التصنيف الرئيسي للحساب في النظام المحاسبي
                </p>
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحساب <span className="text-red-500">*</span>
                </label>
                <select
                  id="accountType"
                  value={formData.accountType}
                  onChange={(e) => handleChange('accountType', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر نوع الحساب</option>
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.accountType && (
                  <p className="mt-1 text-sm text-red-500">{errors.accountType}</p>
                )}
              </div>

              {/* Parent Account */}
              <div>
                <label htmlFor="parentAccountId" className="block text-sm font-medium text-gray-700 mb-2">
                  الحساب الأب
                </label>
                <select
                  id="parentAccountId"
                  value={formData.parentAccountId}
                  onChange={(e) => handleChange('parentAccountId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">لا يوجد (حساب رئيسي)</option>
                  {parentAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  اختر الحساب الأب إذا كان هذا حساب فرعي
                </p>
              </div>

              {/* Is Group Account */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isGroup"
                    type="checkbox"
                    checked={formData.isGroup}
                    onChange={(e) => handleChange('isGroup', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="mr-3">
                  <label htmlFor="isGroup" className="text-sm font-medium text-gray-700">
                    حساب مجموعة (Group Account)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    حسابات المجموعة يمكن أن تحتوي على حسابات فرعية ولكن لا يمكن إجراء قيود عليها مباشرة
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="وصف تفصيلي للحساب (اختياري)"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ الحساب'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
