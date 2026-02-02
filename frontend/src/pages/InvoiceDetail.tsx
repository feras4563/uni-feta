import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, User, Calendar, DollarSign, CheckCircle, Clock, XCircle, Printer } from 'lucide-react';
import { fetchAllInvoices } from '@/lib/api';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetchAllInvoices(),
  });

  const invoice = invoices?.find(inv => inv.id === invoiceId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY').format(amount) + ' دينار';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-LY');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'معلقة';
      case 'overdue':
        return 'متأخرة';
      default:
        return 'غير محدد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handlePrint = () => {
    // Open print page in new window
    const printUrl = `/finance/invoices/${invoice.id}/print`;
    window.open(printUrl, '_blank', 'width=800,height=600');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">فاتورة غير موجودة</h2>
          <p className="text-gray-600 mb-6">لم يتم العثور على الفاتورة المطلوبة</p>
          <button
            onClick={() => navigate('/finance/invoices')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة إلى قائمة الفواتير
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={() => navigate('/finance/invoices')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 ml-2" />
                العودة
              </button>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">تفاصيل الفاتورة</h1>
                  <p className="text-gray-600">رقم الفاتورة: {invoice.invoice_number}</p>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg border ${getStatusColor(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              <span className="font-medium">{getStatusText(invoice.status)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 ml-2 text-blue-600" />
                معلومات الفاتورة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفاتورة</label>
                  <p className="text-gray-900 font-mono">{invoice.invoice_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإصدار</label>
                  <p className="text-gray-900">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                  <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المجموع الكلي</label>
                  <p className="text-gray-900 font-semibold text-lg">{formatCurrency(invoice.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي للتسجيل</label>
                  <p className="text-gray-900">{invoice.semester?.name || 'غير محدد'}</p>
                </div>
              </div>
            </div>

            {/* Student Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 ml-2 text-green-600" />
                معلومات الطالب
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <p className="text-gray-900">{invoice.student?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</label>
                  <p className="text-gray-900 font-mono">{invoice.student?.national_id_passport || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <p className="text-gray-900">{invoice.student?.email || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                  <p className="text-gray-900">{invoice.department?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفصل</label>
                  <p className="text-gray-900">{invoice.semester?.name || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 ml-2 text-purple-600" />
                تفاصيل المواد
              </h2>
              
              {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                <div className="space-y-4">
                  {invoice.invoice_items.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.subjects?.name || 'مادة غير محددة'}</p>
                          <p className="text-sm text-gray-600 font-mono">{item.subjects?.code || 'غير محدد'}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                          <p className="text-sm text-gray-600">× {item.quantity}</p>
                        </div>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المجموع:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(item.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">المجموع الكلي:</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد مواد في هذه الفاتورة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4 rtl:space-x-reverse">
          <button
            onClick={() => navigate('/finance/invoices')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            العودة إلى القائمة
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة الفاتورة
          </button>
          {invoice.status === 'pending' && (
            <button
              onClick={() => navigate(`/finance/invoices/${invoice.id}/payment`)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              تسجيل الدفع
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
