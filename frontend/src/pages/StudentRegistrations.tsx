import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { fetchAllStudentSubjectEnrollments } from "@/lib/api";

export default function StudentRegistrations() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  // Fetch all student enrollments
  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ["all-student-enrollments"],
    queryFn: fetchAllStudentSubjectEnrollments,
  });

  const filteredEnrollments = useMemo(() => {
    if (!enrollments) return [];
    
    return enrollments.filter((enrollment: any) => {
      const matchesSearch = 
        enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.subject?.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || enrollment.status === statusFilter;
      const matchesSemester = semesterFilter === "all" || enrollment.semester?.id === semesterFilter;
      
      return matchesSearch && matchesStatus && matchesSemester;
    });
  }, [enrollments, searchTerm, statusFilter, semesterFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            مدفوع
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            مدفوع جزئياً
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            غير مدفوع
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل تسجيلات الطلاب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">خطأ في تحميل البيانات</h3>
          <p className="mt-1 text-sm text-gray-500">حدث خطأ أثناء تحميل تسجيلات الطلاب</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الطلاب في الفصل الدراسي</h1>
            <p className="text-gray-600">إدارة ومتابعة تسجيلات الطلاب في المقررات الدراسية</p>
          </div>
          <button
            onClick={() => navigate("/student-registrations/new")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            تسجيل جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">إجمالي التسجيلات</p>
              <p className="text-2xl font-bold text-gray-900">{enrollments?.length || 0}</p>
              <p className="text-xs text-gray-500">
                {enrollments?.reduce((sum, e) => sum + e.subject_count, 0) || 0} مقرر إجمالي
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">مدفوعة</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments?.filter((e: any) => e.payment_status === 'paid').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">مدفوعة جزئياً</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments?.filter((e: any) => e.payment_status === 'partial').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">غير مدفوعة</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments?.filter((e: any) => e.payment_status === 'unpaid').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في اسم الطالب، البريد الإلكتروني، أو المقرر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">مدفوع</option>
              <option value="partial">مدفوع جزئياً</option>
              <option value="unpaid">غير مدفوع</option>
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">جميع الفصول</option>
              {/* This would be populated with actual semesters */}
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">قائمة تسجيلات الطلاب</h3>
          <p className="text-sm text-gray-500 mt-1">
            عرض {filteredEnrollments.length} من {enrollments?.length || 0} تسجيل
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الطالب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المقررات ({enrollments?.reduce((sum, e) => sum + e.subject_count, 0) || 0})
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفصل الدراسي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التكلفة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  حالة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnrollments.map((enrollment: any) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.student?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.student?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.subject?.code} - {enrollment.subject?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.subject?.credits} ساعة معتمدة
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.semester?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.studyYear?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {((enrollment.subject?.credits || 0) * (enrollment.subject?.cost_per_credit || 0)).toLocaleString()} دينار
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(enrollment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(enrollment.enrollment_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/student-registrations/${enrollment.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEnrollments.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تسجيلات</h3>
            <p className="mt-1 text-sm text-gray-500">
              لم يتم العثور على أي تسجيلات تطابق معايير البحث
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
