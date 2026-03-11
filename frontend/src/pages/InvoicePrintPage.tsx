import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api-client';
import logoWithName from '../assets/Logo_with_name.png';
import { formatCurrency, formatDate } from '../lib/utils';

export default function InvoicePrintPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        
        // Fetch invoice with related data from Laravel API
        const invoiceData = await api.get(`/invoices/${invoiceId}`);
        
        if (!invoiceData) {
          setError('فاتورة غير موجودة');
          return;
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('خطأ في جلب البيانات');
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  // Auto-trigger print when component loads
  useEffect(() => {
    if (invoice) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.print();
        // Close the print window after printing
        setTimeout(() => {
          window.close();
        }, 1000);
      }, 500);
    }
  }, [invoice]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'معلقة';
      case 'overdue':
        return 'متأخرة';
      default:
        return 'غير محدد';
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>جاري تحميل الفاتورة...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>فاتورة غير موجودة</div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'white', 
      zIndex: 9999,
      overflow: 'auto'
    }}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: 'Arial', sans-serif;
          }
          
          .print-container {
            width: 100%;
            max-width: 180mm;
            margin: 0 auto;
            padding: 0;
            background: white;
            position: relative;
            left: 0;
            right: 0;
          }
          
          .print-content-wrapper {
            width: 100%;
            margin: 0 auto;
          }
        }
        
        @media screen {
          .print-container {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            max-width: 210mm;
          }
        }
        
        .print-container {
          font-family: 'Arial', sans-serif;
          color: #000;
          line-height: 1.4;
          background: white;
          margin: 0 auto;
        }
        
        .print-content-wrapper {
          text-align: right;
          direction: rtl;
          width: 100%;
        }

        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #000;
          padding-bottom: 20px;
        }

        .print-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }

        .print-subtitle {
          font-size: 18px;
          color: #333;
          margin-bottom: 5px;
        }

        .print-invoice-number {
          font-size: 20px;
          font-weight: bold;
          color: #000;
        }

        .print-status {
          display: inline-block;
          padding: 8px 16px;
          border: 2px solid #000;
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
        }

        .print-status.paid {
          background-color: #f0f0f0;
        }

        .print-status.pending {
          background-color: #fff8dc;
        }

        .print-status.overdue {
          background-color: #ffe4e1;
        }

        .print-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          width: 100%;
        }

        .print-section {
          margin-bottom: 25px;
        }

        .print-section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
        }

        .print-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .print-info-item {
          margin-bottom: 10px;
        }

        .print-info-label {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 3px;
        }

        .print-info-value {
          font-size: 14px;
          padding: 5px 0;
        }

        .print-items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .print-items-table th,
        .print-items-table td {
          border: 1px solid #000;
          padding: 12px 8px;
          text-align: center;
          font-size: 14px;
        }

        .print-items-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 16px;
        }

        .print-items-table tfoot {
          background-color: #f0f0f0;
          font-weight: bold;
        }

        .print-items-table tfoot td {
          font-size: 16px;
        }

        .print-total-section {
          margin-top: 30px;
          text-align: left;
        }

        .print-total {
          font-size: 24px;
          font-weight: bold;
          border-top: 3px solid #000;
          padding-top: 15px;
          margin-top: 20px;
        }

        .print-footer {
          margin-top: 50px;
          text-align: center;
          border-top: 1px solid #000;
          padding-top: 20px;
          font-size: 12px;
          color: #666;
        }

        .print-signature-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
        }

        .print-signature-box {
          text-align: center;
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 50px;
        }

        .print-signature-label {
          font-weight: bold;
          margin-bottom: 30px;
        }
      `}</style>

      <div className="print-container">
        <div className="print-content-wrapper">
          {/* Header */}
          <div className="print-header">
          <img src={logoWithName} alt="جامعة الخليل الأهلية" style={{ height: '50px', margin: '0 auto 8px', display: 'block' }} />
          <div className="print-title">فاتورة</div>
          <div className="print-subtitle">INVOICE</div>
          <div className="print-invoice-number">رقم الفاتورة: {invoice.invoice_number}</div>
          <div className={`print-status ${invoice.status}`}>
            {getStatusText(invoice.status)}
          </div>
        </div>

        {/* Main Content */}
        <div className="print-content">
          {/* Invoice Information */}
          <div className="print-section">
            <div className="print-section-title">معلومات الفاتورة</div>
            <div className="print-info-grid">
              <div className="print-info-item">
                <div className="print-info-label">رقم الفاتورة:</div>
                <div className="print-info-value">{invoice.invoice_number}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">تاريخ الإصدار:</div>
                <div className="print-info-value">{formatDate(invoice.invoice_date)}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">تاريخ الاستحقاق:</div>
                <div className="print-info-value">{formatDate(invoice.due_date)}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">الحالة:</div>
                <div className="print-info-value">{getStatusText(invoice.status)}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">الفصل الدراسي للتسجيل:</div>
                <div className="print-info-value">{invoice.semesters?.name || 'غير محدد'}</div>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="print-section">
            <div className="print-section-title">معلومات الطالب</div>
            <div className="print-info-grid">
              <div className="print-info-item">
                <div className="print-info-label">الاسم:</div>
                <div className="print-info-value">{invoice.students?.name || 'غير محدد'}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">رقم الهوية:</div>
                <div className="print-info-value">{invoice.students?.national_id_passport || 'غير محدد'}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">البريد الإلكتروني:</div>
                <div className="print-info-value">{invoice.students?.email || 'غير محدد'}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">القسم:</div>
                <div className="print-info-value">{invoice.departments?.name || 'غير محدد'}</div>
              </div>
              <div className="print-info-item">
                <div className="print-info-label">الفصل:</div>
                <div className="print-info-value">{invoice.semesters?.name || 'غير محدد'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="print-section">
          <div className="print-section-title">تفاصيل المواد</div>
          {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
            <table className="print-items-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>كود المادة</th>
                  <th style={{ width: '35%' }}>اسم المادة</th>
                  <th style={{ width: '15%' }}>الكمية</th>
                  <th style={{ width: '20%' }}>السعر</th>
                  <th style={{ width: '15%' }}>المجموع</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td>{item.subjects?.code || 'غير محدد'}</td>
                    <td style={{ textAlign: 'right' }}>{item.subjects?.name || 'مادة غير محددة'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    المجموع الكلي:
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    {formatCurrency(invoice.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              لا توجد مواد في هذه الفاتورة
            </div>
          )}
        </div>

        {/* Total Section */}
        <div className="print-total-section">
          <div className="print-total">
            المجموع الكلي: {formatCurrency(invoice.total_amount)}
          </div>
        </div>

        {/* Signature Section */}
        <div className="print-signature-section">
          <div className="print-signature-box">
            <div className="print-signature-label">توقيع الطالب</div>
            <div style={{ height: '40px', borderBottom: '1px solid #000' }}></div>
          </div>
          <div className="print-signature-box">
            <div className="print-signature-label">توقيع المسؤول المالي</div>
            <div style={{ height: '40px', borderBottom: '1px solid #000' }}></div>
          </div>
        </div>

          {/* Footer */}
          <div className="print-footer">
            <div>تم طباعة هذه الفاتورة في: {formatDate(new Date().toISOString())}</div>
            <div>جامعة الخليل الأهلية - University of Alkhalil</div>
            <div>هاتف: +964-XXX-XXX-XXXX | البريد الإلكتروني: info@university.edu</div>
          </div>
        </div>
      </div>
    </div>
  );
}
