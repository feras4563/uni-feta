import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/jwt-auth';

interface JournalEntryLine {
  id: string;
  account_id: string;
  account_name?: string;
  debit: string;
  credit: string;
  description: string;
}

interface Account {
  id: number;
  account_name: string;
  account_number: string;
  is_group: boolean;
}

export default function EditJournalEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [formData, setFormData] = useState({
    entry_type: '',
    reference_number: '',
    entry_date: '',
    posting_date: '',
    series: '',
    company: '',
    notes: '',
  });

  const [lines, setLines] = useState<JournalEntryLine[]>([]);

  useEffect(() => {
    loadAccounts();
    loadEntry();
  }, [id]);

  const loadAccounts = async () => {
    try {
      const data = await apiRequest<Account[]>('/accounts');
      const detailAccounts = data.filter(acc => !acc.is_group);
      setAccounts(detailAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadEntry = async () => {
    try {
      setLoadingData(true);
      const data = await apiRequest<any>(`/journal-entries/${id}`);
      
      if (data.status !== 'draft') {
        alert('لا يمكن تعديل القيود المرحلة أو الملغاة');
        navigate(`/finance/journal-entry/${id}`);
        return;
      }

      setFormData({
        entry_type: data.entry_type,
        reference_number: data.reference_number || '',
        entry_date: data.entry_date,
        posting_date: data.posting_date,
        series: data.series,
        company: data.company || '',
        notes: data.notes || '',
      });

      setLines(data.lines.map((line: any) => ({
        id: line.id.toString(),
        account_id: line.account_id.toString(),
        account_name: `${line.account.account_name} (${line.account.account_number})`,
        debit: line.debit,
        credit: line.credit,
        description: line.description || '',
      })));
    } catch (error) {
      console.error('Error loading entry:', error);
      alert('خطأ في تحميل القيد');
      navigate('/finance');
    } finally {
      setLoadingData(false);
    }
  };

  const addLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      account_id: '',
      debit: '',
      credit: '',
      description: '',
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof JournalEntryLine, value: string) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        
        if (field === 'account_id') {
          const account = accounts.find(acc => acc.id === parseInt(value));
          updated.account_name = account ? `${account.account_name} (${account.account_number})` : '';
        }
        
        if (field === 'debit' && value) {
          updated.credit = '';
        } else if (field === 'credit' && value) {
          updated.debit = '';
        }
        
        return updated;
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { totalDebit, totalCredit, difference } = calculateTotals();
    
    if (Math.abs(difference) > 0.01) {
      alert('إجمالي المدين يجب أن يساوي إجمالي الدائن');
      return;
    }

    if (totalDebit === 0 || totalCredit === 0) {
      alert('يجب إدخال قيم للمدين والدائن');
      return;
    }

    const invalidLines = lines.filter(line => !line.account_id);
    if (invalidLines.length > 0) {
      alert('يجب اختيار حساب لكل سطر');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        lines: lines.map(line => ({
          account_id: parseInt(line.account_id),
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          description: line.description,
        })),
        total_debit: totalDebit,
        total_credit: totalCredit,
      };

      await apiRequest(`/journal-entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      alert('تم تحديث القيد بنجاح');
      navigate(`/finance/journal-entry/${id}`);
    } catch (error: any) {
      console.error('Error updating journal entry:', error);
      alert('خطأ في تحديث القيد: ' + (error.message || 'حدث خطأ غير متوقع'));
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit, difference } = calculateTotals();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل القيد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/finance/journal-entry/${id}`)}
                className="ml-4 text-gray-600 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">تعديل قيد يومية</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate(`/finance/journal-entry/${id}`)}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            {/* Entry Details */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع القيد <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.entry_type}
                      onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التاريخ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم المرجع
                    </label>
                    <input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ الترحيل
                    </label>
                    <input
                      type="date"
                      value={formData.posting_date}
                      onChange={(e) => setFormData({ ...formData, posting_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Journal Entry Lines */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">القيود المحاسبية</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة سطر
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">No</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحساب <span className="text-red-500">*</span></th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">مدين</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">دائن</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">ملاحظات</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3">
                          <select
                            value={line.account_id}
                            onChange={(e) => updateLine(line.id, 'account_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          >
                            <option value="">اختر الحساب</option>
                            {accounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.account_name} ({account.account_number})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit}
                            onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit}
                            onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="ملاحظات..."
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(line.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={2} className="px-4 py-3 text-right text-sm text-gray-700">
                        الإجمالي
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {totalDebit.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {totalCredit.toFixed(3)}
                      </td>
                      <td colSpan={2} className="px-4 py-3">
                        {Math.abs(difference) > 0.01 && (
                          <span className="text-red-600 text-sm">
                            الفرق: {Math.abs(difference).toFixed(3)}
                          </span>
                        )}
                        {Math.abs(difference) <= 0.01 && totalDebit > 0 && (
                          <span className="text-green-600 text-sm">✓ متوازن</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أضف ملاحظات إضافية..."
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
