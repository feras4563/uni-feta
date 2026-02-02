// Updated App.tsx with JWT Authentication
// Replace your current App.tsx with this file or merge the changes

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
import SchedulingPage from "./pages/Scheduling";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassSessions from "./pages/teacher/ClassSessions";
import TeacherSubjectGroups from "./pages/teacher/TeacherSubjectGroups";
import LoginPage from "./components/auth/LoginPage";
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
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";

// ⚠️ CHANGE THIS: Import JWT Auth instead of Supabase Auth
import { JWTAuthProvider, useAuth } from "./contexts/JWTAuthContext";
import { hasClientPermission } from "./lib/jwt-auth";
import { useSystemSettings } from "./hooks/useSystemSettings";

function AppContent() {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { data: systemSettings } = useSystemSettings();

  // Rest of your App.tsx code remains the same...
  // Just make sure to use JWTAuthProvider instead of AuthProvider
  
  return (
    // Your existing JSX
    <div>App Content</div>
  );
}

function App() {
  return (
    // ⚠️ CHANGE THIS: Use JWTAuthProvider instead of AuthProvider
    <JWTAuthProvider>
      <AppContent />
    </JWTAuthProvider>
  );
}

export default App;
