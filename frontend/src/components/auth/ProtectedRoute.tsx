import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasClientPermission } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredResource?: string;
  requiredAction?: string;
  requiredRole?: 'manager' | 'staff' | 'teacher';
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredResource,
  requiredAction = 'view',
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // This will be handled by the main App component
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    return fallback || <UnauthorizedAccess />;
  }

  // Check resource/action permission
  if (requiredResource) {
    const hasAccess = hasClientPermission(user.role, requiredResource, requiredAction);
    if (!hasAccess) {
      return fallback || <UnauthorizedAccess />;
    }
  }

  return <>{children}</>;
}

function UnauthorizedAccess() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-ban text-red-500 text-2xl"></i>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            غير مصرح بالوصول
          </h1>
          
          <p className="text-gray-600 mb-6">
            عذراً، ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
            يرجى الاتصال بالمدير إذا كنت تعتقد أن هذا خطأ.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <i className="fas fa-arrow-right ml-2"></i>
              العودة للخلف
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <i className="fas fa-home ml-2"></i>
              الذهاب للرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
