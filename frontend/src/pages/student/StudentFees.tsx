import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchStudentMyFees } from '../../lib/jwt-api';

export default function StudentFees() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_fees: 0, total_paid: 0, total_balance: 0, invoice_count: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadFees();
  }, [user]);

  const loadFees = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentMyFees();
      setInvoices(data.invoices || []);
      setSummary(data.summary || { total_fees: 0, total_paid: 0, total_balance: 0, invoice_count: 0 });
    } catch (error) {
      console.error('Failed to load fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: 'مسودة', cls: 'bg-gray-100 text-gray-800' },
      pending: { label: 'معلق', cls: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'مدفوع جزئياً', cls: 'bg-orange-100 text-orange-800' },
      paid: { label: 'مدفوع', cls: 'bg-green-100 text-green-800' },
      overdue: { label: 'متأخر', cls: 'bg-red-100 text-red-800' },
      cancelled: { label: 'ملغي', cls: 'bg-gray-100 text-gray-500' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          <i className="fas fa-file-invoice-dollar ml-2 text-orange-500"></i>
          الرسوم والفواتير
        </h1>
        <p className="text-gray-600 mt-1">عرض جميع الفواتير والرسوم الدراسية</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-file-invoice text-blue-600"></i>
            </div>
            <div className="mr-3">
              <p className="text-xs text-gray-500">عدد الفواتير</p>
              <p className="text-xl font-bold text-gray-900">{loading ? '...' : summary.invoice_count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <i className="fas fa-coins text-gray-600"></i>
            </div>
            <div className="mr-3">
              <p className="text-xs text-gray-500">إجمالي الرسوم</p>
              <p className="text-xl font-bold text-gray-900">{loading ? '...' : formatCurrency(summary.total_fees)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
            <div className="mr-3">
              <p className="text-xs text-gray-500">المبلغ المدفوع</p>
              <p className="text-xl font-bold text-green-600">{loading ? '...' : formatCurrency(summary.total_paid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${summary.total_balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <i className={`fas fa-balance-scale ${summary.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}></i>
            </div>
            <div className="mr-3">
              <p className="text-xs text-gray-500">المتبقي</p>
              <p className={`text-xl font-bold ${summary.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {loading ? '...' : formatCurrency(summary.total_balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-4">
          {invoices.map((invoice: any) => (
            <div key={invoice.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center ml-4">
                      <i className="fas fa-file-invoice text-orange-600"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{invoice.invoice_number}</h3>
                      <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                        {invoice.semester?.name && <span><i className="fas fa-calendar ml-1"></i>{invoice.semester.name}</span>}
                        {invoice.department?.name && <span><i className="fas fa-building ml-1"></i>{invoice.department.name}</span>}
                        {invoice.invoice_date && <span><i className="fas fa-clock ml-1"></i>{new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    {getStatusBadge(invoice.status)}
                    <div className="text-left">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                      {invoice.balance > 0 && (
                        <p className="text-xs text-red-600">متبقي: {formatCurrency(invoice.balance)}</p>
                      )}
                    </div>
                    <i className={`fas fa-chevron-down text-gray-400 transition-transform ${expandedInvoice === invoice.id ? 'rotate-180' : ''}`}></i>
                  </div>
                </div>

                {/* Progress bar */}
                {invoice.total_amount > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          invoice.status === 'paid' ? 'bg-green-500' :
                          invoice.paid_amount > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((invoice.paid_amount / invoice.total_amount) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>مدفوع: {formatCurrency(invoice.paid_amount)}</span>
                      <span>{Math.round((invoice.paid_amount / invoice.total_amount) * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Items */}
              {expandedInvoice === invoice.id && invoice.items && invoice.items.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">تفاصيل الفاتورة</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-200">
                          <th className="text-right pb-2 font-medium">البند</th>
                          <th className="text-right pb-2 font-medium">الوصف</th>
                          <th className="text-left pb-2 font-medium">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2 text-gray-900">
                              {item.fee_definition?.name_ar || item.subject?.name || item.description || 'بند'}
                            </td>
                            <td className="py-2 text-gray-600">{item.description || '-'}</td>
                            <td className="py-2 text-left font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {invoice.discount > 0 && (
                          <tr className="border-t border-gray-200">
                            <td colSpan={2} className="py-2 text-green-700 font-medium">خصم</td>
                            <td className="py-2 text-left text-green-700 font-medium">-{formatCurrency(invoice.discount)}</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-gray-300">
                          <td colSpan={2} className="py-2 font-bold text-gray-900">الإجمالي</td>
                          <td className="py-2 text-left font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-file-invoice text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
          <p className="text-gray-500">لم يتم إصدار أي فواتير بعد</p>
        </div>
      )}
    </div>
  );
}
