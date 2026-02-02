import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { fetchFees } from "../lib/api";
import FeeModal from "../features/fees/FeeModal";
import PaymentModal from "../features/fees/PaymentModal";
import { usePermissions } from "../hooks/usePermissions";

export default function FeesPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  const { data: fees = [], isLoading, error, refetch } = useQuery({
    queryKey: ["fees"],
    queryFn: fetchFees,
    retry: 1
  });
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter fees
  const filteredFees = useMemo(() => {
    return fees.filter((fee: any) => {
      if (statusFilter !== "all" && fee.status !== statusFilter) return false;
      if (searchTerm && !fee.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [fees, statusFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredFees.length;
    const paid = filteredFees.filter((f: any) => f.status === "paid").length;
    const unpaid = filteredFees.filter((f: any) => f.status === "unpaid").length;
    const partial = filteredFees.filter((f: any) => f.status === "partial").length;
    const totalAmount = filteredFees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
    const paidAmount = filteredFees
      .filter((f: any) => f.status === "paid")
      .reduce((sum: number, f: any) => sum + (f.amount || 0), 0);

    return { total, paid, unpaid, partial, totalAmount, paidAmount };
  }, [filteredFees]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { 
        label: 'مدفوع', 
        classes: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: 'fa-check-circle' 
      },
      unpaid: { 
        label: 'غير مدفوع', 
        classes: 'bg-gray-50 text-gray-600 border-gray-200', 
        icon: 'fa-clock' 
      },
      partial: { 
        label: 'مدفوع جزئياً', 
        classes: 'bg-gray-100 text-gray-700 border-gray-200', 
        icon: 'fa-circle-half-stroke' 
      },
      pending: { 
        label: 'معلق', 
        classes: 'bg-gray-50 text-gray-500 border-gray-200', 
        icon: 'fa-pause-circle' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border ${config.classes}`}>
        <i className={`fas ${config.icon} mr-1.5 text-xs`}></i>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات الرسوم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <i className="fas fa-exclamation-triangle text-gray-600"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-2 text-sm text-gray-600">تعذر تحميل بيانات الرسوم. يرجى المحاولة مرة أخرى.</p>
          <button 
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <i className="fas fa-redo mr-2"></i>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">إدارة الرسوم</h1>
              <p className="mt-1 text-sm text-gray-600">إدارة ومتابعة رسوم الطلاب الدراسية</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <i className="fas fa-download mr-2 text-sm"></i>
                تصدير
              </button>
              {canCreate('fees') && (
                <button
                  onClick={() => setAddOpen(true)}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                >
                  <i className="fas fa-plus mr-2 text-sm"></i>
                  إضافة رسوم جديدة
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الرسوم</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <i className="fas fa-file-invoice-dollar text-gray-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">مدفوعة</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.paid}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <i className="fas fa-check-circle text-gray-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">غير مدفوعة</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.unpaid}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <i className="fas fa-clock text-gray-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المبلغ الإجمالي</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <i className="fas fa-coins text-gray-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                البحث عن طالب
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pr-10 border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="اسم الطالب..."
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                حالة الدفع
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">مدفوع</option>
                <option value="unpaid">غير مدفوع</option>
                <option value="partial">مدفوع جزئياً</option>
                <option value="pending">معلق</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <i className="fas fa-times mr-2"></i>
                مسح الفلاتر
              </button>
            </div>
          </div>
        </div>

        {/* Fees Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredFees.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <i className="fas fa-file-invoice-dollar text-gray-400"></i>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد رسوم مسجلة</h3>
              <p className="mt-2 text-sm text-gray-600">
                {searchTerm || statusFilter !== "all" 
                  ? "لم يتم العثور على رسوم تطابق معايير البحث."
                  : "ابدأ بإضافة رسوم جديدة إلى النظام."
                }
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <div className="mt-6">
                  <button 
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    إضافة رسوم جديدة
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الرقم
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الطالب
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        نوع الرسوم
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الاستحقاق
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFees.map((fee: any) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">#{fee.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {fee.student?.name?.charAt(0)?.toUpperCase() || 'ط'}
                                </span>
                              </div>
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {fee.student?.name || "غير محدد"}
                              </div>
                              <div className="text-sm text-gray-500">
                                السنة {fee.student?.year || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {fee.fee_type?.name || fee.type || "رسوم دراسية"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(fee.amount || 0)}
                          </div>
                          {fee.paid_amount > 0 && fee.status === 'partial' && (
                            <div className="text-xs text-gray-500">
                              مدفوع: {formatCurrency(fee.paid_amount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(fee.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {fee.due_date ? new Date(fee.due_date).toLocaleDateString('ar-LY') : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {canEdit('fees') ? (
                            <button
                              onClick={() => { setSelectedFee(fee); setPayOpen(true); }}
                              disabled={fee.status === 'paid'}
                              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                                fee.status === 'paid'
                                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                  : 'text-gray-700 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <i className={`fas ${fee.status === 'paid' ? 'fa-check' : 'fa-credit-card'} mr-1.5 text-xs`}></i>
                              {fee.status === 'paid' ? 'مدفوع' : 'تسجيل دفع'}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                              fee.status === 'paid'
                                ? 'text-green-800 bg-green-100'
                                : 'text-yellow-800 bg-yellow-100'
                            }`}>
                              <i className={`fas ${fee.status === 'paid' ? 'fa-check' : 'fa-clock'} mr-1.5 text-xs`}></i>
                              {fee.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredFees.map((fee: any) => (
                  <div key={fee.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {fee.student?.name?.charAt(0)?.toUpperCase() || 'ط'}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-lg font-medium text-gray-900">
                            {fee.student?.name || "غير محدد"}
                          </div>
                          <div className="text-sm text-gray-500">#{fee.id}</div>
                        </div>
                      </div>
                      {getStatusBadge(fee.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">المبلغ</div>
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(fee.amount || 0)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">نوع الرسوم</div>
                        <div className="text-sm text-gray-900">{fee.fee_type?.name || fee.type || "رسوم دراسية"}</div>
                      </div>
                    </div>

                    {fee.due_date && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">تاريخ الاستحقاق</div>
                        <div className="text-sm text-gray-900">{new Date(fee.due_date).toLocaleDateString('ar-LY')}</div>
                      </div>
                    )}

                    {canEdit('fees') ? (
                      <button
                        onClick={() => { setSelectedFee(fee); setPayOpen(true); }}
                        disabled={fee.status === 'paid'}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                          fee.status === 'paid'
                            ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <i className={`fas ${fee.status === 'paid' ? 'fa-check' : 'fa-credit-card'} mr-2`}></i>
                        {fee.status === 'paid' ? 'مدفوع' : 'تسجيل دفع'}
                      </button>
                    ) : (
                      <div className={`w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md ${
                        fee.status === 'paid'
                          ? 'text-green-800 bg-green-100'
                          : 'text-yellow-800 bg-yellow-100'
                      }`}>
                        <i className={`fas ${fee.status === 'paid' ? 'fa-check' : 'fa-clock'} mr-2`}></i>
                        {fee.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination would go here if needed */}
        {filteredFees.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="text-sm text-gray-700">
              عرض {filteredFees.length} من أصل {fees.length} رسوم
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FeeModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => refetch()} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} fee={selectedFee} onPaid={() => refetch()} />
    </div>
  );
}