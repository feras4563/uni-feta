import React, { useState, useEffect } from "react";
type PaymentModalProps = {
  open: boolean;
  onClose: () => void;
  fee: any | null;
  onPaid?: () => void;
};

interface PaymentForm {
  amount: string;
  payment_method: string;
  reference_number: string;
  notes: string;
}

interface Receipt {
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
}

export default function PaymentModal({ open, onClose, fee, onPaid }: PaymentModalProps) {
  const [formData, setFormData] = useState<PaymentForm>({
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && fee) {
      const remainingAmount = (fee.amount || 0) - (fee.paid_amount || 0);
      setFormData({
        amount: remainingAmount > 0 ? remainingAmount.toString() : "",
        payment_method: "cash",
        reference_number: "",
        notes: ""
      });
      setErrors({});
      setShowReceipt(false);
      setReceiptData(null);
    }
  }, [open, fee]);

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RCT-${timestamp}-${random}`.toUpperCase();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "???? ????? ???? ????";
    }

    const remainingAmount = (fee?.amount || 0) - (fee?.paid_amount || 0);
    if (parseFloat(formData.amount) > remainingAmount) {
      newErrors.amount = `?????? ?????? ?????? ??????? (${remainingAmount.toLocaleString()} ?????)`;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = "???? ?????? ????? ?????";
    }

    if (formData.payment_method !== "cash" && !formData.reference_number.trim()) {
      newErrors.reference_number = "???? ????? ??? ??????";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !fee) return;

    setSubmitting(true);
    try {
      const paymentAmount = parseFloat(formData.amount);
      const receiptNumber = generateReceiptNumber();
      const paymentDate = new Date().toISOString();

      // Create payment record
      const paymentData = {
        fee_id: fee.id,
        amount: paymentAmount,
        payment_method: formData.payment_method,
        payment_date: paymentDate,
        receipt_number: receiptNumber,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null
      };

      const { error: paymentError } = await supabase
        .from("fee_payments")
        .insert(paymentData);

      if (paymentError) throw paymentError;

      // Update fee record
      const newPaidAmount = (fee.paid_amount || 0) + paymentAmount;
      const totalAmount = fee.amount || 0;
      const newStatus = newPaidAmount >= totalAmount ? 'paid' : 
                       newPaidAmount > 0 ? 'partial' : 'unpaid';

      const { error: updateError } = await supabase
        .from("fees")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_date: newStatus === 'paid' ? paymentDate : fee.paid_date,
          receipt_no: newStatus === 'paid' ? receiptNumber : fee.receipt_no
        })
        .eq('id', fee.id);

      if (updateError) throw updateError;

      // Update installments if applicable
      if (fee.payment_plan_id) {
        await updateInstallments(fee.id, paymentAmount);
      }

      // Prepare receipt data
      const receipt: Receipt = {
        receipt_number: receiptNumber,
        payment_date: new Date(paymentDate).toLocaleString('ar-LY'),
        student_name: fee.student?.name || "??? ????",
        student_id: fee.student_id || "",
        fee_type: fee.fee_type?.name || "???? ??????",
        amount_paid: paymentAmount,
        payment_method: getPaymentMethodLabel(formData.payment_method),
        reference_number: formData.reference_number || undefined,
        remaining_balance: totalAmount - newPaidAmount,
        total_fee_amount: totalAmount
      };

      setReceiptData(receipt);
      setShowReceipt(true);
      onPaid?.();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("??? ??? ????? ?????? ?????. ???? ???????? ??? ????.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateInstallments = async (feeId: number, paymentAmount: number) => {
    // Get pending installments ordered by due date
    const { data: installments, error } = await supabase
      .from("fee_installments")
      .select("*")
      .eq("fee_id", feeId)
      .in("status", ["pending", "partial"])
      .order("due_date");

    if (error || !installments) return;

    let remainingAmount = paymentAmount;
    
    for (const installment of installments) {
      if (remainingAmount <= 0) break;

      const installmentBalance = installment.amount - (installment.paid_amount || 0);
      const paymentForInstallment = Math.min(remainingAmount, installmentBalance);
      
      const newPaidAmount = (installment.paid_amount || 0) + paymentForInstallment;
      const newStatus = newPaidAmount >= installment.amount ? 'paid' : 'partial';

      await supabase
        .from("fee_installments")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_date: newStatus === 'paid' ? new Date().toISOString() : installment.paid_date
        })
        .eq('id', installment.id);

      remainingAmount -= paymentForInstallment;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: "????",
      bank_transfer: "????? ?????",
      credit_card: "????? ??????",
      check: "???"
    };
    return labels[method as keyof typeof labels] || method;
  };

  const handlePrintReceipt = () => {
    if (!receiptData) return;

    const printContent = `
      <div style="max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; direction: rtl;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">????? ?????</h1>
          <h2 style="margin: 5px 0; color: #666;">????? ??? ????</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>??? ???????:</strong> ${receiptData.receipt_number}</p>
          <p><strong>????? ?????:</strong> ${receiptData.payment_date}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>??? ??????:</strong> ${receiptData.student_name}</p>
          <p><strong>??? ??????:</strong> ${receiptData.student_id}</p>
          <p><strong>??? ??????:</strong> ${receiptData.fee_type}</p>
        </div>
        
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px;">
          <p><strong>?????? ???????:</strong> ${receiptData.amount_paid.toLocaleString()} ????? ????</p>
          <p><strong>????? ?????:</strong> ${receiptData.payment_method}</p>
          ${receiptData.reference_number ? `<p><strong>??? ??????:</strong> ${receiptData.reference_number}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>?????? ??????:</strong> ${receiptData.total_fee_amount.toLocaleString()} ?????</p>
          <p><strong>?????? ???????:</strong> ${receiptData.remaining_balance.toLocaleString()} ?????</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
          <p>????? ??? ?????? ???</p>
          <p>?? ????? ??? ??????? ??????????</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>????? ??? - ${receiptData.receipt_number}</title>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const remainingAmount = fee ? (fee.amount || 0) - (fee.paid_amount || 0) : 0;

  if (!open) return null;

  if (showReceipt && receiptData) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
            {/* Success Header */}
            <div className="flex items-center justify-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">?? ????? ????? ?????!</h3>
              <p className="text-sm text-gray-500">?? ????? ????? ?????</p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">??? ???????:</span>
                  <span className="text-green-600 font-mono">{receiptData.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">?????? ???????:</span>
                  <span className="font-semibold">{receiptData.amount_paid.toLocaleString()} ?????</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">?????? ???????:</span>
                  <span className={`font-semibold ${receiptData.remaining_balance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {receiptData.remaining_balance.toLocaleString()} ?????
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">????? ?????:</span>
                  <span>{receiptData.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                onClick={handlePrintReceipt}
              >
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.32 0H6.34m11.32 0l.229-2.523z" />
                </svg>
                ????? ???????
              </button>
              
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setShowReceipt(false);
                  onClose();
                }}
              >
                ?????
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">????? ???</h3>
                <p className="text-sm text-gray-500">?????? ???? ????? ??????</p>
              </div>
            </div>
          </div>

          {/* Fee Information */}
          {fee && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-blue-900 mb-3">??????? ??????</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>??? ??????:</span>
                  <span className="font-medium">#{fee.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>??????:</span>
                  <span className="font-medium">{fee.student?.name || "??? ????"}</span>
                </div>
                <div className="flex justify-between">
                  <span>?????? ??????:</span>
                  <span className="font-medium">{(fee.amount || 0).toLocaleString()} ?????</span>
                </div>
                <div className="flex justify-between">
                  <span>?????? ???????:</span>
                  <span className="font-medium">{(fee.paid_amount || 0).toLocaleString()} ?????</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                  <span className="font-medium">?????? ???????:</span>
                  <span className="font-bold text-blue-900">{remainingAmount.toLocaleString()} ?????</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                ???? ????? (????? ????) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                />
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 px-3 flex items-center text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => handleInputChange('amount', remainingAmount.toString())}
                  >
                    ??????
                  </button>
                )}
              </div>
              {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount}</p>}
              <p className="mt-1 text-sm text-gray-500">
                ???? ??????: {remainingAmount.toLocaleString()} ?????
              </p>
            </div>

            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                ????? ????? <span className="text-red-500">*</span>
              </label>
              <select
                id="payment_method"
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.payment_method ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
              >
                <option value="cash">????</option>
                <option value="bank_transfer">????? ?????</option>
                <option value="credit_card">????? ??????</option>
                <option value="check">???</option>
              </select>
              {errors.payment_method && <p className="mt-2 text-sm text-red-600">{errors.payment_method}</p>}
            </div>

            {formData.payment_method !== 'cash' && (
              <div>
                <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-2">
                  ??? ??????/??????? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="reference_number"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.reference_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="???? ??? ??????"
                  value={formData.reference_number}
                  onChange={(e) => handleInputChange('reference_number', e.target.value)}
                />
                {errors.reference_number && <p className="mt-2 text-sm text-red-600">{errors.reference_number}</p>}
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                ??????? ??????
              </label>
              <textarea
                id="notes"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="??? ?? ??????? ??????..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              onClick={onClose}
              disabled={submitting}
            >
              ?????
            </button>

            <button
              type="button"
              className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={submitting || !formData.amount || parseFloat(formData.amount) <= 0}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ???? ????????...
                </>
              ) : (
                "????? ?????"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}