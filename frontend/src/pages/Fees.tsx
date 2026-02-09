import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { api } from "@/lib/api-client";
import { DollarSign, Search, Download, Receipt, CheckCircle, Clock, AlertCircle, X, CreditCard } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface Invoice {
  id: string;
  invoice_number: string;
  student: { id: string; name: string; email?: string };
  semester: { id: string; name: string };
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  invoice_date: string;
  due_date: string;
}

export default function FeesPage() {
  const queryClient = useQueryClient();
  const { canCreate, canEdit } = usePermissions();
  const canManageFees = canCreate('fees') || canEdit('fees');
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [allowAttendance, setAllowAttendance] = useState(false);
  
  const { data: invoices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["fees"],
    queryFn: async () => {
      const response = await api.get<Invoice[]>('/fees');
      return response;
    },
    retry: 2
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount, allowAttendance }: { invoiceId: string; amount: number; allowAttendance?: boolean }) => {
      return api.post(`/fees/${invoiceId}/payment`, { amount, allow_attendance: allowAttendance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
      setAllowAttendance(false);
    }
  });

  const toggleAttendanceMutation = useMutation({
    mutationFn: async ({ invoiceId, allow }: { invoiceId: string; allow: boolean }) => {
      return api.post(`/fees/${invoiceId}/toggle-attendance`, { allow_attendance: allow });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    }
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: Invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
      if (searchTerm && !invoice.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [invoices, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredInvoices.length;
    const paid = filteredInvoices.filter((f: Invoice) => f.status === "paid").length;
    const pending = filteredInvoices.filter((f: Invoice) => f.status === "pending").length;
    const partial = filteredInvoices.filter((f: Invoice) => f.status === "partial").length;
    const totalAmount = filteredInvoices.reduce((sum: number, f: Invoice) => sum + (f.total_amount || 0), 0);
    const paidAmount = filteredInvoices.reduce((sum: number, f: Invoice) => sum + (f.paid_amount || 0), 0);
    const balanceAmount = filteredInvoices.reduce((sum: number, f: Invoice) => sum + (f.balance || 0), 0);

    return { total, paid, pending, partial, totalAmount, paidAmount, balanceAmount };
  }, [filteredInvoices]);

  const getStatusConfig = (status: string) => {
    const configs = {
      paid: { 
        label: "مدفوع", 
        bgColor: "bg-green-50", 
        textColor: "text-green-700",
        borderColor: "border-green-200",
        icon: CheckCircle
      },
      pending: { 
        label: "غير مدفوع", 
        bgColor: "bg-yellow-50", 
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
        icon: Clock
      },
      partial: { 
        label: "مدفوع جزئياً", 
        bgColor: "bg-blue-50", 
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        icon: AlertCircle
      },
      overdue: { 
        label: "متأخر", 
        bgColor: "bg-red-50", 
        textColor: "text-red-700",
        borderColor: "border-red-200",
        icon: AlertCircle
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل`;
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedInvoice.balance) {
      alert("المبلغ غير صحيح");
      return;
    }
    recordPaymentMutation.mutate({ 
      invoiceId: selectedInvoice.id, 
      amount,
      allowAttendance: allowAttendance 
    });
  };

  const setPartialPayment = (percentage: number) => {
    if (selectedInvoice) {
      const amount = (selectedInvoice.balance * percentage / 100).toFixed(2);
      setPaymentAmount(amount);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات الرسوم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-2 text-sm text-gray-600">تعذر تحميل بيانات الرسوم. يرجى المحاولة مرة أخرى.</p>
          <button 
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الرسوم والفواتير</h1>
              <p className="mt-1 text-sm text-gray-600">متابعة وإدارة رسوم الطلاب الدراسية</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>تصدير التقرير</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الفواتير</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">مدفوعة بالكامل</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">غير مدفوعة</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الرصيد المتبقي</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(stats.balanceAmount)}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث عن طالب
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ابحث باسم الطالب..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة الدفع
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">مدفوع</option>
                <option value="pending">غير مدفوع</option>
                <option value="partial">مدفوع جزئياً</option>
                <option value="overdue">متأخر</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد فواتير</h3>
              <p className="mt-2 text-sm text-gray-600">
                {searchTerm || statusFilter !== "all" 
                  ? "لم يتم العثور على فواتير تطابق معايير البحث"
                  : "لا توجد فواتير مسجلة في النظام"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم الطالب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفصل الدراسي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ الإجمالي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ المدفوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الرصيد المتبقي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    {canManageFees && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice: Invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {invoice.invoice_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {invoice.student?.name?.charAt(0)?.toUpperCase() || 'ط'}
                              </span>
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {invoice.student?.name || "غير محدد"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {invoice.semester?.name || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(invoice.paid_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(invoice.balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig.label}
                          </span>
                        </td>
                        {canManageFees && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPaymentAmount(invoice.balance.toString());
                                  setShowPaymentModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <CreditCard className="h-4 w-4" />
                                <span>تسجيل دفعة</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredInvoices.length > 0 && (
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
            <div>
              عرض {filteredInvoices.length} من أصل {invoices.length} فاتورة
            </div>
            <div className="flex gap-6">
              <div>
                <span className="font-medium">الإجمالي:</span> {formatCurrency(stats.totalAmount)}
              </div>
              <div>
                <span className="font-medium">المدفوع:</span> {formatCurrency(stats.paidAmount)}
              </div>
              <div>
                <span className="font-medium">المتبقي:</span> {formatCurrency(stats.balanceAmount)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">تسجيل دفعة جديدة</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                  setPaymentAmount("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الطالب
                </label>
                <div className="text-base font-medium text-gray-900">
                  {selectedInvoice.student.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الفاتورة
                </label>
                <div className="text-base font-mono text-gray-900">
                  {selectedInvoice.invoice_number}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المبلغ الإجمالي
                  </label>
                  <div className="text-base font-semibold text-gray-900">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرصيد المتبقي
                  </label>
                  <div className="text-base font-semibold text-red-600">
                    {formatCurrency(selectedInvoice.balance)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ المدفوع
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  max={selectedInvoice.balance}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="أدخل المبلغ..."
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPartialPayment(25)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartialPayment(50)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartialPayment(75)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedInvoice.balance.toString())}
                    className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    كامل
                  </button>
                </div>
              </div>

              {/* Attendance Permission Toggle */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAttendance}
                    onChange={(e) => setAllowAttendance(e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">السماح بالحضور</div>
                    <div className="text-sm text-gray-600">
                      {allowAttendance ? (
                        <span className="text-green-700">✓ سيتم السماح للطالب بالحضور والتسجيل في المجموعات</span>
                      ) : (
                        <span>الطالب لن يتمكن من الحضور حتى الدفع الكامل</span>
                      )}
                    </div>
                  </div>
                </label>
                <div className="mt-2 text-xs text-gray-500">
                  💡 يمكنك السماح بالحضور حتى مع الدفع الجزئي (تجاوز إداري)
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleRecordPayment}
                disabled={recordPaymentMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {recordPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                  setPaymentAmount("");
                  setAllowAttendance(false);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
