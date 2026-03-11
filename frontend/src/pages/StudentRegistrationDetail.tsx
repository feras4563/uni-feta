import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchStudentSubjectEnrollmentById
} from "@/lib/api";
import { 
  ArrowLeft,
  User,
  Calendar,
  BookOpen,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building,
  GraduationCap
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function StudentRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Parse the composite ID (student_id-semester_id)
  const parseCompositeId = (compositeId: string) => {
    if (!compositeId) return null;
    
    // Handle different ID formats
    if (compositeId.includes('-')) {
      // For composite IDs like "ST259570-284963e1-aae3-4b35-a372-89bb5066745f"
      // The student ID is typically at the beginning and semester ID is a UUID at the end
      
      // Try to find a UUID pattern (8-4-4-4-12 characters)
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
      const uuidMatch = compositeId.match(uuidPattern);
      
      if (uuidMatch) {
        const semesterId = uuidMatch[1];
        const studentId = compositeId.replace(`-${semesterId}`, '');
        return { studentId, semesterId };
      }
      
      // Fallback: split by the last dash
      const parts = compositeId.split('-');
      if (parts.length >= 2) {
        const studentId = parts.slice(0, -1).join('-');
        const semesterId = parts[parts.length - 1];
        return { studentId, semesterId };
      }
    }
    
    // If no dashes, treat as a single student ID
    return { studentId: compositeId, semesterId: null };
  };

  const parsedId = parseCompositeId(id || '');
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Registration Detail Debug:', {
      originalId: id,
      parsedId,
      studentId: parsedId?.studentId,
      semesterId: parsedId?.semesterId
    });
  }, [id, parsedId]);
  
  // Fetch student enrollment by composite ID
  const { data: enrollmentData, isLoading: loadingEnrollments, error: enrollmentError } = useQuery({
    queryKey: ["student-enrollment", id],
    queryFn: () => {
      if (!id) throw new Error("No enrollment ID provided");
      return fetchStudentSubjectEnrollmentById(id);
    },
    enabled: !!id,
    retry: 2,
    retryDelay: 1000,
  });

  // Invoices are now accessed through the Finance module

  // enrollmentData is now directly from the API call

  // Loading state
  if (loadingEnrollments) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل التسجيل...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (enrollmentError || !enrollmentData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            تسجيل غير موجود
          </h3>
          <p className="text-gray-600 mb-6">
            لم يتم العثور على التسجيل المطلوب
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => navigate('/student-registrations')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              العودة إلى القائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            مسجل
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            مكتمل
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            مدفوع
          </span>
        );
      case 'unpaid':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            غير مدفوع
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            مدفوع جزئياً
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/student-registrations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة إلى قائمة التسجيلات
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          تفاصيل التسجيل
        </h1>
        <p className="text-gray-600">
          عرض تفاصيل تسجيل الطالب في المقررات
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              معلومات الطالب
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">الاسم</label>
                <p className="text-gray-900">{enrollmentData.student?.name || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                <p className="text-gray-900">{enrollmentData.student?.email || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">رقم الهوية</label>
                <p className="text-gray-900">{enrollmentData.student?.national_id_passport || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">القسم</label>
                <p className="text-gray-900">{enrollmentData.department?.name || 'غير محدد'}</p>
              </div>
            </div>
          </div>

          {/* Semester Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              معلومات الفصل الدراسي
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">اسم الفصل</label>
                <p className="text-gray-900">{enrollmentData.semester?.name || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">الاسم بالإنجليزية</label>
                <p className="text-gray-900">{enrollmentData.semester?.name_en || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">تاريخ التسجيل</label>
                <p className="text-gray-900">
                  {enrollmentData.enrollment_date ? 
                    formatDate(enrollmentData.enrollment_date) : 
                    'غير محدد'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">الحالة</label>
                <div className="mt-1">
                  {getStatusBadge(enrollmentData.payment_status || 'enrolled')}
                </div>
              </div>
            </div>
          </div>

          {/* Enrolled Subjects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              المقرر المسجل
            </h2>
            
            {enrollmentData.subject ? (
              <div className="space-y-3">
                {[enrollmentData.subject].map((subject: any, index: number) => (
                  <div key={subject.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">
                            {subject.code} - {subject.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(subject.credits || 0)} ساعة معتمدة
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency((subject.credits * subject.cost_per_credit) || 0, 'دينار')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getPaymentStatusBadge(enrollmentData.payment_status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>لا توجد مقررات مسجلة</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              ملخص التكلفة
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">عدد المقررات:</span>
                <span className="font-medium">{formatNumber(enrollmentData.subjects?.length || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي التكلفة:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(enrollmentData.total_cost || 0, 'دينار')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">حالة الدفع:</span>
                <div>
                  {getPaymentStatusBadge(enrollmentData.payment_status)}
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Link */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              الفواتير المالية
            </h3>
            
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                لعرض وإدارة الفواتير المالية لهذا الطالب، يرجى الانتقال إلى النظام المالي
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
                <p className="font-medium mb-2">💡 نصيحة:</p>
                <p>في النظام المالي، يمكنك البحث عن فواتير هذا الطالب باستخدام:</p>
                <ul className="text-right mt-2 space-y-1">
                  <li>• اسم الطالب: <span className="font-mono">{enrollmentData.students?.name}</span></li>
                  <li>• رقم الهوية: <span className="font-mono">{enrollmentData.students?.national_id_passport}</span></li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/finance')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <FileText className="h-4 w-4" />
                الانتقال إلى النظام المالي
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الإجراءات</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/student-registrations`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة إلى القائمة
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}