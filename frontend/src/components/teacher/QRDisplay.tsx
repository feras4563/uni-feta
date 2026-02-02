import React, { useState, useEffect } from 'react';
import { QRService } from '../../lib/qr-service';

interface QRDisplayProps {
  sessionId: string;
  sessionName: string;
  expiresAt: string;
  qrData: string;
  onExpired?: () => void;
  onRefresh?: () => void;
}

export default function QRDisplay({
  sessionId,
  sessionName,
  expiresAt,
  qrData,
  onExpired,
  onRefresh
}: QRDisplayProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate QR code image
  useEffect(() => {
    const generateQRImage = async () => {
      try {
        setIsLoading(true);
        const imageUrl = await QRService.generateQRCodeDataURL(
          qrData, 
          QRService.getDisplayOptions('session')
        );
        setQrImageUrl(imageUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (qrData) {
      generateQRImage();
    }
  }, [qrData]);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
        onExpired?.();
      } else {
        setTimeRemaining(remaining);
        setIsExpired(false);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const getStatusColor = () => {
    if (isExpired) return 'text-red-600 bg-red-50 border-red-200';
    if (timeRemaining < 300000) return 'text-orange-600 bg-orange-50 border-orange-200'; // < 5 minutes
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = () => {
    if (isExpired) return 'منتهي الصلاحية';
    if (timeRemaining < 300000) return 'ينتهي قريباً';
    return 'نشط';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">رمز QR للحضور</h2>
        <p className="text-gray-600">{sessionName}</p>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-4 ${getStatusColor()}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          isExpired ? 'bg-red-500' : timeRemaining < 300000 ? 'bg-orange-500' : 'bg-green-500'
        }`}></div>
        {getStatusText()}
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {isLoading ? (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : isExpired ? (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center relative">
              <img 
                src={qrImageUrl} 
                alt="QR Code" 
                className="w-full h-full object-contain opacity-30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">
                  منتهي الصلاحية
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={qrImageUrl} 
                alt="QR Code" 
                className="w-64 h-64 rounded-lg border border-gray-200"
              />
              {/* Pulse animation for active QR */}
              <div className="absolute -inset-1 bg-green-500 rounded-lg opacity-20 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-2">الوقت المتبقي</p>
        <div className={`text-2xl font-mono font-bold ${
          isExpired ? 'text-red-600' : timeRemaining < 300000 ? 'text-orange-600' : 'text-green-600'
        }`}>
          {isExpired ? '00:00' : formatTimeRemaining(timeRemaining)}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">
          <i className="fas fa-info-circle mr-2"></i>
          تعليمات الاستخدام
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• اطلب من الطلاب مسح هذا الرمز أولاً</li>
          <li>• ثم مسح رمز QR الخاص بكل طالب</li>
          <li>• الرمز صالح لساعة واحدة بعد انتهاء الحصة</li>
          <li>• سيتم تسجيل التأخير للطلاب المتأخرين 15 دقيقة</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isExpired ? (
          <button
            onClick={onRefresh}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="fas fa-refresh mr-2"></i>
            تجديد الرمز
          </button>
        ) : (
          <>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fas fa-print mr-2"></i>
              طباعة
            </button>
            <button
              onClick={onRefresh}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <i className="fas fa-sync mr-2"></i>
              تحديث
            </button>
          </>
        )}
      </div>

      {/* Session Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">معرف الجلسة:</span>
            <p className="font-mono text-xs text-gray-700">{sessionId.slice(-8)}</p>
          </div>
          <div>
            <span className="text-gray-500">تاريخ الانتهاء:</span>
            <p className="text-gray-700">
              {new Date(expiresAt).toLocaleTimeString('ar-LY', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// QR Scanner Component for students (separate component)
interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning?: boolean;
}

export function QRScanner({ onScan, isScanning = false }: QRScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">مسح رمز QR</h2>
        <p className="text-gray-600">امسح رمز الحصة ثم رمز الطالب</p>
      </div>

      {/* Camera Scanner Placeholder */}
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-6">
        {isScanning ? (
          <div className="text-center">
            <div className="animate-pulse w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-qrcode text-white text-2xl"></i>
            </div>
            <p className="text-gray-600">جاري المسح...</p>
          </div>
        ) : (
          <div className="text-center">
            <i className="fas fa-camera text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-600">كاميرا المسح ستظهر هنا</p>
            <p className="text-sm text-gray-500 mt-2">
              (سيتم تفعيلها في المرحلة القادمة)
            </p>
          </div>
        )}
      </div>

      {/* Manual Input Option */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
        >
          <i className="fas fa-keyboard mr-2"></i>
          إدخال يدوي للرمز
        </button>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="mt-4">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="الصق رمز QR هنا..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              تأكيد
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
