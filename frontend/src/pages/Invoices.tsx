import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Building,
  BookOpen,
  Plus
} from 'lucide-react';
import { 
  fetchAllInvoices, 
  fetchBasicInvoices,
  testSupabaseConnection,
  testBasicInvoiceQuery,
  updateInvoiceStatus,
  fetchDepartments,
  fetchSemesters
} from '@/lib/api';
import { formatCurrency, formatDate, formatNumber, toLatinDigits } from '@/lib/utils';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBasicMode, setShowBasicMode] = useState(false);

  // Fetch data with fallback
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices', { status: statusFilter, semester: semesterFilter, department: departmentFilter, basicMode: showBasicMode }],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching invoices with filters:', {
          status: statusFilter || undefined,
          semesterId: semesterFilter || undefined,
          departmentId: departmentFilter || undefined,
          basicMode: showBasicMode
        });
        
        // If basic mode is enabled, use basic fetch
        if (showBasicMode) {
          console.log('🔍 Using basic mode...');
          const basicResult = await fetchBasicInvoices();
          console.log('✅ Basic invoices result:', basicResult.length, 'invoices');
          return basicResult;
        }
        
        const result = await fetchAllInvoices({
          status: statusFilter || undefined,
          semesterId: semesterFilter || undefined,
          departmentId: departmentFilter || undefined
        });
        
        console.log('✅ fetchAllInvoices result:', result.length, 'invoices');
        
        // If no invoices found, try basic fetch
        if (result.length === 0) {
          console.log('🔍 No invoices found, trying basic fetch...');
          const basicResult = await fetchBasicInvoices();
          console.log('✅ fetchBasicInvoices result:', basicResult.length, 'invoices');
          return basicResult;
        }
        
        return result;
      } catch (error) {
        console.error('❌ Error in invoice query:', error);
        // Try basic fetch as fallback
        try {
          const basicResult = await fetchBasicInvoices();
          console.log('✅ Fallback fetchBasicInvoices result:', basicResult.length, 'invoices');
          return basicResult;
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          throw error; // Throw original error
        }
      }
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments
  });

  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => fetchSemesters()
  });

  // Filter invoices based on search term
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    
    return invoices.filter(invoice => 
      invoice.students?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.students?.national_id_passport?.includes(searchTerm) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'معلق' },
      partial: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'مدفوع جزئياً' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'مدفوع' },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'متأخر' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'ملغي' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 ml-1" />
        {config.text}
      </span>
    );
  };

  const handlePaymentUpdate = async (invoiceId: string, paymentData: any) => {
    try {
      await updateInvoiceStatus(invoiceId, 'paid', paymentData);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSemesterFilter('');
    setDepartmentFilter('');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-1 text-sm text-gray-500">حدث خطأ أثناء تحميل الفواتير</p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>ملاحظة:</strong> قد تحتاج إلى إنشاء جداول الفواتير في قاعدة البيانات أولاً.
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              قم بتشغيل ملف create-invoice-tables.sql في قاعدة البيانات الخاصة بك.
            </p>
          </div>
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
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="mr-4">
                    <h1 className="text-xl font-semibold text-gray-900">إدارة الفواتير</h1>
                    <p className="text-sm text-gray-500">فواتير تسجيل الطلاب والمبالغ المالية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">تصفية الفواتير</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['invoices'] });
                }}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                تحديث البيانات
              </button>
              <button
                onClick={async () => {
                  console.log('🔍 Debug: Testing Supabase connection...');
                  try {
                    // Test Supabase connection
                    const connectionTest = await testSupabaseConnection();
                    console.log('🔍 Debug: Connection test result:', connectionTest);
                    
                    // Test basic invoice query
                    const queryTest = await testBasicInvoiceQuery();
                    console.log('🔍 Debug: Query test result:', queryTest);
                    
                    // Test basic fetch
                    const basicInvoices = await fetchBasicInvoices();
                    console.log('🔍 Debug: Basic invoices result:', basicInvoices);
                    
                    // Test full fetch
                    const fullInvoices = await fetchAllInvoices();
                    console.log('🔍 Debug: Full invoices result:', fullInvoices);
                    
                    // Show detailed info
                    const message = `
اختبار الاتصال:
- عدد الفواتير في قاعدة البيانات: ${connectionTest.count}
- خطأ في العد: ${connectionTest.countError ? 'نعم' : 'لا'}
- خطأ في جلب سجل واحد: ${connectionTest.oneError ? 'نعم' : 'لا'}
- المستخدم المسجل دخوله: ${connectionTest.user || 'غير مسجل'}

اختبار الاستعلامات:
- مع ORDER BY: ${queryTest.withOrderBy.data?.length || 0} فاتورة
- بدون ORDER BY: ${queryTest.withoutOrderBy.data?.length || 0} فاتورة
- مع LIMIT: ${queryTest.withLimit.data?.length || 0} فاتورة

نتائج الدوال:
- ${basicInvoices.length} فاتورة (fetchBasicInvoices)
- ${fullInvoices.length} فاتورة (fetchAllInvoices)
- ${invoices.length} فاتورة (في الواجهة)

تفاصيل الفواتير:
${basicInvoices.map(inv => 
  `- ${inv.invoice_number}: ${inv.student_id} (${inv.total_amount} دينار)`
).join('\n')}
                    `;
                    
                    alert(message);
                  } catch (error) {
                    console.error('🔍 Debug: Test error:', error);
                    alert('خطأ في الاختبار: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
                  }
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                اختبار مفصل
              </button>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                مسح الفلاتر
              </button>
              <button
                onClick={() => {
                  setShowBasicMode(!showBasicMode);
                  queryClient.invalidateQueries({ queryKey: ['invoices'] });
                }}
                className={`text-sm font-medium ${
                  showBasicMode 
                    ? 'text-orange-600 hover:text-orange-800' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {showBasicMode ? 'العرض الكامل' : 'العرض البسيط'}
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو رقم الهوية أو رقم الفاتورة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع الحالات</option>
                <option value="pending">معلق</option>
                <option value="partial">مدفوع جزئياً</option>
                <option value="paid">مدفوع</option>
                <option value="overdue">متأخر</option>
                <option value="cancelled">ملغي</option>
              </select>

              {/* Semester Filter */}
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع الفصول</option>
                {semesters.map((semester: any) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع الأقسام</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              الفواتير ({formatNumber(filteredInvoices.length)})
            </h3>
          </div>
          
          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">جاري تحميل الفواتير...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فواتير</h3>
              <p className="mt-1 text-sm text-gray-500">لم يتم العثور على فواتير تطابق معايير البحث</p>
              {invoices.length === 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>نصيحة:</strong> إذا كانت هذه هي المرة الأولى لاستخدام نظام الفواتير، تأكد من:
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 text-right">
                    <li>• تشغيل ملف create-invoice-tables.sql</li>
                    <li>• تسجيل الطلاب في المواد</li>
                    <li>• إنشاء فواتير تلقائية</li>
                  </ul>
                </div>
              )}
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
                      الطالب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      القسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الفصل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإصدار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {toLatinDigits(invoice.invoice_number)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {showBasicMode ? toLatinDigits(invoice.student_id) : (invoice.students?.name || toLatinDigits(invoice.student_id))}
                          </div>
                          <div className="text-gray-500">
                            {showBasicMode ? 'معرف الطالب' : (invoice.students?.national_id_passport ? toLatinDigits(invoice.students.national_id_passport) : 'غير متوفر')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {showBasicMode ? toLatinDigits(invoice.department_id) : (invoice.departments?.name || toLatinDigits(invoice.department_id))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {showBasicMode ? toLatinDigits(invoice.semester_id) : (invoice.semesters?.name || toLatinDigits(invoice.semester_id))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(invoice.total_amount, 'دينار')}</div>
                          {invoice.paid_amount > 0 && (
                            <div className="text-green-600 text-xs">
                              مدفوع: {formatCurrency(invoice.paid_amount, 'دينار')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigate(`/finance/invoices/${invoice.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="تسجيل دفعة"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title="تحميل PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onPayment={handlePaymentUpdate}
        />
      )}
    </div>
  );
}


// Payment Modal Component
function PaymentModal({ invoice, onClose, onPayment }: { 
  invoice: any; 
  onClose: () => void; 
  onPayment: (invoiceId: string, paymentData: any) => void;
}) {
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    paid_amount: invoice.total_amount - invoice.paid_amount
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPayment(invoice.id, paymentData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">تسجيل دفعة</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">إغلاق</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الفاتورة
            </label>
            <input
              type="text"
              value={toLatinDigits(invoice.invoice_number)}
              disabled
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ المتبقي
            </label>
            <input
              type="text"
              value={formatCurrency(invoice.total_amount - invoice.paid_amount, 'دينار')}
              disabled
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ الدفعة
            </label>
            <input
              type="number"
              value={paymentData.paid_amount}
              onChange={(e) => setPaymentData({...paymentData, paid_amount: parseFloat(e.target.value)})}
              max={invoice.total_amount - invoice.paid_amount}
              min="0"
              step="0.01"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع
            </label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">اختر طريقة الدفع</option>
              <option value="نقد">نقد</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="شيك">شيك</option>
              <option value="بطاقة ائتمان">بطاقة ائتمان</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ الدفع
            </label>
            <input
              type="date"
              value={paymentData.payment_date}
              onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم المرجع (اختياري)
            </label>
            <input
              type="text"
              value={paymentData.payment_reference}
              onChange={(e) => setPaymentData({...paymentData, payment_reference: e.target.value})}
              placeholder="رقم المرجع أو رقم المعاملة"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              تسجيل الدفعة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
