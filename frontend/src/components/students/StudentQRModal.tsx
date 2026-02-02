import { useState, useEffect } from 'react';
import { QRService } from '../../lib/qr-service';
import Modal from '../ui/Modal';

interface StudentQRModalProps {
  open: boolean;
  onClose: () => void;
  student: any;
}

export default function StudentQRModal({ open, onClose, student }: StudentQRModalProps) {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && student) {
      loadQRCode();
    }
  }, [open, student]);

  const loadQRCode = async () => {
    // Always generate new QR code (not using database storage)
    generateNewQR();
  };

  const generateNewQR = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Generating new QR for student:', student.id);
      console.log('📊 Student data:', {
        id: student.id,
        name: student.name,
        department_id: student.department_id,
        departments: student.departments,
        department_name: student.department_name
      });
      
      const qrResult = await QRService.generateStudentQR({
        studentId: student.id,
        name: student.name,
        nameEn: student.name_en || '',
        birthDate: student.birth_date || '',
        departmentId: student.department_id,
        departmentName: student.departments?.name || student.department_name || 'غير محدد',
        academicYear: student.year || 1,
        registrationDate: student.enrollment_date || ''
      });
      
      console.log('📊 Generated QR will display:', qrResult.formattedData);
      setQrDataURL(qrResult.qrDataURL);
    } catch (err: any) {
      console.error('Error generating new QR:', err);
      setError('فشل في إنشاء رمز QR جديد');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataURL) return;

    const link = document.createElement('a');
    link.download = `${student.name}_QR.png`;
    link.href = qrDataURL;
    link.click();
  };

  const printQR = () => {
    if (!qrDataURL) return;

    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      } catch {
        return dateStr || 'غير محدد';
      }
    };

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>بطاقة الطالب - ${student.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                padding: 20px;
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
                direction: rtl;
              }
              
              .card-wrapper {
                width: 85.6mm;
                height: 53.98mm;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
                position: relative;
              }
              
              .card-header {
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                padding: 12px 16px;
                position: relative;
                overflow: hidden;
              }
              
              .card-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -10%;
                width: 200px;
                height: 200px;
                background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
                border-radius: 50%;
              }
              
              .card-header::after {
                content: '';
                position: absolute;
                bottom: -30%;
                left: -5%;
                width: 150px;
                height: 150px;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                border-radius: 50%;
              }
              
              .university-logo {
                text-align: center;
                position: relative;
                z-index: 1;
              }
              
              .university-name {
                font-size: 16px;
                font-weight: 800;
                color: white;
                margin-bottom: 3px;
                text-shadow: 0 2px 8px rgba(0,0,0,0.3);
                letter-spacing: 1px;
              }
              
              .university-name-en {
                font-size: 10px;
                font-weight: 600;
                color: rgba(255,255,255,0.95);
                font-family: Arial, sans-serif;
                letter-spacing: 0.5px;
              }
              
              .card-body {
                display: flex;
                padding: 14px 16px;
                gap: 12px;
                background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
              }
              
              .left-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              
              .student-info {
                text-align: right;
              }
              
              .student-name {
                font-size: 13px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 8px;
                line-height: 1.3;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 4px;
              }
              
              .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
                font-size: 9px;
                line-height: 1.4;
              }
              
              .info-label {
                font-weight: 600;
                color: #475569;
                min-width: 65px;
              }
              
              .info-value {
                color: #1f2937;
                font-weight: 600;
                background: white;
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid #e2e8f0;
                font-size: 8.5px;
              }
              
              .qr-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: white;
                padding: 8px;
                border-radius: 8px;
                border: 2px solid #3b82f6;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
              }
              
              .qr-code {
                width: 90px;
                height: 90px;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                padding: 4px;
                background: white;
              }
              
              .qr-label {
                font-size: 7px;
                color: #1e40af;
                font-weight: 700;
                margin-top: 4px;
                text-align: center;
              }
              
              .card-footer {
                background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
                padding: 4px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 7px;
                color: white;
                font-weight: 600;
              }
              
              .validity {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              
              .issue-date {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              
              @media print {
                body { 
                  background: white !important;
                  padding: 0 !important;
                }
                .card-wrapper { 
                  box-shadow: none !important;
                  page-break-inside: avoid;
                }
                @page {
                  size: 85.6mm 53.98mm;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="card-wrapper">
              <div class="card-header">
                <div class="university-logo">
                  <div class="university-name">جـامعة أفق ليبيا</div>
                  <div class="university-name-en">OFOK LIBYA UNIVERSITY</div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="left-section">
                  <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    ${student.name_en ? `<div style="font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 6px; font-family: Arial;">${student.name_en}</div>` : ''}
                    
                    <div class="info-item">
                      <span class="info-label">رقم الطالب:</span>
                      <span class="info-value">${student.id}</span>
                    </div>
                    
                    <div class="info-item">
                      <span class="info-label">التخصص:</span>
                      <span class="info-value">${student.departments?.name || student.department_name || 'غير محدد'}</span>
                    </div>
                    
                    <div class="info-item">
                      <span class="info-label">السنة الدراسية:</span>
                      <span class="info-value">السنة ${student.year || 1}</span>
                    </div>
                    
                    <div class="info-item">
                      <span class="info-label">تاريخ الميلاد:</span>
                      <span class="info-value">${formatDate(student.birth_date)}</span>
                    </div>
                  </div>
                </div>
                
                <div class="qr-section">
                  <img src="${qrDataURL}" alt="QR Code" class="qr-code" />
                  <div class="qr-label">رمز التعريف</div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="validity">
                  <span>✓</span>
                  <span>بطاقة طالب رسمية</span>
                </div>
                <div class="issue-date">
                  <span>تاريخ الإصدار:</span>
                  <span>${formatDate(student.enrollment_date)}</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            رمز QR للطالب
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{student?.name}</h4>
            <p className="text-sm text-gray-600">رقم الطالب: {student?.id}</p>
            <p className="text-sm text-gray-600">التخصص: {student?.department_name || 'غير محدد'}</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="mr-2 text-gray-600">جاري تحميل رمز QR...</span>
            </div>
          )}

          {error && (
            <div className="py-8 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {qrDataURL && !loading && !error && (
            <>
              <div className="mb-4">
                <img 
                  src={qrDataURL} 
                  alt="Student QR Code" 
                  className="w-64 h-64 mx-auto border border-gray-300 rounded"
                />
              </div>
              
              <div className="flex justify-center space-x-4 space-x-reverse">
                <button
                  onClick={downloadQR}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  تحميل
                </button>
                <button
                  onClick={printQR}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                >
                  طباعة
                </button>
              </div>
            </>
          )}

          {!student?.qr_code && !loading && (
            <div className="py-8 text-gray-600">
              <p>لم يتم إنشاء رمز QR لهذا الطالب بعد</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
