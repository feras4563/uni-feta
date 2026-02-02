import React from 'react';

interface ReceiptProps {
  receiptData: {
    receipt_number: string;
    payment_date: string;
    student_name: string;
    student_id: string;
    fee_type: string;
    amount_paid: number;
    payment_method: string;
    reference_number?: string;
    remaining_balance: number;
    total_fee_amount: number;
    notes?: string;
  };
  onPrint?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

export default function Receipt({ receiptData, onPrint, onClose, showActions = true }: ReceiptProps) {
  const handlePrint = () => {
    const printContent = generatePrintableReceipt(receiptData);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>إيصال دفع - ${receiptData.receipt_number}</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                direction: rtl;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
              }
              .receipt {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
                margin-bottom: 25px;
              }
              .header h1 {
                margin: 0;
                color: #333;
                font-size: 24px;
              }
              .header h2 {
                margin: 5px 0 0 0;
                color: #666;
                font-size: 18px;
                font-weight: normal;
              }
              .info-section {
                margin-bottom: 20px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 5px 0;
              }
              .info-row.highlight {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                font-weight: bold;
              }
              .label {
                font-weight: 600;
                color: #333;
              }
              .value {
                color: #555;
              }
              .amount {
                font-size: 18px;
                font-weight: bold;
                color: #2563eb;
              }
              .divider {
                border-top: 1px solid #ddd;
                margin: 15px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 15px;
              }
              .qr-placeholder {
                width: 80px;
                height: 80px;
                border: 2px dashed #ccc;
                margin: 10px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #999;
              }
              @media print {
                body { background: white; }
                .receipt { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 100);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    onPrint?.();
  };

  const generatePrintableReceipt = (data: ReceiptProps['receiptData']) => {
    return `
      <div class="receipt">
        <div class="header">
          <h1>جامعة الأفق</h1>
          <h2>إيصال دفع رسوم</h2>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">رقم الإيصال:</span>
            <span class="value">${data.receipt_number}</span>
          </div>
          <div class="info-row">
            <span class="label">تاريخ الدفع:</span>
            <span class="value">${new Date(data.payment_date).toLocaleDateString('ar-LY')}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">اسم الطالب:</span>
            <span class="value">${data.student_name}</span>
          </div>
          <div class="info-row">
            <span class="label">رقم الطالب:</span>
            <span class="value">${data.student_id}</span>
          </div>
          <div class="info-row">
            <span class="label">نوع الرسوم:</span>
            <span class="value">${data.fee_type}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div class="info-row highlight">
            <span class="label">المبلغ المدفوع:</span>
            <span class="value amount">${data.amount_paid.toLocaleString()} دينار ليبي</span>
          </div>
          <div class="info-row">
            <span class="label">طريقة الدفع:</span>
            <span class="value">${data.payment_method}</span>
          </div>
          ${data.reference_number ? `
            <div class="info-row">
              <span class="label">رقم المرجع:</span>
              <span class="value">${data.reference_number}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="label">إجمالي الرسوم:</span>
            <span class="value">${data.total_fee_amount.toLocaleString()} دينار</span>
          </div>
          <div class="info-row">
            <span class="label">المبلغ المتبقي:</span>
            <span class="value" style="color: ${data.remaining_balance === 0 ? '#16a34a' : '#dc2626'}">${data.remaining_balance.toLocaleString()} دينار</span>
          </div>
        </div>
        
        ${data.notes ? `
          <div class="divider"></div>
          <div class="info-section">
            <div class="info-row">
              <span class="label">ملاحظات:</span>
            </div>
            <div style="margin-top: 5px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 14px;">
              ${data.notes}
            </div>
          </div>
        ` : ''}
        
        <div class="qr-placeholder">
          رمز QR
        </div>
        
        <div class="footer">
          <p><strong>شكراً لكم لثقتكم بنا</strong></p>
          <p>تم إنشاء هذا الإيصال إلكترونياً في ${new Date().toLocaleString('ar-LY')}</p>
          <p>للاستفسارات: info@university.edu.sa | 966-11-1234567</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
      {/* Receipt Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg text-center">
        <div className="flex items-center justify-center mb-2">
          <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold">جامعة الأفق</h2>
        </div>
        <p className="text-blue-100">إيصال دفع رسوم</p>
      </div>

      {/* Receipt Body */}
      <div className="p-6">
        {/* Receipt Number and Date */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">رقم الإيصال</span>
            <span className="text-sm font-mono font-bold text-blue-600">{receiptData.receipt_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">تاريخ الدفع</span>
            <span className="text-sm text-gray-800">{new Date(receiptData.payment_date).toLocaleDateString('ar-LY')}</span>
          </div>
        </div>

        {/* Student Information */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">معلومات الطالب</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">الاسم</span>
              <span className="text-sm font-medium text-gray-800">{receiptData.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">رقم الطالب</span>
              <span className="text-sm font-medium text-gray-800">{receiptData.student_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">نوع الرسوم</span>
              <span className="text-sm font-medium text-gray-800">{receiptData.fee_type}</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">تفاصيل الدفع</h3>
          <div className="bg-green-50 rounded-lg p-4 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">المبلغ المدفوع</span>
              <span className="text-lg font-bold text-green-800">{receiptData.amount_paid.toLocaleString()} دينار</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">طريقة الدفع</span>
              <span className="text-sm font-medium text-gray-800">{receiptData.payment_method}</span>
            </div>
            {receiptData.reference_number && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">رقم المرجع</span>
                <span className="text-sm font-medium text-gray-800">{receiptData.reference_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Balance Summary */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">إجمالي الرسوم</span>
              <span className="text-sm font-medium text-gray-800">{receiptData.total_fee_amount.toLocaleString()} دينار</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">المبلغ المتبقي</span>
              <span className={`text-sm font-bold ${receiptData.remaining_balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {receiptData.remaining_balance.toLocaleString()} دينار
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="text-center mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            receiptData.remaining_balance === 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {receiptData.remaining_balance === 0 ? 'مدفوع بالكامل' : 'مدفوع جزئياً'}
          </span>
        </div>

        {/* Notes */}
        {receiptData.notes && (
          <div className="mb-6 bg-yellow-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">ملاحظات</h4>
            <p className="text-sm text-yellow-700">{receiptData.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          <p className="mb-1">شكراً لكم لثقتكم بنا</p>
          <p>تم إنشاء هذا الإيصال إلكترونياً</p>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة الإيصال
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              إغلاق
            </button>
          )}
        </div>
      )}
    </div>
  );
}
