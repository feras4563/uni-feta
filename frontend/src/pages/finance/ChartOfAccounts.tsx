import React, { useState, useEffect } from 'react';
import { TreeView, TreeNode } from '@/components/ui/tree-view';
import { Building2, Users, Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/jwt-auth';
import { useNavigate } from 'react-router-dom';

interface Account {
  id: number;
  account_name: string;
  account_number: string;
  account_type: string;
  root_account_type: string;
  balance: number;
  level: number;
  has_children: boolean;
  is_group: boolean;
  children?: Account[];
}

export default function ChartOfAccounts() {
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching accounts tree...');
      const data = await apiRequest<Account[]>('/accounts/tree');
      console.log('✅ Received accounts:', data);
      
      // Convert to TreeNode format
      const convertedData = convertToTreeNodes(data);
      console.log('✅ Converted tree data:', convertedData);
      setTreeData(convertedData);
    } catch (error) {
      console.error('❌ خطأ في تحميل دليل الحسابات:', error);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const convertToTreeNodes = (accounts: Account[]): TreeNode[] => {
    return accounts.map(account => ({
      id: String(account.id),
      label: `${account.account_name} (${account.account_number})`,
      icon: getAccountIcon(account.root_account_type),
      children: account.children && account.children.length > 0 
        ? convertToTreeNodes(account.children) 
        : undefined,
    }));
  };

  const getAccountIcon = (rootType: string) => {
    switch (rootType) {
      case 'assets':
        return <Building2 className="h-4 w-4" />;
      case 'liabilities':
        return <TrendingDown className="h-4 w-4" />;
      case 'equity':
        return <Users className="h-4 w-4" />;
      case 'revenue':
        return <TrendingUp className="h-4 w-4" />;
      case 'expenses':
        return <Calculator className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h1 className="text-xl font-semibold text-gray-900">دليل الحسابات</h1>
                    <p className="text-sm text-gray-500">إدارة وتنظيم الحسابات المحاسبية</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <button
                onClick={() => loadAccounts()}
                className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                تحديث
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">دليل الحسابات</h2>
            <button
              onClick={() => navigate('/finance/accounts/add')}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <i className="fas fa-plus ml-2"></i>
              إضافة حساب
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">جاري تحميل دليل الحسابات...</p>
              </div>
            </div>
          ) : treeData.length > 0 ? (
            <TreeView
              data={treeData}
              defaultExpandedIds={treeData.map(node => node.id)}
              className="min-h-[600px]"
              showLines={true}
              showIcons={true}
              selectable={true}
              animateExpand={true}
              indent={24}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-gray-500 mb-4">لا توجد حسابات في دليل الحسابات</p>
                <button
                  onClick={() => navigate('/finance/accounts/add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <i className="fas fa-plus ml-2"></i>
                  إضافة أول حساب
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
