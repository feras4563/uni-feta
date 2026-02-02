import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudents, fetchDepartments, updateStudent, deleteStudent } from "../lib/api";
import QRCode from "qrcode";
// Removed StudentModal import - now using full page navigation
import StudentQRModal from "../components/students/StudentQRModal";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/AuthContext";

export default function StudentsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // Removed showModal state - now using full page navigation
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  // Removed editingStudent state - now using full page navigation
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Form steps and submission are now handled by StudentModal component
  
  const studentsPerPage = 10;
  const queryClient = useQueryClient();

  // Form state is now handled by StudentModal component

  // Data fetching - using JWT API
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((student: any) => 
        student.name?.toLowerCase().includes(term) ||
        student.name_en?.toLowerCase().includes(term) ||
        student.national_id_passport?.toLowerCase().includes(term)
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter((student: any) => student.department_id === departmentFilter);
    }

    if (yearFilter) {
      filtered = filtered.filter((student: any) => student.year === parseInt(yearFilter));
    }

    if (statusFilter) {
      filtered = filtered.filter((student: any) => student.status === statusFilter);
    }

    return filtered;
  }, [students, searchTerm, departmentFilter, yearFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s: any) => s.status === "active").length;
    const currentYear = new Date().getFullYear();
    const newStudents = students.filter((s: any) => {
      if (!s.enrollment_date) return false;
      const enrollmentYear = new Date(s.enrollment_date).getFullYear();
      return enrollmentYear === currentYear;
    }).length;
    const graduatingStudents = students.filter((s: any) => s.year === 4).length;
    const studentsWithQR = students.filter((s: any) => s.qr_code).length;
    
    return { total, active, newStudents, graduatingStudents, studentsWithQR };
  }, [students]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;
    const end = start + studentsPerPage;
    return filteredStudents.slice(start, end);
  }, [filteredStudents, currentPage]);

  const visiblePages = useMemo(() => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Form validation is now handled by StudentModal component

  // Methods
  const getDepartmentName = (departmentId: string) => {
    if (!departmentId) return 'غير محدد';
    const dept = departments.find((d: any) => d.id === departmentId);
    return dept ? dept.name : 'غير محدد';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-LY');
  };

  const showAddStudentModal = () => {
    // Navigate to full page create instead of modal
    navigate('/students/create');
  };

  const editStudent = (student: any) => {
    // Navigate to full page edit instead of modal
    navigate(`/students/${student.id}`);
  };


  const editStudentFullScreen = (student: any) => {
    navigate(`/students/${student.id}`);
  };

  const viewStudentProfile = (student: any) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  const viewStudentQR = (student: any) => {
    // Ensure department name is included in the student object
    const studentWithDept = {
      ...student,
      department_name: student.departments?.name || getDepartmentName(student.department_id)
    };
    console.log('📊 Student QR data:', studentWithDept);
    setSelectedStudent(studentWithDept);
    setShowQRModal(true);
  };

  // Modal closing is now handled by StudentModal component

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStudent(null);
  };

  // Form reset is now handled by StudentModal component

  const generateQRCode = async (studentData: any) => {
    try {
      const qrData = {
        studentId: studentData.id,
        name: studentData.name,
        department: studentData.department_id,
        type: 'student'
      };
      
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const generateStudentId = () => {
    return `STU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Form submission is now handled by StudentModal component

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

    try {
      await deleteStudent(studentId);
      alert('تم حذف الطالب بنجاح');
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert('خطأ في حذف الطالب');
    }
  };

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const searchStudents = () => {
    setCurrentPage(1);
  };

  const filterStudents = () => {
    setCurrentPage(1);
  };

  const exportStudents = () => {
    alert('ميزة التصدير غير متوفرة حالياً');
  };

  const regenerateQRCode = async (student: any) => {
    if (!student) return;
    try {
      const qrCodeDataURL = await generateQRCode(student);
      if (qrCodeDataURL) {
        // Save QR code to database
        await updateStudent(student.id, { qr_code: qrCodeDataURL });
        alert('تم إنشاء رمز QR وحفظه بنجاح');
        setSelectedStudent({ ...student, qr_code: qrCodeDataURL });
        queryClient.invalidateQueries({ queryKey: ["students"] });
      } else {
        alert('حدث خطأ في إنشاء رمز QR');
      }
    } catch (error: any) {
      console.error('Error regenerating QR code:', error);
      alert('حدث خطأ في إنشاء رمز QR: ' + error.message);
    }
  };

  const downloadQRCode = (student: any) => {
    if (!student || !student.qr_code) {
      alert('لا يوجد رمز QR لهذا الطالب.');
      return;
    }
    const link = document.createElement('a');
    link.href = student.qr_code;
    link.download = `${student.name}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('تم تنزيل رمز QR بنجاح!');
  };

  const generateQRForAllStudents = async () => {
    if (!confirm('هل أنت متأكد من إنشاء رموز QR لجميع الطلاب الذين ليس لديهم رموز؟\n\nهذه العملية قد تستغرق بعض الوقت.')) {
      return;
    }
    
    try {
      const studentsToUpdate = students.filter((student: any) => !student.qr_code);
      if (studentsToUpdate.length === 0) {
        alert('جميع الطلاب لديهم رموز QR بالفعل.');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const student of studentsToUpdate) {
        try {
          const qrCodeDataURL = await generateQRCode(student);
          if (qrCodeDataURL) {
            await updateStudent(student.id, { qr_code: qrCodeDataURL });
            successCount++;
          }
        } catch (error) {
          console.error(`Error generating QR for student ${student.id}:`, error);
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        alert(`تم إنشاء ${successCount} رمز QR بنجاح.\nفشل إنشاء ${errorCount} رمز.`);
      } else {
        alert(`تم إنشاء وحفظ رموز QR لـ ${successCount} طالب بنجاح!`);
      }
      
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error: any) {
      console.error('Error generating QR for all students:', error);
      alert('حدث خطأ في إنشاء رموز QR للطلاب');
    }
  };

  // Step navigation is now handled by StudentModal component

  const getYearLabel = (year: string) => {
    const yearLabels: { [key: string]: string } = {
      '1': 'السنة الأولى',
      '2': 'السنة الثانية', 
      '3': 'السنة الثالثة',
      '4': 'السنة الرابعة'
    };
    return yearLabels[year] || 'غير محدد';
  };

  // Form field updates are now handled by StudentModal component

  // Old form functions - now handled by StudentModal
  /*
  const onAcademicTypeChange = (value: string) => {
    updateFormField('academic_history_type', value);
    updateFormField('academic_score', null);
    
    if (value === 'ثانوية') {
      updateFormField('score_type', 'percentage');
    } else if (value === 'بكالوريوس' || value === 'دبلوم') {
      updateFormField('score_type', 'gpa');
    } else {
      updateFormField('score_type', '');
    }
  };
  */

  // All form helper functions are now handled by StudentModal component

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', classes: 'bg-emerald-50 text-emerald-700', icon: '✓' },
      inactive: { label: 'غير نشط', classes: 'bg-red-50 text-red-700', icon: '✕' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.classes}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, yearFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات الطلاب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">حدث خطأ في التحميل</h3>
          <p className="mt-1 text-sm text-gray-500">تعذر تحميل بيانات الطلاب. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة الطلاب</h1>
                {user?.role === 'teacher' && user?.departmentName && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    عرض طلاب قسم {user.departmentName} فقط
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {canCreate('students') && (
                <button
                  onClick={showAddStudentModal}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                  title="إضافة طالب جديد"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة طالب
                </button>
              )}
              <button
                onClick={generateQRForAllStudents}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                title="إنشاء رموز QR للجميع"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                إنشاء QR للجميع
              </button>
              <button
                onClick={exportStudents}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                title="البحث والتصفية"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">

        {/* Professional Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">عدد الطلاب</div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">الطلاب النشطون</div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.newStudents}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">طلاب جدد</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.graduatingStudents}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">طلاب السنة الرابعة</div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.studentsWithQR}</div>
                <div className="text-sm font-medium text-gray-600 mt-1">طلاب لديهم رمز QR</div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              البحث والتصفية
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchStudents();
                  }}
                  placeholder="ابحث عن طالب..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  filterStudents();
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 bg-white"
              >
                <option value="">جميع الأقسام</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  filterStudents();
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 bg-white"
              >
                <option value="">جميع السنوات</option>
                <option value="1">السنة الأولى</option>
                <option value="2">?جميع السنوات</option>
                <option value="3">?جميع السنوات</option>
                <option value="4">?جميع السنوات</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  filterStudents();
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 bg-white"
              >
                <option value="">جميع السنوات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            
            {/* Results Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                عرض {paginatedStudents.length} من أصل {filteredStudents.length} طالب
                {filteredStudents.length !== students.length && (
                  <span className="text-gray-500"> (تم إخفاء {students.length - filteredStudents.length} طالب)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Professional Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              قائمة الطلاب
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">رقم الهوية</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">القسم</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">السنة الدراسية</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">رمز QR</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStudents.map((student: any, index: number) => (
                  <tr key={student.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg ml-3">
                          <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                          {student.name_en && (
                            <div className="text-xs text-gray-500">{student.name_en}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{student.national_id_passport || 'غير محدد'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getDepartmentName(student.department_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 bg-blue-100 rounded ml-2">
                          <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-900">سنة {student.year || 'غير محدد'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        {student.qr_code ? (
                          <button
                            onClick={() => viewStudentQR(student)}
                            className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                            title="عرض رمز QR"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs px-2 py-1 bg-gray-100 rounded-lg">لا يوجد</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <button
                          onClick={() => editStudentFullScreen(student)}
                          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          title="عرض بيانات الطالب?"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => viewStudentProfile(student)}
                          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          title="نشط السنة الأولى"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {canEdit('students') && (
                          <button
                            onClick={() => editStudent(student)}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            title="تعديل بيانات الطالب"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete('students') && (
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Professional Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                صفحة {currentPage} من {totalPages} ({filteredStudents.length} طالب)
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  السابق
                </button>
                
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    onClick={() => changePage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      page === currentPage
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeProfileModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={closeProfileModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    بطاقة الطالب
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
                    <p><strong>الرقم القومي:</strong> {selectedStudent.national_id_passport || 'غير محدد'}</p>
                    <p><strong>القسم:</strong> {getDepartmentName(selectedStudent.department_id)}</p>
                    <p><strong>السنة الدراسية:</strong> {selectedStudent.year || 'غير محدد'}</p>
                  </div>

                  {/* QR Code Display */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">رمز QR للطالب</h4>
                    {selectedStudent.qr_code ? (
                      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                        <img
                          src={selectedStudent.qr_code}
                          alt="Student QR Code"
                          className="w-32 h-32 border border-gray-300 rounded-lg mb-3"
                        />
                        <p className="text-sm text-gray-600 mb-3">امسح الرمز لعرض معلومات الطالب</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => regenerateQRCode(selectedStudent)}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          >
                            إعادة إنشاء
                          </button>
                          <button
                            onClick={() => downloadQRCode(selectedStudent)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            تحميل الرمز
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-3">لم يتم إنشاء رمز QR لهذا الطالب بعد</p>
                        <button
                          onClick={() => regenerateQRCode(selectedStudent)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          إنشاء رمز QR
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">معلومات الاتصال</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">البريد الإلكتروني:</span>
                        <span className="mr-2">{selectedStudent.email || 'غير محدد'}</span>
                      </div>
                      <div>
                        <span className="font-medium">رقم الهاتف:</span>
                        <span className="mr-2">{selectedStudent.phone || 'غير محدد'}</span>
                      </div>
                      <div>
                        <span className="font-medium">الجنس:</span>
                        <span className="mr-2">
                          {selectedStudent.gender === 'male' ? 'ذكر' : 
                           selectedStudent.gender === 'female' ? 'أنثى' : 'غير محدد'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">الجنسية:</span>
                        <span className="mr-2">{selectedStudent.nationality || 'غير محدد'}</span>
                      </div>
                      <div>
                        <span className="font-medium">تاريخ الميلاد:</span>
                        <span className="mr-2">{selectedStudent.birth_date ? formatDate(selectedStudent.birth_date) : 'غير محدد'}</span>
                      </div>
                      <div>
                        <span className="font-medium">تاريخ التسجيل:</span>
                        <span className="mr-2">{selectedStudent.enrollment_date ? formatDate(selectedStudent.enrollment_date) : 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">المعلومات الأكاديمية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">المعدل التراكمي:</span>
                        <span className="mr-2">{selectedStudent.gpa || 'غير محدد'}</span>
                      </div>
                      <div>
                        <span className="font-medium">الحالة:</span>
                        <span className="mr-2">{getStatusBadge(selectedStudent.status)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedStudent.address && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">العنوان</h4>
                      <p>{selectedStudent.address}</p>
                    </div>
                  )}
                  
                  {selectedStudent.sponsor_contact && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">معلومات ولي الأمر</h4>
                      <div>
                        <span className="font-medium">رقم الهاتف:</span>
                        <span className="mr-2">{selectedStudent.sponsor_contact}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed StudentModal - now using full page navigation */}

      {/* Student QR Modal */}
      <StudentQRModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        student={selectedStudent}
      />
    </div>
  );
}