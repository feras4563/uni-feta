import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api-client';
import { 
  TreeProvider, 
  TreeView, 
  TreeNode, 
  TreeNodeTrigger, 
  TreeExpander, 
  TreeIcon, 
  TreeLabel, 
  TreeNodeContent 
} from '@/components/ui/modern-tree';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Wallet, 
  Users, 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Plus,
  Download,
  Search,
  Edit,
  Trash2,
  FileText,
  PlusCircle
} from 'lucide-react';

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

// بيانات دليل الحسابات (fallback)
const accountsDataFallback = [
  {
    id: "assets",
    label: "الأصول (Assets)",
    code: "1",
    type: "main",
    icon: <Building2 className="h-4 w-4 text-gray-600" />,
    children: [
      {
        id: "current-assets",
        label: "الأصول المتداولة",
        code: "11",
        type: "sub",
        icon: <Wallet className="h-4 w-4 text-gray-600" />,
        children: [
          {
            id: "cash",
            label: "النقدية والبنوك",
            code: "1101",
            type: "account",
            icon: <DollarSign className="h-4 w-4 text-gray-600" />,
            children: [
              {
                id: "cash-on-hand",
                label: "النقدية في الصندوق",
                code: "110101",
                type: "detail",
                icon: <DollarSign className="h-4 w-4 text-gray-600" />
              },
              {
                id: "bank-accounts",
                label: "الحسابات البنكية",
                code: "110102", 
                type: "detail",
                icon: <Wallet className="h-4 w-4 text-gray-600" />
              }
            ]
          },
          {
            id: "receivables",
            label: "الذمم المدينة",
            code: "1102",
            type: "account",
            icon: <TrendingUp className="h-4 w-4 text-gray-600" />,
            children: [
              {
                id: "student-fees",
                label: "رسوم الطلاب",
                code: "110201",
                type: "detail",
                icon: <Users className="h-4 w-4 text-gray-600" />
              }
            ]
          },
          {
            id: "inventory",
            label: "المخزون",
            code: "1103",
            type: "account",
            icon: <BookOpen className="h-4 w-4 text-gray-600" />
          }
        ]
      },
      {
        id: "fixed-assets",
        label: "الأصول الثابتة",
        code: "12",
        type: "sub",
        icon: <Building2 className="h-4 w-4 text-gray-600" />,
        children: [
          {
            id: "buildings",
            label: "المباني والإنشاءات",
            code: "1201",
            type: "account",
            icon: <Building2 className="h-4 w-4 text-gray-600" />
          },
          {
            id: "equipment",
            label: "الأجهزة والمعدات",
            code: "1202",
            type: "account",
            icon: <Calculator className="h-4 w-4 text-gray-600" />
          }
        ]
      }
    ]
  },
  {
    id: "liabilities",
    label: "الخصوم (Liabilities)",
    code: "2",
    type: "main",
    icon: <TrendingDown className="h-4 w-4 text-gray-600" />,
    children: [
      {
        id: "current-liabilities",
        label: "الخصوم المتداولة",
        code: "21",
        type: "sub",
        icon: <Wallet className="h-4 w-4 text-gray-600" />,
        children: [
          {
            id: "accounts-payable",
            label: "الذمم الدائنة",
            code: "2101",
            type: "account",
            icon: <TrendingDown className="h-4 w-4 text-gray-600" />
          },
          {
            id: "short-term-loans",
            label: "القروض قصيرة الأجل",
            code: "2102",
            type: "account",
            icon: <DollarSign className="h-4 w-4 text-gray-600" />
          }
        ]
      }
    ]
  },
  {
    id: "equity",
    label: "حقوق الملكية (Equity)",
    code: "3",
    type: "main",
    icon: <Users className="h-4 w-4 text-gray-600" />,
    children: [
      {
        id: "capital",
        label: "رأس المال",
        code: "3101",
        type: "account",
        icon: <DollarSign className="h-4 w-4 text-gray-600" />
      },
      {
        id: "retained-earnings",
        label: "الأرباح المحتجزة",
        code: "3102",
        type: "account",
        icon: <TrendingUp className="h-4 w-4 text-gray-600" />
      }
    ]
  },
  {
    id: "revenue",
    label: "الإيرادات (Revenue)",
    code: "4",
    type: "main",
    icon: <TrendingUp className="h-4 w-4 text-gray-600" />,
    children: [
      {
        id: "tuition-fees",
        label: "رسوم التعليم",
        code: "4101",
        type: "account",
        icon: <Users className="h-4 w-4 text-gray-600" />
      },
      {
        id: "other-income",
        label: "إيرادات أخرى",
        code: "4102",
        type: "account",
        icon: <DollarSign className="h-4 w-4 text-gray-600" />
      }
    ]
  },
  {
    id: "expenses",
    label: "المصروفات (Expenses)",
    code: "5",
    type: "main",
    icon: <TrendingDown className="h-4 w-4 text-gray-600" />,
    children: [
      {
        id: "operating-expenses",
        label: "المصروفات التشغيلية",
        code: "51",
        type: "sub",
        icon: <Calculator className="h-4 w-4 text-gray-600" />,
        children: [
          {
            id: "salaries",
            label: "الرواتب والأجور",
            code: "5101",
            type: "account",
            icon: <Users className="h-4 w-4 text-gray-600" />
          },
          {
            id: "utilities",
            label: "المرافق العامة",
            code: "5102",
            type: "account",
            icon: <Building2 className="h-4 w-4 text-gray-600" />
          }
        ]
      },
      {
        id: "admin-expenses",
        label: "المصروفات الإدارية",
        code: "52",
        type: "sub",
        icon: <BookOpen className="h-4 w-4 text-gray-600" />,
        children: [
          {
            id: "office-supplies",
            label: "مستلزمات المكتب",
            code: "5201",
            type: "account",
            icon: <BookOpen className="h-4 w-4 text-gray-600" />
          }
        ]
      }
    ]
  }
];

const getAccountTypeStyle = (type: string, level: number) => {
  // تمييز حسب المستوى بدلاً من النوع فقط
  switch (level) {
    case 0: // الحسابات الرئيسية
      return "font-semibold text-gray-900 text-base";
    case 1: // الحسابات الفرعية
      return "font-medium text-gray-800 text-sm";
    case 2: // الحسابات العادية
      return "font-normal text-gray-700 text-sm";
    case 3: // الحسابات التفصيلية
      return "font-normal text-gray-600 text-sm";
    default:
      return "font-normal text-gray-700 text-sm";
  }
};

const renderTreeNodes = (nodes: any[], level: number, parentPath: boolean[], navigate: any, handleDelete: (id: string, label: string) => void) => {
  return nodes.map((node, index) => {
    const isLast = index === nodes.length - 1;
    const hasChildren = node.children && node.children.length > 0;
    const currentPath = [...parentPath];
    if (level > 0) {
      currentPath[level - 1] = isLast;
    }

    return (
      <TreeNode 
        key={node.id} 
        nodeId={node.id} 
        level={level}
        isLast={isLast}
        parentPath={currentPath}
      >
        <TreeNodeTrigger className="group">
          <TreeExpander hasChildren={hasChildren} />
          <TreeIcon icon={node.icon} hasChildren={hasChildren} />
          <TreeLabel className={getAccountTypeStyle(node.type, level)}>
            <span className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                {node.label}
                {node.code && (
                  <span className="text-xs text-gray-400 font-mono">
                    ({node.code})
                  </span>
                )}
              </span>
              
              {/* Action Buttons */}
              <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/finance/accounts/${node.id}`);
                  }}
                  className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                  title="عرض التفاصيل"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/finance/accounts/add', { state: { parentId: node.id } });
                  }}
                  className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                  title="إضافة حساب فرعي"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/finance/accounts/${node.id}/edit`);
                  }}
                  className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                  title="تعديل"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.id, node.label);
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </span>
          </TreeLabel>
        </TreeNodeTrigger>
        {hasChildren && (
          <TreeNodeContent hasChildren={hasChildren}>
            {renderTreeNodes(node.children, level + 1, currentPath, navigate, handleDelete)}
          </TreeNodeContent>
        )}
      </TreeNode>
    );
  });
};

export default function ModernChartOfAccounts() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountsData, setAccountsData] = useState<any[]>([]);
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
      
      // Convert API data to tree format
      const converted = convertApiDataToTreeFormat(data);
      console.log('✅ Converted data:', converted);
      setAccountsData(converted);
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
      setAccountsData(accountsDataFallback);
    } finally {
      setLoading(false);
    }
  };

  const convertApiDataToTreeFormat = (accounts: Account[]): any[] => {
    return accounts.map(account => ({
      id: String(account.id),
      label: `${account.account_name} (${account.account_number})`,
      code: account.account_number,
      type: account.level === 0 ? 'main' : 'sub',
      icon: getAccountIcon(account.root_account_type, account.level),
      children: account.children && account.children.length > 0
        ? convertApiDataToTreeFormat(account.children)
        : undefined,
    }));
  };

  const getAccountIcon = (rootType: string, level: number) => {
    const className = "h-4 w-4 text-gray-600";
    if (level === 0) {
      switch (rootType) {
        case 'assets': return <Building2 className={className} />;
        case 'liabilities': return <TrendingDown className={className} />;
        case 'equity': return <Users className={className} />;
        case 'revenue': return <TrendingUp className={className} />;
        case 'expenses': return <Calculator className={className} />;
        default: return <DollarSign className={className} />;
      }
    }
    return level === 1 ? <Wallet className={className} /> : <FileText className={className} />;
  };

  const handleDeleteAccount = async (accountId: string, accountLabel: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب "${accountLabel}"؟\n\nملاحظة: لا يمكن حذف الحسابات التي تحتوي على حسابات فرعية.`)) {
      return;
    }

    try {
      await apiRequest(`/accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      alert('تم حذف الحساب بنجاح');
      // Reload accounts
      loadAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert('خطأ في حذف الحساب: ' + (error.message || 'حدث خطأ غير متوقع'));
    }
  };

  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const getAllNodeIds = (nodes: any[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children && node.children.length > 0) {
        ids = ids.concat(getAllNodeIds(node.children));
      }
    });
    return ids;
  };

  const handleExpandAll = () => {
    const allIds = getAllNodeIds(accountsData);
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds([]);
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
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="mr-4">
                    <h1 className="text-xl font-semibold text-gray-900">دليل الحسابات</h1>
                    <p className="text-sm text-gray-500">إدارة وتنظيم الحسابات المحاسبية</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير البيانات
              </Button>
              <Button size="sm" onClick={() => navigate('/finance/accounts/add')}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة حساب
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {/* Search and Controls */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">الشجرة المحاسبية</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                  إلغاء التوسيع
                </Button>
                <Button variant="outline" size="sm" onClick={handleExpandAll}>
                  توسيع الكل
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="البحث في دليل الحسابات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tree Content */}
          <div className="p-6">
            <TreeProvider
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              multiSelect={true}
              showLines={false}
              showIcons={true}
              indent={32}
              animateExpand={true}
            >
              <TreeView className="min-h-[600px] bg-white">
                {renderTreeNodes(accountsData, 0, [], navigate, handleDeleteAccount)}
              </TreeView>
            </TreeProvider>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>عدد الحسابات المحددة: {selectedIds.length}</span>
                {selectedIds.length > 0 && (
                  <span className="text-blue-600">
                    المحدد: {selectedIds.slice(0, 3).join(', ')}
                    {selectedIds.length > 3 && ` و ${selectedIds.length - 3} آخرين`}
                  </span>
                )}
              </div>
              <span>اضغط Ctrl + Click للتحديد المتعدد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
