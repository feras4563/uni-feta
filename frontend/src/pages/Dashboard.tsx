import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/JWTAuthContext';

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
  const { hasPermission } = useAuth();

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
    return allQuickActions.filter(a => hasPermission(a.requiredResource, a.requiredAction));
  }, [hasPermission]);

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
      </div>
    </div>
  );
};

export default Dashboard;