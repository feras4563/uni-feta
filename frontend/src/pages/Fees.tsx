import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { DollarSign, Search, Download, CheckCircle, Clock, AlertCircle, X, CreditCard, Settings, ChevronDown, ChevronUp, Tag, Percent, Gift, BookOpen, Layers } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface InvoiceItem {
  id: string;
  subject_id: string | null;
  fee_definition_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  subject?: { id: string; name: string; code: string; credits: number } | null;
  fee_definition?: { id: string; name_ar: string; name_en: string | null; frequency: string } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  student: { id: string; name: string; email?: string; campus_id?: string };
  semester: { id: string; name: string };
  department?: { id: string; name: string };
  subtotal: number;
  discount: number;
  discount_type: 'none' | 'percentage' | 'fixed' | 'full_waiver';
  discount_percentage: number | null;
  discount_reason: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  invoice_date: string;
  due_date: string;
  items?: InvoiceItem[];
}

export default function FeesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { canCreate, canEdit, isManager } = usePermissions();
  const canManageFees = canCreate('fees') || canEdit('fees');
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [allowAttendance, setAllowAttendance] = useState(false);
  const [discountType, setDiscountType] = useState<string>("none");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  
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

  const applyDiscountMutation = useMutation({
    mutationFn: async ({ invoiceId, discount_type, discount_value, discount_reason }: { invoiceId: string; discount_type: string; discount_value?: number; discount_reason?: string }) => {
      return api.post(`/fees/${invoiceId}/discount`, { discount_type, discount_value, discount_reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setShowDiscountModal(false);
      setSelectedInvoice(null);
      setDiscountType("none");
      setDiscountValue("");
      setDiscountReason("");
    }
  });

  const removeDiscountMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return api.delete(`/fees/${invoiceId}/discount`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    }
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: Invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
      if (searchTerm && !invoice.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [invoices, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredInvoices.length;
    const paid = filteredInvoices.filter((f: Invoice) => f.status === "paid").length;
    const pending = filteredInvoices.filter((f: Invoice) => f.status === "pending").length;
    const partial = filteredInvoices.filter((f: Invoice) => f.status === "partial").length;
    const totalAmount = filteredInvoices.reduce((sum: number, f: Invoice) => sum + (Number(f.total_amount) || 0), 0);
    const paidAmount = filteredInvoices.reduce((sum: number, f: Invoice) => sum + (Number(f.paid_amount) || 0), 0);
    const balanceAmount = filteredInvoices.reduce((sum: number, f: Invoice) => sum + (Number(f.balance) || 0), 0);

    return { total, paid, pending, partial, totalAmount, paidAmount, balanceAmount };
  }, [filteredInvoices]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      paid: { label: "مدفوع", color: "text-green-600", icon: CheckCircle },
      pending: { label: "غير مدفوع", color: "text-yellow-600", icon: Clock },
      partial: { label: "جزئي", color: "text-blue-600", icon: AlertCircle },
      overdue: { label: "متأخر", color: "text-red-600", icon: AlertCircle },
    };
    return configs[status] || configs.pending;
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل`;
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > Number(selectedInvoice.balance)) {
      alert("المبلغ غير صحيح");
      return;
    }
    recordPaymentMutation.mutate({ invoiceId: selectedInvoice.id, amount, allowAttendance });
  };

  const handleApplyDiscount = () => {
    if (!selectedInvoice) return;
    const value = discountValue ? parseFloat(discountValue) : undefined;
    applyDiscountMutation.mutate({
      invoiceId: selectedInvoice.id,
      discount_type: discountType,
      discount_value: value,
      discount_reason: discountReason || undefined,
    });
  };

  const setPartialPayment = (percentage: number) => {
    if (selectedInvoice) {
      const amount = (Number(selectedInvoice.balance) * percentage / 100).toFixed(2);
      setPaymentAmount(amount);
    }
  };

  const getDiscountLabel = (invoice: Invoice) => {
    if (!invoice.discount_type || invoice.discount_type === 'none') return null;
    if (invoice.discount_type === 'full_waiver') return 'إعفاء كامل';
    if (invoice.discount_type === 'percentage') return `خصم ${invoice.discount_percentage}%`;
    if (invoice.discount_type === 'fixed') return `خصم ${formatCurrency(invoice.discount)}`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600">تعذر تحميل بيانات الرسوم.</p>
          <button onClick={() => refetch()} className="mt-3 text-sm text-gray-900 underline hover:no-underline">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">الرسوم والفواتير</h1>
            <p className="text-sm text-gray-500 mt-0.5">متابعة وإدارة رسوم الطلاب</p>
          </div>
          <div className="flex items-center gap-2">
            {canManageFees && (
              <button type="button" onClick={() => navigate('/fee-structure')} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-4 w-4" />
                هيكل الرسوم
              </button>
            )}
            <button type="button" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              تصدير
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              placeholder="بحث بالاسم أو رقم الفاتورة..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوع</option>
            <option value="pending">غير مدفوع</option>
            <option value="partial">مدفوع جزئياً</option>
            <option value="overdue">متأخر</option>
          </select>
          {(searchTerm || statusFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} className="text-xs text-gray-500 hover:text-gray-700">مسح</button>
          )}
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm">{searchTerm || statusFilter !== "all" ? "لم يتم العثور على فواتير" : "لا توجد فواتير"}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice: Invoice) => {
                const statusConfig = getStatusConfig(invoice.status);
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedInvoice === invoice.id;
                const discountLabel = getDiscountLabel(invoice);
                const subjectItems = invoice.items?.filter(i => i.subject_id) || [];
                const feeItems = invoice.items?.filter(i => i.fee_definition_id) || [];
                const academicTotal = subjectItems.reduce((s, i) => s + Number(i.amount), 0);
                const universityTotal = feeItems.reduce((s, i) => s + Number(i.amount), 0);

                return (
                  <div key={invoice.id}>
                    {/* Row */}
                    <div
                      className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{invoice.student?.name || "—"}</span>
                          <span className="text-xs text-gray-400 font-mono">{invoice.invoice_number}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {invoice.semester?.name}{invoice.department ? ` · ${invoice.department.name}` : ''}
                        </div>
                      </div>

                      {discountLabel && (
                        <span className="hidden sm:inline-flex text-xs text-purple-600">{discountLabel}</span>
                      )}

                      <div className="text-left min-w-[100px]">
                        <div className="text-sm font-semibold tabular-nums text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                        {Number(invoice.balance) > 0 && Number(invoice.balance) < Number(invoice.total_amount) && (
                          <div className="text-xs tabular-nums text-red-500">متبقي {formatCurrency(invoice.balance)}</div>
                        )}
                      </div>

                      <span className={`inline-flex items-center gap-1 text-xs ${statusConfig.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Academic Fees (Subject-based) */}
                          <div className="bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                الرسوم الأكاديمية
                              </span>
                              <span className="text-xs font-semibold tabular-nums text-gray-900">{formatCurrency(academicTotal)}</span>
                            </div>
                            {subjectItems.length > 0 ? (
                              <div className="divide-y divide-gray-50">
                                {subjectItems.map(item => (
                                  <div key={item.id} className="flex items-center justify-between px-4 py-2">
                                    <div>
                                      <div className="text-sm text-gray-900">{item.subject?.name || item.description}</div>
                                      {item.subject?.code && (
                                        <div className="text-xs text-gray-400">{item.subject.code} · {item.quantity} ساعة × {formatCurrency(item.unit_price)}</div>
                                      )}
                                    </div>
                                    <span className="text-sm tabular-nums text-gray-700">{formatCurrency(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-6 text-center text-xs text-gray-400">لا توجد رسوم أكاديمية</div>
                            )}
                          </div>

                          {/* University Fees (Fee-definition-based) */}
                          <div className="bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                                الرسوم الجامعية
                              </span>
                              <span className="text-xs font-semibold tabular-nums text-gray-900">{formatCurrency(universityTotal)}</span>
                            </div>
                            {feeItems.length > 0 ? (
                              <div className="divide-y divide-gray-50">
                                {feeItems.map(item => (
                                  <div key={item.id} className="flex items-center justify-between px-4 py-2">
                                    <div>
                                      <div className="text-sm text-gray-900">{item.fee_definition?.name_ar || item.description}</div>
                                      {item.fee_definition?.name_en && (
                                        <div className="text-xs text-gray-400">{item.fee_definition.name_en}</div>
                                      )}
                                    </div>
                                    <span className="text-sm tabular-nums text-gray-700">{formatCurrency(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-6 text-center text-xs text-gray-400">لا توجد رسوم جامعية</div>
                            )}
                          </div>
                        </div>

                        {/* Summary + Actions */}
                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                            <span className="text-gray-500">المجموع: <span className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal || invoice.total_amount)}</span></span>
                            {discountLabel && (
                              <span className="text-purple-600">الخصم: <span className="font-semibold">- {formatCurrency(invoice.discount)}</span></span>
                            )}
                            <span className="text-gray-500">الإجمالي: <span className="font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span></span>
                            <span className="text-green-600">المدفوع: <span className="font-semibold">{formatCurrency(invoice.paid_amount)}</span></span>
                            {Number(invoice.balance) > 0 && (
                              <span className="text-red-600">المتبقي: <span className="font-bold">{formatCurrency(invoice.balance)}</span></span>
                            )}
                          </div>

                          {canManageFees && (
                            <div className="flex items-center gap-2">
                              {invoice.status !== 'paid' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); setPaymentAmount(String(invoice.balance)); setShowPaymentModal(true); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800 transition-colors"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  دفعة
                                </button>
                              )}
                              {invoice.discount_type === 'none' || !invoice.discount_type ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); setDiscountType("percentage"); setDiscountValue(""); setDiscountReason(""); setShowDiscountModal(true); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-700 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                                >
                                  <Tag className="h-3.5 w-3.5" />
                                  خصم
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (window.confirm('هل تريد إزالة الخصم/الإعفاء؟')) removeDiscountMutation.mutate(invoice.id); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg text-xs hover:bg-red-50 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  إزالة الخصم
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {filteredInvoices.length > 0 && (
          <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
            <span>{filteredInvoices.length} فاتورة</span>
            <div className="flex gap-4">
              <span>الإجمالي: <span className="font-medium text-gray-700">{formatCurrency(stats.totalAmount)}</span></span>
              <span>المدفوع: <span className="font-medium text-green-600">{formatCurrency(stats.paidAmount)}</span></span>
              <span>المتبقي: <span className="font-medium text-red-600">{formatCurrency(stats.balanceAmount)}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">تسجيل دفعة</h3>
              <button onClick={() => { setShowPaymentModal(false); setSelectedInvoice(null); setPaymentAmount(""); }} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{selectedInvoice.student.name}</span>
                <span className="font-mono text-gray-400">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-500">الإجمالي</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">المتبقي</span>
                <span className="font-semibold text-red-600">{formatCurrency(selectedInvoice.balance)}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">المبلغ المدفوع</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min="0" max={Number(selectedInvoice.balance)} step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300" placeholder="0.00" dir="ltr" />
                <div className="mt-2 flex gap-1.5">
                  {[25, 50, 75].map(pct => (
                    <button key={pct} type="button" onClick={() => setPartialPayment(pct)} className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">{pct}%</button>
                  ))}
                  <button type="button" onClick={() => setPaymentAmount(String(selectedInvoice.balance))} className="flex-1 px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800">كامل</button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg p-3">
                <input type="checkbox" checked={allowAttendance} onChange={(e) => setAllowAttendance(e.target.checked)} className="h-3.5 w-3.5 text-gray-900 focus:ring-gray-300 border-gray-300 rounded" />
                <div className="flex-1">
                  <div className="text-sm text-gray-700">السماح بالحضور</div>
                  <div className="text-xs text-gray-400">{allowAttendance ? 'سيتم السماح للطالب بالحضور' : 'الطالب لن يتمكن من الحضور حتى الدفع الكامل'}</div>
                </div>
              </label>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50">{recordPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}</button>
              <button onClick={() => { setShowPaymentModal(false); setSelectedInvoice(null); setPaymentAmount(""); setAllowAttendance(false); }} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Discount/Waiver Modal */}
      {showDiscountModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">خصم / إعفاء</h3>
              <button onClick={() => { setShowDiscountModal(false); setSelectedInvoice(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{selectedInvoice.student.name}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.subtotal || selectedInvoice.total_amount)}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">نوع الخصم</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setDiscountType("percentage")} className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-colors ${discountType === 'percentage' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    نسبة مئوية
                  </button>
                  <button type="button" onClick={() => setDiscountType("fixed")} className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-colors ${discountType === 'fixed' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    مبلغ ثابت
                  </button>
                  <button type="button" onClick={() => setDiscountType("full_waiver")} className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-colors ${discountType === 'full_waiver' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    إعفاء كامل
                  </button>
                </div>
              </div>

              {discountType !== 'full_waiver' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {discountType === 'percentage' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (د.ل)'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    min="0"
                    max={discountType === 'percentage' ? 100 : Number(selectedInvoice.subtotal || selectedInvoice.total_amount)}
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={discountType === 'percentage' ? '10' : '50.00'}
                    dir="ltr"
                  />
                  {discountType === 'percentage' && discountValue && (
                    <div className="mt-1 text-xs text-gray-400">
                      = {formatCurrency(Number(selectedInvoice.subtotal || selectedInvoice.total_amount) * parseFloat(discountValue || '0') / 100)}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">السبب</label>
                <textarea
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                  placeholder="اختياري..."
                />
              </div>

              {discountType === 'full_waiver' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  سيتم إعفاء الطالب من كامل مبلغ الفاتورة.
                </div>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleApplyDiscount}
                disabled={applyDiscountMutation.isPending || (discountType !== 'full_waiver' && !discountValue)}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
              >
                {applyDiscountMutation.isPending ? "جاري التطبيق..." : "تطبيق"}
              </button>
              <button onClick={() => { setShowDiscountModal(false); setSelectedInvoice(null); }} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
