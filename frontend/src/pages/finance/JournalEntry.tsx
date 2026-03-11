import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/jwt-auth';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { formatCurrency, formatDate } from '@/lib/utils';

interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntryData {
  id?: number;
  entryNumber: string;
  date: string;
  description: string;
  type: 'regular' | 'adjusting' | 'closing';
  reference: string;
  status: 'posted' | 'draft' | 'void';
  notes: string;
  lines: JournalEntryLine[];
  debit?: number;
  credit?: number;
}

interface Account {
  id: number;
  accountNumber: string;
  accountName: string;
  account_number?: string;
  account_name?: string;
}

export default function JournalEntry() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [entryData, setEntryData] = useState<JournalEntryData>({
    entryNumber: '',
    date: '',
    description: '',
    type: 'regular',
    reference: '',
    status: 'draft',
    notes: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ]
  });

  // Load data from API or database
  const loadAccounts = async () => {
    try {
      const data = await apiRequest<any[]>('/accounts');
      setAccounts(data.map(acc => ({
        id: acc.id,
        accountNumber: acc.account_number || '',
        accountName: acc.account_name || ''
      })));
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('خطأ في تحميل الحسابات');
    }
  };

  const loadEntries = async () => {
    try {
      const response = await apiRequest<any>('/journal-entries');
      console.log('Journal entries loaded:', response);
      
      // Handle paginated response
      const entriesData = response.data || response;
      
      setEntries(entriesData.map((entry: any) => ({
        id: entry.id,
        entryNumber: entry.entry_number,
        date: entry.entry_date,
        description: entry.entry_type,
        type: 'regular',
        reference: entry.reference_number || '',
        status: entry.status,
        notes: entry.notes || '',
        lines: entry.lines || [],
        debit: parseFloat(entry.total_debit),
        credit: parseFloat(entry.total_credit)
      })));
    } catch (error) {
      console.error('Error loading entries:', error);
      setError('خطأ في تحميل القيود');
    }
  };

  // Computed values
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(entry => entry.type === selectedType);
    }

    if (selectedStatus) {
      filtered = filtered.filter(entry => entry.status === selectedStatus);
    }

    if (selectedDate) {
      filtered = filtered.filter(entry => entry.date === selectedDate);
    }

    return filtered;
  }, [entries, searchQuery, selectedType, selectedStatus, selectedDate]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, currentPage, itemsPerPage]);

  const totalPages = useMemo(() =>
    Math.ceil(filteredEntries.length / itemsPerPage)
  , [filteredEntries.length, itemsPerPage]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadEntries(), loadAccounts()]);
      } catch (err) {
        setError('خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Event handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const showAddEntryModal = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const editEntry = (entry: JournalEntryData) => {
    setIsEditing(true);
    setEditingId(entry.id || null);
    setEntryData({ ...entry });
    setShowModal(true);
  };

  const viewEntry = (entry: JournalEntryData) => {
    navigate(`/finance/journal-entry/${entry.id}`);
  };

  const postEntry = (id: number) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, status: 'posted' as const } : entry
      )
    );
  };

  const deleteEntry = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القيد؟')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEntryData({
      entryNumber: '',
      date: '',
      description: '',
      type: 'regular',
      reference: '',
      status: 'draft',
      notes: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' }
      ]
    });
  };

  const addLine = () => {
    setEntryData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', debit: 0, credit: 0, description: '' }]
    }));
  };

  const removeLine = (index: number) => {
    if (entryData.lines.length > 2) {
      setEntryData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: string | number) => {
    setEntryData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const submitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalDebit = entryData.lines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0);
    const totalCredit = entryData.lines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert('إجمالي المدين يجب أن يساوي إجمالي الدائن');
      return;
    }

    if (isEditing && editingId) {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === editingId
            ? { ...entryData, id: editingId, debit: totalDebit, credit: totalCredit }
            : entry
        )
      );
    } else {
      const newEntry: JournalEntryData = {
        ...entryData,
        id: Date.now(),
        debit: totalDebit,
        credit: totalCredit
      };
      setEntries(prev => [newEntry, ...prev]);
    }

    closeModal();
  };

  const exportJournal = () => {
    alert('سيتم تصدير اليومية...');
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, 'د.ل');
  };

  const getTypeClass = (type: string) => {
    const classes = {
      'regular': 'bg-green-100 text-green-800',
      'adjusting': 'bg-yellow-100 text-yellow-800',
      'closing': 'bg-red-100 text-red-800'
    };
    return classes[type as keyof typeof classes] || '';
  };

  const getTypeText = (type: string) => {
    const texts = {
      'regular': 'عادي',
      'adjusting': 'تسوية',
      'closing': 'إقفال'
    };
    return texts[type as keyof typeof texts] || type;
  };

  const getStatusClass = (status: string) => {
    const classes = {
      'posted': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'void': 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || '';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'posted': 'مرحل',
      'draft': 'مسودة',
      'void': 'ملغي'
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">القيود اليومية</h1>
          <p className="text-gray-600">إدارة وتتبع القيود المحاسبية</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/finance/journal-entry/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            إضافة قيد
          </button>
          <button
            onClick={exportJournal}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <i className="fas fa-download"></i>
            تصدير اليومية
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="البحث في القيود..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); handleFilterChange(); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع الأنواع</option>
            <option value="regular">عادي</option>
            <option value="adjusting">تسوية</option>
            <option value="closing">إقفال</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); handleFilterChange(); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع الحالات</option>
            <option value="posted">مرحل</option>
            <option value="draft">مسودة</option>
            <option value="void">ملغي</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); handleFilterChange(); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {paginatedEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <i className="fas fa-pen-to-square text-gray-400"></i>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">لا توجد قيود يومية</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة قيد يومي جديد</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/finance/journal-entry/add')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <i className="fas fa-plus ml-2"></i>
                إضافة قيد جديد
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم القيد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المدين
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدائن
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
              {paginatedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold text-gray-900">
                        {entry.entryNumber}
                      </span>
                      {entry.reference && (
                        <span className="text-sm text-gray-500 italic">
                          ({entry.reference})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.description}
                      </span>
                      {entry.notes && (
                        <span className="text-sm text-gray-500 italic">
                          {entry.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeClass(entry.type)}`}>
                      {getTypeText(entry.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-red-600">
                    {formatAmount(entry.debit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-green-600">
                    {formatAmount(entry.credit || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(entry.status)}`}>
                      {getStatusText(entry.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewEntry(entry)}
                        className="text-blue-600 hover:text-blue-900"
                        title="عرض"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => editEntry(entry)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="تعديل"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {entry.status === 'draft' && (
                        <button
                          onClick={() => postEntry(entry.id!)}
                          className="text-green-600 hover:text-green-900"
                          title="ترحيل"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id!)}
                        className="text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}إلى{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredEntries.length)}
                  </span>
                  {' '}من{' '}
                  <span className="font-medium">{filteredEntries.length}</span>
                  {' '}نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Entry Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={isEditing ? 'تعديل القيد' : 'إضافة قيد جديد'}>
        <form onSubmit={submitEntry} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم القيد
              </label>
              <input
                type="text"
                value={entryData.entryNumber}
                onChange={(e) => setEntryData({ ...entryData, entryNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ
              </label>
              <input
                type="date"
                value={entryData.date}
                onChange={(e) => setEntryData({ ...entryData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <input
                type="text"
                value={entryData.description}
                onChange={(e) => setEntryData({ ...entryData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                النوع
              </label>
              <select
                value={entryData.type}
                onChange={(e) => setEntryData({ ...entryData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر نوع القيد</option>
                <option value="regular">عادي</option>
                <option value="adjusting">تسوية</option>
                <option value="closing">إقفال</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المرجع
              </label>
              <input
                type="text"
                value={entryData.reference}
                onChange={(e) => setEntryData({ ...entryData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                value={entryData.status}
                onChange={(e) => setEntryData({ ...entryData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="draft">مسودة</option>
                <option value="posted">مرحل</option>
              </select>
            </div>
          </div>

          {/* Entry Lines */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">تفاصيل القيد</h4>
              <button
                type="button"
                onClick={addLine}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <i className="fas fa-plus"></i>
                إضافة سطر
              </button>
            </div>

            <div className="space-y-4">
              {entryData.lines.map((line, index) => (
                <div key={index} className="bg-white p-4 rounded-md border grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحساب
                    </label>
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    >
                      <option value="">اختر الحساب</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id.toString()}>
                          {account.accountNumber} - {account.accountName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المدين
                    </label>
                    <input
                      type="number"
                      value={line.debit}
                      onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الدائن
                    </label>
                    <input
                      type="number"
                      value={line.credit}
                      onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوصف
                    </label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex justify-center">
                    {entryData.lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                        title="حذف السطر"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Balance Check */}
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <div className="flex justify-between text-sm">
                <span>إجمالي المدين: {formatAmount(entryData.lines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0))}</span>
                <span>إجمالي الدائن: {formatAmount(entryData.lines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0))}</span>
              </div>
              {Math.abs(
                entryData.lines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0) -
                entryData.lines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0)
              ) > 0.01 && (
                <p className="text-red-600 text-sm mt-2">
                  تحذير: إجمالي المدين لا يساوي إجمالي الدائن
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={entryData.notes}
              onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
