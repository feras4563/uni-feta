import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";

type SystemSettingsData = {
  app_logo_url?: string | null;
  app_logo_name?: string | null;
};

export default function SystemSettings() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch current system settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async (): Promise<SystemSettingsData> => {
      try {
        const data = await api.get<SystemSettingsData>('/system-settings');
        return data || {};
      } catch (error) {
        console.error('Error fetching settings:', error);
        return {};
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صالح');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('logo', logoFile);

      // Upload to Laravel backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/system-settings/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل رفع الشعار');
      }

      const result = await response.json();

      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      
      alert(result.message || 'تم رفع الشعار بنجاح');
      setLogoFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(error.message || 'خطأ في رفع الشعار');
    } finally {
      setUploading(false);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg ml-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
              <p className="text-sm text-gray-600 mt-1">إدارة إعدادات النظام العامة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* App Logo Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                شعار التطبيق
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Current Logo Display */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">الشعار الحالي</h4>
                  {settings?.app_logo_url ? (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <img
                        src={settings.app_logo_url}
                        alt="App Logo"
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {settings.app_logo_name}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 mt-2">لا يوجد شعار محدد</p>
                    </div>
                  )}
                </div>

                {/* Upload Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">رفع شعار جديد</h4>
                  
                  {!logoFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-blue-600 hover:text-blue-500 mt-2">
                          اختر ملف الشعار
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, SVG - الحد الأقصى 5 ميجابايت
                        </p>
                      </label>
                      <input
                        ref={fileInputRef}
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <img
                          src={previewUrl!}
                          alt="Logo Preview"
                          className="max-w-full h-32 object-contain mx-auto"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {logoFile.name} ({(logoFile.size / 1024 / 1024).toFixed(2)} ميجابايت)
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={removeLogoFile}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleUploadLogo}
                          disabled={uploading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              رفع...
                            </>
                          ) : (
                            'رفع الشعار'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings Sections */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                إعدادات أخرى
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">إعدادات إضافية ستكون متاحة قريباً...</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


