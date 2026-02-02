import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { signIn, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 LoginPage: Form submitted');
    console.log('📝 LoginPage: Form data:', formData);
    
    if (!formData.email || !formData.password) {
      console.log('❌ LoginPage: Email or password missing');
      return;
    }

    try {
      console.log('📝 LoginPage: Calling signIn with:', { 
        email: formData.email, 
        passwordLength: formData.password.length 
      });
      await signIn(formData);
      console.log('✅ LoginPage: signIn completed successfully');
      console.log('📝 LoginPage: Navigating to dashboard...');
      navigate('/');
    } catch (error) {
      console.error('❌ LoginPage: signIn failed:', error);
      // Error is handled by the context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <i className="fas fa-graduation-cap text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">UniERP Horizon</h1>
          <p className="text-slate-400">نظام إدارة الجامعة</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
            <p className="text-gray-600">أدخل بياناتك للوصول إلى النظام</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 ml-2"></i>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="أدخل البريد الإلكتروني"
                  required
                  disabled={loading}
                />
                <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12"
                  placeholder="أدخل كلمة المرور"
                  required
                  disabled={loading}
                />
                <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt ml-2"></i>
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              <i className="fas fa-info-circle ml-1"></i>
              بيانات تجريبية
            </h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>المدير:</strong> manager@university.edu</div>
              <div><strong>الموظف:</strong> staff@university.edu</div>
              <div><strong>كلمة المرور:</strong> password123</div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                <i className="fas fa-user-graduate ml-1"></i>
                <strong>المدرسين:</strong> يتم إنشاء حسابات فردية عند إضافة كل مدرس
              </p>
            </div>
          </div>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-green-500 hover:text-green-600 font-medium">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            © 2024 UniERP Horizon. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
