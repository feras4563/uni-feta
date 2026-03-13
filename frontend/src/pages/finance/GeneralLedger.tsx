import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface Account {
  id: number;
  account_number: string;
  account_name: string;
  root_account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
  transaction_count: number;
}

interface LedgerTransaction {
  entry_id: number;
  entry_number: string;
  entry_date: string;
  entry_type: string;
  reference_number: string;
  account_id: number;
  account_number: string;
  account_name: string;
  root_account_type: string;
  debit: number;
  credit: number;
  description: string;
}

interface Transaction {
  entry_id: number;
  entry_number: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface AccountDetail {
  account: {
    id: number;
    account_number: string;
    account_name: string;
    root_account_type: string;
  };
  transactions: Transaction[];
  summary: {
    total_debit: number;
    total_credit: number;
    balance: number;
    transaction_count: number;
  };
}

export default function GeneralLedger() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'summary' | 'transactions'>('summary');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAccountData, setSelectedAccountData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Computed properties
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    if (searchQuery) {
      filtered = filtered.filter(account => 
        account.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [accounts, searchQuery]);

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAccounts.slice(start, end);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => 
    Math.ceil(filteredAccounts.length / itemsPerPage), 
    [filteredAccounts.length, itemsPerPage]
  );

  const totalAccounts = useMemo(() => accounts.length, [accounts]);
  const totalTransactions = useMemo(() => 
    accounts.reduce((sum, account) => sum + account.transaction_count, 0), 
    [accounts]
  );
  const totalDebit = useMemo(() => 
    accounts.reduce((sum, account) => sum + account.total_debit, 0), 
    [accounts]
  );
  const totalCredit = useMemo(() => 
    accounts.reduce((sum, account) => sum + account.total_credit, 0), 
    [accounts]
  );
  const netBalance = useMemo(() => totalDebit - totalCredit, [totalDebit, totalCredit]);

  const accountTransactions = useMemo(() => {
    if (!selectedAccountData) return [];
    return selectedAccountData.transactions || [];
  }, [selectedAccountData]);

  // Methods
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedAccount) params.append('account_id', selectedAccount);
      if (selectedPeriod) params.append('period', selectedPeriod);
      params.append('view', viewMode);
      
      if (viewMode === 'transactions') {
        const data = await apiRequest<LedgerTransaction[]>(`/accounts/general-ledger/summary?${params.toString()}`);
        console.log('General ledger transactions loaded:', data);
        setTransactions(data);
      } else {
        const data = await apiRequest<Account[]>(`/accounts/general-ledger/summary?${params.toString()}`);
        console.log('General ledger loaded:', data);
        setAccounts(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل الحسابات:', error);
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const searchAccounts = () => {
    setCurrentPage(1);
  };

  const filterTransactions = () => {
    loadAccounts();
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  const viewAccountDetails = async (account: Account) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const data = await apiRequest<AccountDetail>(`/accounts/${account.id}/general-ledger?${params.toString()}`);
      console.log('Account ledger loaded:', data);
      setSelectedAccountData(data);
      setShowModal(true);
    } catch (error) {
      console.error('خطأ في تحميل تفاصيل الحساب:', error);
      alert('خطأ في تحميل تفاصيل الحساب');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAccountData(null);
  };

  const printAccount = (accountId: number) => {
    alert(`سيتم طباعة الحساب: ${accountId}`);
  };

  const exportLedger = () => {
    alert('سيتم تصدير الأستاذ العام...');
  };

  const printLedger = () => {
    alert('سيتم طباعة الأستاذ العام...');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTypeClass = (type: string) => {
    const classes = {
      'asset': 'bg-green-100 text-green-800',
      'liability': 'bg-red-100 text-red-800',
      'equity': 'bg-yellow-100 text-yellow-800',
      'revenue': 'bg-blue-100 text-blue-800',
      'expense': 'bg-red-100 text-red-800'
    };
    return classes[type as keyof typeof classes] || '';
  };

  const getTypeText = (type: string) => {
    const texts = {
      'assets': 'أصول',
      'liabilities': 'خصوم',
      'equity': 'حقوق ملكية',
      'revenue': 'إيرادات',
      'expenses': 'مصروفات'
    };
    return texts[type as keyof typeof texts] || type;
  };

  const getBalanceClass = (balance: number, type: string) => {
    if (type === 'assets' || type === 'expenses') {
      return balance >= 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return balance >= 0 ? 'text-red-600' : 'text-green-600';
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadAccounts();
    };
    initializeData();
  }, [viewMode, startDate, endDate, selectedAccount, selectedPeriod]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:h-16 py-4 sm:py-0 justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h1 className="text-xl font-semibold text-gray-900">الأستاذ العام</h1>
                    <p className="text-sm text-gray-500">عرض وإدارة دفتر الأستاذ العام</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-x-4 w-full sm:w-auto">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode('summary')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                    viewMode === 'summary'
                      ? 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ملخص الحسابات
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('transactions')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md border-t border-b border-l ${
                    viewMode === 'transactions'
                      ? 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  جميع المعاملات
                </button>
              </div>
              <button
                onClick={exportLedger}
                type="button"
                className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <i className="fas fa-download text-xs"></i>
                تصدير
              </button>
              <button
                onClick={printLedger}
                type="button"
                className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
              >
                <i className="fas fa-print text-xs"></i>
                طباعة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Search Bar */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث في الحسابات</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchAccounts();
                  }}
                  placeholder="البحث في الحسابات..."
                  className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Account Filter */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">الحساب</label>
              <select
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value);
                  filterTransactions();
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              >
                <option value="">جميع الحسابات</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">الفترة</label>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  filterTransactions();
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              >
                <option value="">جميع الفترات</option>
                <option value="current">الفترة الحالية</option>
                <option value="previous">الفترة السابقة</option>
                <option value="year">السنة الحالية</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">نطاق التاريخ</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    filterTransactions();
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                />
                <span className="text-gray-500 text-sm">إلى</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    filterTransactions();
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
      </div>

        {/* Account Summary Table or Transactions Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {viewMode === 'summary' ? 'ملخص الحسابات' : 'جميع المعاملات'}
            </h3>
          </div>

          {viewMode === 'transactions' ? (
            /* Transactions Table */
            transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                  <i className="fas fa-receipt text-gray-400"></i>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">لا توجد معاملات</h3>
                <p className="mt-1 text-sm text-gray-500">لم يتم العثور على أي معاملات مرحلة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم القيد</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحساب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مدين</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دائن</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.entry_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          <button
                            onClick={() => navigate(`/finance/journal-entry/${transaction.entry_id}`)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {transaction.entry_number}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.account_name}</div>
                          <div className="text-xs text-gray-500">{transaction.account_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.description || transaction.entry_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {transaction.debit > 0 ? formatAmount(transaction.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {transaction.credit > 0 ? formatAmount(transaction.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Account Summary Table */
            paginatedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <i className="fas fa-book text-gray-400"></i>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">لا توجد حسابات</h3>
              <p className="mt-1 text-sm text-gray-500">لم يتم العثور على أي حسابات في دفتر الأستاذ</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الحساب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الحساب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرصيد الافتتاحي
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجمالي المدين
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجمالي الدائن
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرصيد الحالي
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 font-mono">{account.account_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{account.account_name}</span>
                        <span className="text-xs text-gray-500 italic">({getTypeText(account.root_account_type)})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeClass(account.root_account_type)}`}>
                        {getTypeText(account.root_account_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold font-mono text-gray-500">
                        -
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        {formatAmount(account.total_debit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        {formatAmount(account.total_credit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold font-mono ${getBalanceClass(account.balance, account.root_account_type)}`}>
                        {formatAmount(account.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-x-2">
                        <button
                          onClick={() => viewAccountDetails(account)}
                          className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          title="عرض التفاصيل"
                        >
                          <i className="fas fa-eye text-xs"></i>
                        </button>
                        <button
                          onClick={() => printAccount(account.id)}
                          className="inline-flex items-center gap-x-1.5 rounded-md bg-cyan-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                          title="طباعة"
                        >
                          <i className="fas fa-print text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {paginatedAccounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 font-mono">{account.account_number}</div>
                    <div className="text-sm font-medium text-gray-900">{account.account_name}</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getTypeClass(account.root_account_type)}`}>
                      {getTypeText(account.root_account_type)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewAccountDetails(account)}
                      className="inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                    >
                      <i className="fas fa-eye text-xs"></i>
                    </button>
                    <button
                      onClick={() => printAccount(account.id)}
                      className="inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm bg-cyan-600 text-white hover:bg-cyan-500"
                    >
                      <i className="fas fa-print text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">إجمالي المدين:</span>
                    <div className="font-semibold text-gray-900">{formatAmount(account.total_debit)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">إجمالي الدائن:</span>
                    <div className="font-semibold text-gray-900">{formatAmount(account.total_credit)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">الرصيد:</span>
                    <div className={`font-semibold ${getBalanceClass(account.balance, account.root_account_type)}`}>
                      {formatAmount(account.balance)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">عدد المعاملات:</span>
                    <div className="font-semibold text-gray-900">{account.transaction_count}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
            </>
          )
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative mr-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAccounts.length)}</span> من{' '}
                  <span className="font-medium">{filteredAccounts.length}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => changePage(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === page
                          ? 'z-10 bg-gray-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Details Modal */}
      {showModal && selectedAccountData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal} />

            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={closeModal}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <i className="fas fa-eye text-blue-600"></i>
                  </div>
                  <div className="mr-4">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      تفاصيل الحساب: {selectedAccountData.account.account_name}
                    </h3>
                    <p className="text-sm text-gray-500">عرض تفاصيل الحساب والمعاملات</p>
                  </div>
                </div>
              </div>

              {/* Account Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">رقم الحساب:</span>
                      <div className="text-lg text-gray-900 font-semibold font-mono">{selectedAccountData.account.account_number}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">النوع:</span>
                      <div className="text-lg text-gray-900">{getTypeText(selectedAccountData.account.root_account_type)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">عدد المعاملات:</span>
                      <div className="text-lg font-semibold text-gray-900">{selectedAccountData.summary.transaction_count}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">إجمالي المدين:</span>
                      <div className="text-lg font-semibold text-gray-900">{formatAmount(selectedAccountData.summary.total_debit)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">إجمالي الدائن:</span>
                      <div className="text-lg font-semibold text-gray-900">{formatAmount(selectedAccountData.summary.total_credit)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">الرصيد:</span>
                      <div className={`text-lg font-semibold ${getBalanceClass(selectedAccountData.summary.balance, selectedAccountData.account.root_account_type)}`}>
                        {formatAmount(selectedAccountData.summary.balance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">المعاملات</h4>
                {accountTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">لا توجد معاملات لهذا الحساب</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم القيد</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المرجع</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدين</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدائن</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accountTransactions.map((transaction, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {transaction.entry_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {transaction.reference ? (
                                <button
                                  onClick={() => navigate(`/finance/journal-entry/${transaction.entry_id}`)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                  {transaction.reference}
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {transaction.debit > 0 && (
                                <span className="text-sm font-semibold text-gray-900 font-mono">
                                  {formatAmount(transaction.debit)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {transaction.credit > 0 && (
                                <span className="text-sm font-semibold text-gray-900 font-mono">
                                  {formatAmount(transaction.credit)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-semibold font-mono ${getBalanceClass(transaction.balance, selectedAccountData.account.root_account_type)}`}>
                                {formatAmount(transaction.balance)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
