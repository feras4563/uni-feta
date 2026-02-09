import { useState, useEffect } from 'react';
import { QRService } from '../../lib/qr-service';
import Modal from '../ui/Modal';
import logo1 from '../../assets/logo1.png';

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
                background: #f3f4f6;
                direction: rtl;
              }
              
              .card-wrapper {
                width: 85.6mm;
                height: 53.98mm;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                border: 1px solid #e5e7eb;
              }
              
              .card-header {
                background: #1a2332;
                padding: 8px 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
              }
              
              .card-header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #2dd4bf, #14b8a6, #2dd4bf);
              }
              
              .uni-block {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .logo-wrap {
                background: #fff;
                border-radius: 4px;
                padding: 2px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .uni-logo {
                width: 24px;
                height: 24px;
                object-fit: contain;
              }
              
              .university-name {
                font-size: 12px;
                font-weight: 700;
                color: white;
                letter-spacing: 0.5px;
              }
              
              .university-name-en {
                font-size: 7.5px;
                font-weight: 600;
                color: #2dd4bf;
                font-family: Arial, sans-serif;
                letter-spacing: 0.3px;
              }
              
              .badge {
                background: rgba(45,212,191,0.15);
                color: #2dd4bf;
                font-size: 7px;
                padding: 2px 8px;
                border-radius: 10px;
                font-weight: 700;
                border: 1px solid rgba(45,212,191,0.3);
              }
              
              .card-body {
                flex: 1;
                display: flex;
                padding: 10px 14px;
                gap: 10px;
              }
              
              .left-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              
              .student-info {
                text-align: right;
              }
              
              .student-name {
                font-size: 12px;
                font-weight: 700;
                color: #1a2332;
                margin-bottom: 6px;
                line-height: 1.3;
                border-bottom: 2px solid #2dd4bf;
                padding-bottom: 4px;
              }
              
              .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 3px;
                font-size: 8px;
                line-height: 1.5;
              }
              
              .info-label {
                font-weight: 600;
                color: #6b7280;
              }
              
              .info-value {
                color: #1a2332;
                font-weight: 700;
              }
              
              .qr-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              
              .qr-code {
                width: 70px;
                height: 70px;
                border: 2px solid #1a2332;
                border-radius: 6px;
                padding: 2px;
                background: white;
              }
              
              .qr-label {
                font-size: 6px;
                color: #1a2332;
                font-weight: 600;
                margin-top: 2px;
                text-align: center;
              }
              
              .card-footer {
                background: #1a2332;
                padding: 4px 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 6.5px;
                color: #2dd4bf;
                font-weight: 600;
              }
              
              @media print {
                body { 
                  background: white !important;
                  padding: 0 !important;
                }
                .card-wrapper { 
                  box-shadow: none !important;
                  border: none !important;
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
                <div class="uni-block">
                  <div class="logo-wrap"><img class="uni-logo" src="${logo1}" alt="UKL" /></div>
                  <div>
                    <div class="university-name">جامعة الخليل الأهلية</div>
                    <div class="university-name-en">UNIVERSITY OF ALKHALIL</div>
                  </div>
                </div>
                <div class="badge">بطاقة طالب</div>
              </div>
              
              <div class="card-body">
                <div class="left-section">
                  <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    ${student.name_en ? `<div style="font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 4px; font-family: Arial;">${student.name_en}</div>` : ''}
                    
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
                <span>تاريخ الإصدار: ${formatDate(student.enrollment_date)}</span>
                <span>جامعة الخليل الأهلية - بطاقة رسمية</span>
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
