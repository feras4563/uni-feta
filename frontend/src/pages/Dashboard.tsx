import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../lib/api';
import { useAuth } from '../contexts/JWTAuthContext';
import { hasClientPermission } from '../lib/jwt-auth';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  pendingFees: number;
  loading: boolean;
  error: string | null;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
  requiredResource: string;
  requiredAction: string;
  action?: () => void;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || 'staff';
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    pendingFees: 0,
    loading: true,
    error: null
  });

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      const dashboardData = await fetchDashboardStats();
      
      setStats({
        totalStudents: dashboardData.totalStudents,
        totalTeachers: dashboardData.totalTeachers,
        totalDepartments: dashboardData.totalDepartments,
        pendingFees: dashboardData.pendingFees,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'خطأ في تحميل البيانات'
      }));
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Quick Actions Configuration
  const allQuickActions: QuickAction[] = [
    {
      id: 'add-student',
      title: 'إضافة طالب جديد',
      description: 'تسجيل طالب جديد في النظام',
      icon: 'fa-user-plus',
      color: 'bg-blue-500',
      path: '/students',
      requiredResource: 'students',
      requiredAction: 'create',
      action: () => {
        navigate('/students');
      }
    },
    {
      id: 'student-registration',
      title: 'تسجيل مواد للطلاب',
      description: 'تسجيل الطلاب في المقررات الدراسية',
      icon: 'fa-list',
      color: 'bg-teal-500',
      path: '/student-registrations',
      requiredResource: 'student-registration',
      requiredAction: 'create',
      action: () => {
        navigate('/student-registrations');
      }
    },
    {
      id: 'view-fees',
      title: 'عرض الرسوم',
      description: 'عرض رسوم الطلاب والفواتير',
      icon: 'fa-money-bill-wave',
      color: 'bg-emerald-500',
      path: '/fees',
      requiredResource: 'fees',
      requiredAction: 'view',
      action: () => {
        navigate('/fees');
      }
    },
    {
      id: 'add-teacher',
      title: 'إضافة عضو هيئة تدريس',
      description: 'تسجيل عضو هيئة تدريس جديد',
      icon: 'fa-chalkboard-teacher',
      color: 'bg-green-500',
      path: '/teachers',
      requiredResource: 'teachers',
      requiredAction: 'create',
      action: () => {
        navigate('/teachers');
      }
    },
    {
      id: 'add-department',
      title: 'إضافة قسم جديد',
      description: 'إنشاء قسم أكاديمي جديد',
      icon: 'fa-building',
      color: 'bg-purple-500',
      path: '/departments',
      requiredResource: 'departments',
      requiredAction: 'create',
      action: () => {
        navigate('/departments');
      }
    },
    {
      id: 'journal-entry',
      title: 'إضافة قيد يومية',
      description: 'تسجيل قيد محاسبي جديد',
      icon: 'fa-pen-to-square',
      color: 'bg-indigo-500',
      path: '/finance',
      requiredResource: 'finance',
      requiredAction: 'create',
      action: () => {
        navigate('/finance');
      }
    },
    {
      id: 'payment',
      title: 'تسجيل دفعة',
      description: 'تسجيل دفعة رسوم من طالب',
      icon: 'fa-credit-card',
      color: 'bg-cyan-500',
      path: '/fees',
      requiredResource: 'fees',
      requiredAction: 'create',
      action: () => {
        navigate('/fees');
      }
    }
  ];

  const quickActions = useMemo(() => {
    return allQuickActions.filter(a => hasClientPermission(userRole, a.requiredResource, a.requiredAction));
  }, [userRole]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">لوحة التحكم</h1>
              <p className="text-sm text-gray-600 mt-1">مرحباً بك في نظام إدارة الجامعة</p>
            </div>
            <button
              onClick={loadDashboardStats}
              disabled={stats.loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ml-2 ${stats.loading ? 'animate-spin' : ''}`}></i>
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Quick Actions - Main Priority */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">الإجراءات السريعة</h2>
            <p className="text-gray-600">اختر الإجراء الذي تريد تنفيذه</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 p-6 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <div className={`${action.color} p-3 rounded-lg ml-4 group-hover:scale-110 transition-transform duration-200`}>
                    <i className={`fas ${action.icon} text-white text-lg`}></i>
                  </div>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Overview - Secondary */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">نظرة عامة</h2>
            {stats.error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
                {stats.error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Students */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الطلاب</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.loading ? (
                      <span className="animate-pulse bg-gray-200 h-8 w-16 rounded block"></span>
                    ) : (
                      stats.totalStudents.toLocaleString('ar-LY')
                    )}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Teachers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">هيئة التدريس</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.loading ? (
                      <span className="animate-pulse bg-gray-200 h-8 w-16 rounded block"></span>
                    ) : (
                      stats.totalTeachers.toLocaleString('ar-LY')
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <i className="fas fa-chalkboard-teacher text-green-600 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الأقسام</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.loading ? (
                      <span className="animate-pulse bg-gray-200 h-8 w-16 rounded block"></span>
                    ) : (
                      stats.totalDepartments.toLocaleString('ar-LY')
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <i className="fas fa-building text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>

            {/* Pending Fees */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الرسوم المعلقة</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {stats.loading ? (
                      <span className="animate-pulse bg-gray-200 h-8 w-16 rounded block"></span>
                    ) : (
                      formatCurrency(stats.pendingFees)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-chart-line text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">النشاطات الأخيرة</h3>
              <p className="text-gray-600 mb-6">سيتم عرض النشاطات والتحديثات الأخيرة هنا</p>
              <div className="text-sm text-gray-500">
                يمكنك البدء باستخدام الإجراءات السريعة أعلاه لإضافة البيانات
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;