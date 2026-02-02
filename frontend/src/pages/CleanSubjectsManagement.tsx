import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  BookOpen,
  GraduationCap,
  DollarSign,
  Clock,
  Users,
  Building,
  CheckCircle,
  XCircle
} from "lucide-react";
import { 
  fetchAllSubjects, 
  fetchAllDepartments, 
  searchSubjects, 
  filterSubjectsByDepartment, 
  filterSubjectsBySemester,
  filterSubjectsByRequired,
  filterSubjectsByActive,
  deleteSubject,
  Subject 
} from "@/lib/clean-subjects-api";
import { fetchAllDepartments as fetchDepts } from "@/lib/clean-student-api";

export default function CleanSubjectsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [requiredFilter, setRequiredFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch subjects
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ["clean-subjects"],
    queryFn: fetchAllSubjects,
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ["clean-departments"],
    queryFn: fetchDepts,
  });

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clean-subjects"] });
    },
  });

  // Filter subjects based on search and filters
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    
    return subjects.filter((subject) => {
      const matchesSearch = 
        subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === "all" || subject.department_id === departmentFilter;
      const matchesSemester = semesterFilter === "all" || subject.semester_number.toString() === semesterFilter;
      const matchesRequired = requiredFilter === "all" || 
        (requiredFilter === "required" && subject.is_required) ||
        (requiredFilter === "optional" && !subject.is_required);
      const matchesActive = activeFilter === "all" || 
        (activeFilter === "active" && subject.is_active) ||
        (activeFilter === "inactive" && !subject.is_active);
      
      return matchesSearch && matchesDepartment && matchesSemester && matchesRequired && matchesActive;
    });
  }, [subjects, searchTerm, departmentFilter, semesterFilter, requiredFilter, activeFilter]);

  const getRequiredBadge = (isRequired: boolean) => {
    return isRequired ? (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        إجباري
      </span>
    ) : (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        اختياري
      </span>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        نشط
      </span>
    ) : (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        غير نشط
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المقرر "${subjectName}"؟`)) {
      try {
        await deleteSubjectMutation.mutateAsync(subjectId);
        alert('تم حذف المقرر بنجاح');
      } catch (error) {
        alert('حدث خطأ أثناء حذف المقرر');
        console.error('Delete error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات المقررات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600 mb-4">تعذر تحميل بيانات المقررات. يرجى المحاولة مرة أخرى.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            إعادة المحاولة
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المقررات الدراسية</h1>
            <p className="text-gray-600">إدارة شاملة للمقررات الدراسية في النظام</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة مقرر جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">إجمالي المقررات</p>
              <p className="text-2xl font-semibold text-gray-900">{subjects?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">المقررات الإجبارية</p>
              <p className="text-2xl font-semibold text-gray-900">
                {subjects?.filter(s => s.is_required).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">الأقسام</p>
              <p className="text-2xl font-semibold text-gray-900">{departments?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">متوسط التكلفة</p>
              <p className="text-2xl font-semibold text-gray-900">
                {subjects?.length ? formatCurrency(subjects.reduce((sum, s) => sum + s.total_cost, 0) / subjects.length) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="البحث عن المقررات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع الأقسام</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع الفصول</option>
            <option value="1">الفصل الأول</option>
            <option value="2">الفصل الثاني</option>
            <option value="3">الفصل الثالث</option>
            <option value="4">الفصل الرابع</option>
          </select>

          <select
            value={requiredFilter}
            onChange={(e) => setRequiredFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع المقررات</option>
            <option value="required">إجباري</option>
            <option value="optional">اختياري</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">قائمة المقررات</h3>
          <p className="text-sm text-gray-500 mt-1">
            عرض {filteredSubjects.length} من {subjects?.length || 0} مقرر
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المقرر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  القسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفصل
                </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الساعات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    السعة القصوى
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التكلفة
                  </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
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
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {subject.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subject.code}
                        </div>
                        {subject.description && (
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            {subject.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {subject.department_name || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      الفصل {subject.semester_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {subject.credits} ساعة
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {subject.max_students} طالب
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(subject.total_cost)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(subject.cost_per_credit)}/ساعة
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRequiredBadge(subject.is_required)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActiveBadge(subject.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
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
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
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

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مقررات</h3>
            <p className="mt-1 text-sm text-gray-500">
              لم يتم العثور على أي مقررات تطابق معايير البحث
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
