import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowRight, 
  Edit, 
  Trash2, 
  FileText, 
  Building2,
  TrendingUp,
  Calendar,
  Hash,
  Folder,
  FolderTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

interface AccountData {
  id: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  parentAccount: string;
  rootAccountType: string;
  description: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
}

// بيانات تجريبية
const mockAccountData: AccountData = {
  id: 'cash-on-hand',
  accountName: 'النقدية في الصندوق',
  accountNumber: '110101',
  accountType: 'أصل (Asset)',
  parentAccount: 'النقدية والبنوك (1101)',
  rootAccountType: 'الأصول (Assets) - 1',
  description: 'حساب النقدية المتوفرة في الصندوق الرئيسي للمؤسسة',
  balance: 150000,
  createdAt: '2024-01-15',
  updatedAt: '2024-11-12',
  transactionCount: 45
};

export default function AccountDetail() {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const [account] = useState<AccountData>(mockAccountData);

  const handleEdit = () => {
    navigate(`/finance/accounts/${accountId}/edit`);
  };

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      console.log('Delete account:', accountId);
      navigate('/finance');
    }
  };

  const handleViewLedger = () => {
    navigate(`/finance/ledger/${accountId}`);
  };

  const handleBack = () => {
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
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRight className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">تفاصيل الحساب</h1>
                <p className="text-sm text-gray-500">{account.accountName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleViewLedger}>
                <FileText className="h-4 w-4 ml-2" />
                دفتر الأستاذ
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                className="text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Account Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">الرصيد الحالي</p>
                <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(account.balance, 'دينار')}</h2>
              </div>
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {formatNumber(account.transactionCount)} عملية
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                آخر تحديث: {formatDate(account.updatedAt)}
              </span>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">معلومات الحساب</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Name */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">اسم الحساب</p>
                    <p className="text-base font-medium text-gray-900">{account.accountName}</p>
                  </div>
                </div>

                {/* Account Number */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Hash className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">رقم الحساب</p>
                    <p className="text-base font-medium text-gray-900 font-mono">{account.accountNumber}</p>
                  </div>
                </div>

                {/* Root Account Type */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <FolderTree className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">نوع الحساب الجذر</p>
                    <p className="text-base font-medium text-gray-900">{account.rootAccountType}</p>
                  </div>
                </div>

                {/* Account Type */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Folder className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">نوع الحساب</p>
                    <p className="text-base font-medium text-gray-900">{account.accountType}</p>
                  </div>
                </div>

                {/* Parent Account */}
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <FolderTree className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">الحساب الأب</p>
                    <p className="text-base font-medium text-gray-900">
                      {account.parentAccount || 'لا يوجد (حساب رئيسي)'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {account.description && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">الوصف</p>
                      <p className="text-base text-gray-700">{account.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata & Recent Transactions Combined */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">معلومات إضافية</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">تاريخ الإنشاء</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(account.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">آخر تحديث</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(account.updatedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">عدد العمليات</p>
                    <p className="text-sm font-medium text-gray-900">{account.transactionCount} عملية</p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Section */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900">آخر العمليات</h4>
                  <Button variant="outline" size="sm" onClick={handleViewLedger}>
                    <FileText className="h-4 w-4 ml-2" />
                    عرض دفتر الأستاذ
                  </Button>
                </div>
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium">لا توجد عمليات حديثة</p>
                  <p className="text-xs mt-1 text-gray-400">سيتم عرض آخر العمليات المالية هنا</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
