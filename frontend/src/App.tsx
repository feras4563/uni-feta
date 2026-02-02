import { Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import StudentCreate from "./pages/StudentCreate";
import FeesPage from "./pages/Fees";
import TeachersPage from "./pages/Teachers";
import TeacherCreate from "./pages/TeacherCreate";
import TeacherDetail from "./pages/TeacherDetail";
import DepartmentsPage from "./pages/DepartmentsNew";
import DepartmentCreate from "./pages/DepartmentCreate";
import DepartmentEdit from "./pages/DepartmentEdit";
import DepartmentDetail from "./pages/DepartmentDetail";
import StudyMaterials from "./pages/StudyMaterials";
import SubjectCreate from "./pages/SubjectCreate";
import SubjectDetail from "./pages/SubjectDetail";
import StudyYears from "./pages/StudyYears";
import Semesters from "./pages/Semesters";
import Finance from "./pages/Finance";
import InvoiceDetail from "./pages/InvoiceDetail";
import InvoicePrintPage from "./pages/InvoicePrintPage";
import AddAccount from "./pages/finance/AddAccount";
import AddJournalEntry from "./pages/finance/AddJournalEntry";
import JournalEntryDetail from "./pages/finance/JournalEntryDetail";
import EditJournalEntry from "./pages/finance/EditJournalEntry";
import CompanyAccountDefaults from "./pages/finance/CompanyAccountDefaults";
import AccountDetail from "./pages/finance/AccountDetail";
import EditAccount from "./pages/finance/EditAccount";
import PaymentModes from "./pages/PaymentModes";
import PaymentModeCreate from "./pages/PaymentModeCreate";
import PaymentEntryCreate from "./pages/PaymentEntryCreate";
import PaymentEntryDetail from "./pages/PaymentEntryDetail";
import SchedulingPage from "./pages/Scheduling";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassSessions from "./pages/teacher/ClassSessions";
import TeacherSubjectGroups from "./pages/teacher/TeacherSubjectGroups";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SystemSettings from "./pages/settings/SystemSettings";
import Rooms from "./pages/Rooms";
import StudentGroups from "./pages/StudentGroups";
import StudentGroupDetail from "./pages/StudentGroupDetail";
import TeacherSubjectAssignment from "./pages/TeacherSubjectAssignment";
import TimetableGeneration from "./pages/TimetableGeneration";
import StudentRegistration from "./pages/StudentRegistration";
import StudentRegistrations from "./pages/StudentRegistrations";
import StudentRegistrationDetail from "./pages/StudentRegistrationDetail";
import EnhancedStudentRegistration from "./pages/EnhancedStudentRegistration";
import Timetable from "./pages/Timetable";
import TimetableGroupView from "./pages/TimetableGroupView";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
// import { AuthProvider, useAuth } from "./contexts/AuthContext"; // OLD Supabase auth
import { JWTAuthProvider, useAuth } from "./contexts/JWTAuthContext";
import { hasClientPermission } from "./lib/jwt-auth";
import { useSystemSettings } from "./hooks/useSystemSettings";

function AppContent() {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { data: systemSettings } = useSystemSettings();

  // Handle print routes separately - bypass main layout
  if (location.pathname.includes('/print')) {
    return <Routes>
      <Route path="/finance/invoices/:invoiceId/print" element={<InvoicePrintPage />} />
    </Routes>;
  }

  // Handle auth routes (login/register) separately
  if (location.pathname === '/login' || location.pathname === '/register') {
    return <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  if (!user && !location.pathname.startsWith('/register')) {
    return <LoginPage />;
  }

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center ${
      isActive 
        ? 'bg-green-500 hover:bg-green-600' 
        : 'hover:bg-slate-600'
    }`;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-700 shadow-lg">
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left side - Logo and Navigation Links */}
            <div className="flex items-center space-x-1 space-x-reverse">
              <div className="flex items-center mr-6">
                {systemSettings?.app_logo_url ? (
                  <img
                    src={systemSettings.app_logo_url}
                    alt={systemSettings.app_name || "App Logo"}
                    className="h-8 w-auto max-w-32 object-contain"
                  />
                ) : (
                  <div className="text-white text-sm font-medium">
                    {systemSettings?.app_name || "UniERP"}
                    <div className="text-xs text-green-400">
                      {systemSettings?.app_name === "UniERP Horizon" ? "Horizon" : ""}
                    </div>
                  </div>
                )}
              </div>
              {/* Teacher-specific navigation - Show teacher dashboard first */}
              {user.role === 'teacher' && (
                <Link
                  to="/"
                  className={getNavLinkClass("/")}
                >
                  <i className="fas fa-tachometer-alt text-xs ml-2"></i>
                  لوحة المدرس
                </Link>
              )}
              
              {/* Show generic dashboard only for non-teacher users */}
              {user.role !== 'teacher' && (
                <Link
                  to="/"
                  className={getNavLinkClass("/")}
                >
                  <i className="fas fa-home text-xs ml-2"></i>
                  لوحة التحكم
                </Link>
              )}
              
              {/* Master Data Section */}
              <div className="relative group">
                <div className="text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer hover:bg-slate-600">
                  <i className="fas fa-database text-xs ml-2"></i>
                  البيانات الأساسية
                  <i className="fas fa-chevron-down text-xs mr-2"></i>
                </div>
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {hasClientPermission(user.role, 'students', 'view') && (
                      <Link
                        to="/students"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-user-graduate text-xs ml-2"></i>
                        إدارة الطلاب
                      </Link>
                    )}
                    
                    {hasClientPermission(user.role, 'teachers', 'view') && (
                      <Link
                        to="/teachers"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-chalkboard-teacher text-xs ml-2"></i>
                        هيئة التدريس
                      </Link>
                    )}
                    
                    {hasClientPermission(user.role, 'departments', 'view') && (
                      <Link
                        to="/departments"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-building text-xs ml-2"></i>
                        الأقسام والتخصصات
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'subjects', 'view') && (
                      <Link
                        to="/study-materials"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-book text-xs ml-2"></i>
                        المقررات الدراسية
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'study-years', 'view') && (
                      <Link
                        to="/study-years"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-calendar-alt text-xs ml-2"></i>
                        السنوات الدراسية
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'semesters', 'view') && (
                      <Link
                        to="/semesters"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-calendar-week text-xs ml-2"></i>
                        الفصول الدراسية
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'rooms', 'view') && (
                      <Link
                        to="/rooms"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-door-open text-xs ml-2"></i>
                        إدارة القاعات
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'student-groups', 'view') && (
                      <Link
                        to="/student-groups"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-users text-xs ml-2"></i>
                        مجموعات الطلاب
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'student-registration', 'view') && (
                      <Link
                        to="/student-registrations"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-list text-xs ml-2"></i>
                        قائمة التسجيلات
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'timetable', 'view') && (
                      <Link
                        to="/timetable-generation"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-calendar-alt text-xs ml-2"></i>
                        الجدول الدراسي
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'teachers', 'view') && (
                      <Link
                        to="/teacher-subject-assignment"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-user-tie text-xs ml-2"></i>
                        تكليف المدرسين بالمواد
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'attendance', 'view') && (
                      <Link
                        to="/attendance"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-clipboard-check text-xs ml-2"></i>
                        الحضور والغياب
                      </Link>
                    )}

                    {hasClientPermission(user.role, 'grades', 'view') && (
                      <Link
                        to="/grades"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <i className="fas fa-graduation-cap text-xs ml-2"></i>
                        الدرجات والتقييم
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {user.role === 'manager' && (
                <Link
                  to="/schedule"
                  className={getNavLinkClass("/schedule")}
                >
                  <i className="fas fa-calendar-alt text-xs ml-2"></i>
                  الجدول
                </Link>
              )}

              {hasClientPermission(user.role, 'fees', 'view') && (
                <Link
                  to="/fees"
                  className={getNavLinkClass("/fees")}
                >
                  <i className="fas fa-dollar-sign text-xs ml-2"></i>
                  الرسوم
                </Link>
              )}
              
              {hasClientPermission(user.role, 'finance', 'view') && (
                <Link
                  to="/finance"
                  className="text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center hover:bg-slate-600"
                >
                  <i className="fas fa-chart-bar text-xs ml-2"></i>
                  النظام المالي
                </Link>
              )}

              {/* Settings Section */}
              <div className="relative group">
                <div className="text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer hover:bg-slate-600">
                  <i className="fas fa-cog text-xs ml-2"></i>
                  الإعدادات
                  <i className="fas fa-chevron-down text-xs mr-2"></i>
                </div>
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      to="/settings/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <i className="fas fa-user-cog text-xs ml-2"></i>
                      الملف الشخصي
                    </Link>
                    <Link
                      to="/settings/system"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <i className="fas fa-server text-xs ml-2"></i>
                      إعدادات النظام
                    </Link>
                    <Link
                      to="/settings/notifications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <i className="fas fa-bell text-xs ml-2"></i>
                      الإشعارات
                    </Link>
                    <Link
                      to="/settings/backup"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <i className="fas fa-download text-xs ml-2"></i>
                      النسخ الاحتياطي
                    </Link>
                    {user.role === 'manager' && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <Link
                          to="/settings/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <i className="fas fa-users text-xs ml-2"></i>
                          إدارة المستخدمين
                        </Link>
                        <Link
                          to="/settings/permissions"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <i className="fas fa-shield-alt text-xs ml-2"></i>
                          الصلاحيات
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Continue teacher-specific navigation */}
              {user.role === 'teacher' && (
                <>
                  <Link
                    to="/teacher/sessions"
                    className={getNavLinkClass("/teacher/sessions")}
                  >
                    <i className="fas fa-qrcode text-xs ml-2"></i>
                    الحصص والحضور
                  </Link>
                  <Link
                    to="/teacher/subject-groups"
                    className={getNavLinkClass("/teacher/subject-groups")}
                  >
                    <i className="fas fa-users text-xs ml-2"></i>
                    مجموعات المقررات
                  </Link>
                  <Link
                    to="/teacher/grades"
                    className={getNavLinkClass("/teacher/grades")}
                  >
                    <i className="fas fa-graduation-cap text-xs ml-2"></i>
                    الدرجات
                  </Link>
                  <Link
                    to="/teacher/schedule"
                    className={getNavLinkClass("/teacher/schedule")}
                  >
                    <i className="fas fa-calendar text-xs ml-2"></i>
                    الجدول
                  </Link>
                </>
              )}
              
            </div>

            {/* Right side - User Profile & Logout */}
            <div className="relative group">
                <div className="text-white hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer">
                  <i className="fas fa-user text-xs ml-2"></i>
                  <div className="text-xs">
                    <div>مرحباً</div>
                    <div>{user.fullName}</div>
                  </div>
                  <div className="mr-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'manager' 
                        ? 'bg-green-100 text-green-800' 
                        : user.role === 'teacher'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'manager' ? 'مدير' : user.role === 'teacher' ? 'مدرس' : 'موظف'}
                    </span>
                  </div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-sign-out-alt ml-2"></i>
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-14 bg-gray-100 min-h-screen">
        <Routes>
          <Route 
            path="/" 
            element={
              user.role === 'teacher' ? (
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              ) : (
                <Dashboard />
              )
            } 
          />
          <Route 
            path="/students" 
            element={
              <ProtectedRoute requiredResource="students" requiredAction="view">
                <StudentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/students/create" 
            element={
              <ProtectedRoute requiredResource="students" requiredAction="create">
                <StudentCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/students/:id" 
            element={
              <ProtectedRoute requiredResource="students" requiredAction="view">
                <StudentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teachers" 
            element={
              <ProtectedRoute requiredResource="teachers" requiredAction="view">
                <TeachersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teachers/create" 
            element={
              <ProtectedRoute requiredResource="teachers" requiredAction="create">
                <TeacherCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teachers/edit/:id" 
            element={
              <ProtectedRoute requiredResource="teachers" requiredAction="update">
                <TeacherCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teachers/:id" 
            element={
              <ProtectedRoute requiredResource="teachers" requiredAction="view">
                <TeacherDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fees" 
            element={
              <ProtectedRoute requiredResource="fees" requiredAction="view">
                <FeesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute requiredResource="departments" requiredAction="view">
                <DepartmentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments/create" 
            element={
              <ProtectedRoute requiredResource="departments" requiredAction="create">
                <DepartmentCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments/:id/edit" 
            element={
              <ProtectedRoute requiredResource="departments" requiredAction="update">
                <DepartmentEdit />
              </ProtectedRoute>
            } 
          />
                <Route
                  path="/departments/:id"
                  element={
                    <ProtectedRoute requiredResource="departments" requiredAction="view">
                      <DepartmentDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/study-materials"
                  element={
                    <ProtectedRoute requiredResource="subjects" requiredAction="view">
                      <StudyMaterials />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subjects/create"
                  element={
                    <ProtectedRoute requiredResource="subjects" requiredAction="create">
                      <SubjectCreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subjects/:id"
                  element={
                    <ProtectedRoute requiredResource="subjects" requiredAction="view">
                      <SubjectDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/study-years"
                  element={
                    <ProtectedRoute requiredResource="study-years" requiredAction="view">
                      <StudyYears />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/semesters"
                  element={
                    <ProtectedRoute requiredResource="semesters" requiredAction="view">
                      <Semesters />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rooms"
                  element={
                    <ProtectedRoute requiredResource="rooms" requiredAction="view">
                      <Rooms />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-groups"
                  element={
                    <ProtectedRoute requiredResource="student-groups" requiredAction="view">
                      <StudentGroups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-groups/:id"
                  element={
                    <ProtectedRoute requiredResource="student-groups" requiredAction="view">
                      <StudentGroupDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-registrations"
                  element={
                    <ProtectedRoute requiredResource="student-registration" requiredAction="view">
                      <StudentRegistrations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-registrations/new"
                  element={
                    <ProtectedRoute requiredResource="student-registration" requiredAction="create">
                      <EnhancedStudentRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-registrations/:id"
                  element={
                    <ProtectedRoute requiredResource="student-registration" requiredAction="view">
                      <StudentRegistrationDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable"
                  element={
                    <ProtectedRoute requiredResource="timetable" requiredAction="view">
                      <Timetable />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable/group/:groupId"
                  element={
                    <ProtectedRoute requiredResource="timetable" requiredAction="view">
                      <TimetableGroupView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher-subject-assignment"
                  element={
                    <ProtectedRoute requiredResource="teachers" requiredAction="view">
                      <TeacherSubjectAssignment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable-generation"
                  element={
                    <ProtectedRoute requiredResource="timetable" requiredAction="view">
                      <TimetableGeneration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute requiredResource="attendance" requiredAction="view">
                      <Attendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grades"
                  element={
                    <ProtectedRoute requiredResource="grades" requiredAction="view">
                      <Grades />
                    </ProtectedRoute>
                  }
                />
          <Route 
            path="/schedule" 
            element={
              <ProtectedRoute requiredRole="manager">
                <SchedulingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="view">
                <Finance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/invoices/:invoiceId" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="view">
                <InvoiceDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/accounts/add" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="create">
                <AddAccount />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/journal-entry/add" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="create">
                <AddJournalEntry />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/journal-entry/:id" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="view">
                <JournalEntryDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/journal-entry/:id/edit" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="update">
                <EditJournalEntry />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/account-defaults" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="view">
                <CompanyAccountDefaults />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/accounts/:accountId" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="view">
                <AccountDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/accounts/:accountId/edit" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="update">
                <EditAccount />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/payment-modes" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="view">
                <PaymentModes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/payment-modes/create" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="create">
                <PaymentModeCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/payment-modes/:id/edit" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="update">
                <PaymentModeCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/payment-entry/create" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="create">
                <PaymentEntryCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance/payment-entry/:id" 
            element={
              <ProtectedRoute requiredResource="finance" requiredAction="read">
                <PaymentEntryDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Teacher Routes */}
          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/sessions" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <ClassSessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/subject-groups" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherSubjectGroups />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/grades" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">إدارة الدرجات</h1>
                  <p className="text-gray-600 mt-2">قريباً...</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/schedule" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">الجدول الدراسي</h1>
                  <p className="text-gray-600 mt-2">قريباً...</p>
                </div>
              </ProtectedRoute>
            } 
          />

          {/* Settings Routes */}
          <Route 
            path="/settings/profile" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
                  <p className="text-gray-600 mt-2">إعدادات الملف الشخصي</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/system" 
            element={
              <ProtectedRoute requiredRole="manager">
                <SystemSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/notifications" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">الإشعارات</h1>
                  <p className="text-gray-600 mt-2">إعدادات الإشعارات</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/backup" 
            element={
              <ProtectedRoute requiredRole="manager">
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">النسخ الاحتياطي</h1>
                  <p className="text-gray-600 mt-2">إدارة النسخ الاحتياطية</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/users" 
            element={
              <ProtectedRoute requiredRole="manager">
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
                  <p className="text-gray-600 mt-2">إدارة المستخدمين والصلاحيات</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/permissions" 
            element={
              <ProtectedRoute requiredRole="manager">
                <div className="min-h-screen bg-gray-50 p-8">
                  <h1 className="text-3xl font-bold text-gray-900">الصلاحيات</h1>
                  <p className="text-gray-600 mt-2">إدارة الصلاحيات والأدوار</p>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <JWTAuthProvider>
      <AppContent />
    </JWTAuthProvider>
  );
}
