import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';

interface Account {
  id: number;
  account_number: string;
  account_name: string;
  root_account_type: string;
}

interface AccountDefault {
  id?: number;
  category: string;
  account_id: number | null;
  description: string;
}

const defaultCategories = [
  { key: 'sales_revenue', label: 'حساب الإيرادات - المبيعات', description: 'الحساب الافتراضي لتسجيل إيرادات المبيعات' },
  { key: 'sales_tax', label: 'حساب ضريبة المبيعات', description: 'الحساب الافتراضي لضريبة المبيعات المستحقة' },
  { key: 'accounts_receivable', label: 'حساب العملاء (المدينون)', description: 'الحساب الافتراضي لذمم العملاء' },
  { key: 'cost_of_goods_sold', label: 'حساب تكلفة البضاعة المباعة', description: 'الحساب الافتراضي لتكلفة المبيعات' },
  { key: 'inventory', label: 'حساب المخزون', description: 'الحساب الافتراضي للمخزون' },
  { key: 'purchase_expense', label: 'حساب المشتريات', description: 'الحساب الافتراضي لمصروفات المشتريات' },
  { key: 'accounts_payable', label: 'حساب الموردين (الدائنون)', description: 'الحساب الافتراضي لذمم الموردين' },
  { key: 'purchase_tax', label: 'حساب ضريبة المشتريات', description: 'الحساب الافتراضي لضريبة المشتريات القابلة للاسترداد' },
  { key: 'cash', label: 'حساب النقدية', description: 'الحساب الافتراضي للنقدية في الصندوق' },
  { key: 'bank', label: 'حساب البنك', description: 'الحساب الافتراضي للبنك الرئيسي' },
  { key: 'salaries_expense', label: 'حساب مصروف الرواتب', description: 'الحساب الافتراضي لمصروفات الرواتب' },
  { key: 'salaries_payable', label: 'حساب الرواتب المستحقة', description: 'الحساب الافتراضي للرواتب المستحقة للموظفين' },
  { key: 'rent_expense', label: 'حساب مصروف الإيجار', description: 'الحساب الافتراضي لمصروفات الإيجار' },
  { key: 'utilities_expense', label: 'حساب مصروف المرافق', description: 'الحساب الافتراضي لمصروفات الكهرباء والماء' },
  { key: 'depreciation_expense', label: 'حساب مصروف الإهلاك', description: 'الحساب الافتراضي لمصروف إهلاك الأصول' },
  { key: 'accumulated_depreciation', label: 'حساب مجمع الإهلاك', description: 'الحساب الافتراضي لمجمع الإهلاك' },
  { key: 'retained_earnings', label: 'حساب الأرباح المحتجزة', description: 'الحساب الافتراضي للأرباح المحتجزة' },
  { key: 'dividends', label: 'حساب التوزيعات', description: 'الحساب الافتراضي لتوزيعات الأرباح' },
];

export default function CompanyAccountDefaults() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountDefaults, setAccountDefaults] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAccounts();
    loadAccountDefaults();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Account[]>('/accounts');
      // Filter only detail accounts (non-group)
      const detailAccounts = data.filter((acc: any) => !acc.is_group);
      setAccounts(detailAccounts);
    } catch (error) {
      console.error('خطأ في تحميل الحسابات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountDefaults = async () => {
    try {
      const data = await apiRequest<AccountDefault[]>('/account-defaults');
      const defaultsMap: Record<string, number | null> = {};
      data.forEach((def) => {
        defaultsMap[def.category] = def.account_id;
      });
      setAccountDefaults(defaultsMap);
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات الافتراضية:', error);
    }
  };

  const handleAccountChange = (category: string, accountId: string) => {
    setAccountDefaults({
      ...accountDefaults,
      [category]: accountId ? parseInt(accountId) : null,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = Object.entries(accountDefaults).map(([category, account_id]) => ({
        category,
        account_id,
      }));

      await apiRequest('/account-defaults', {
        method: 'POST',
        body: JSON.stringify({ defaults: payload }),
      });

      alert('تم حفظ الإعدادات الافتراضية بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const getAccountById = (id: number | null) => {
    if (!id) return null;
    return accounts.find((acc) => acc.id === id);
  };

  const filteredCategories = defaultCategories.filter(
    (cat) =>
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-cog text-gray-600 text-lg"></i>
                  </div>
                  <div className="mr-4">
                    <h1 className="text-xl font-semibold text-gray-900">الحسابات الافتراضية للشركة</h1>
                    <p className="text-sm text-gray-500">تعيين الحسابات الافتراضية للمعاملات المتكررة</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:opacity-50"
              >
                <i className="fas fa-save text-xs"></i>
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-info-circle text-blue-600"></i>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-blue-800">معلومات</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    قم بتعيين الحسابات الافتراضية التي سيتم استخدامها تلقائياً في المعاملات المتكررة مثل المبيعات والمشتريات والرواتب.
                    هذا يساعد على تسريع عملية إدخال القيود المحاسبية وتقليل الأخطاء.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الحسابات الافتراضية..."
                className="block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Account Defaults List */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">تعيين الحسابات</h3>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm text-gray-500">جاري التحميل...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredCategories.map((category) => {
                  const selectedAccount = getAccountById(accountDefaults[category.key] || null);
                  return (
                    <div key={category.key} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-900">
                            {category.label}
                          </label>
                          <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                          {selectedAccount && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {selectedAccount.account_number}
                              </span>
                              <span className="mr-2">{selectedAccount.account_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="sm:w-80">
                          <select
                            value={accountDefaults[category.key] || ''}
                            onChange={(e) => handleAccountChange(category.key, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                          >
                            <option value="">-- اختر حساب --</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_number} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button (Mobile) */}
          <div className="mt-6 sm:hidden">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex justify-center items-center gap-x-1.5 rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:opacity-50"
            >
              <i className="fas fa-save text-xs"></i>
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
