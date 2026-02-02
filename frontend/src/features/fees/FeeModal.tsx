import React, { useEffect, useState, useMemo } from "react";
type FeeModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

interface Student {
  id: string;
  name: string;
  department_id?: string;
  year?: number;
  phone?: string;
  email?: string;
}

interface FeeType {
  id: number;
  code: string;
  name: string;
  description?: string;
}

interface PaymentPlan {
  id: number;
  code: string;
  name: string;
  installments_count?: number;
  description?: string;
}

interface FeeStructure {
  id: number;
  department_id?: string;
  fee_type_id: number;
  payment_plan_id: number;
  amount: number;
  academic_year: string;
}

interface FormData {
  student_id: string;
  fee_type_id: string;
  payment_plan_id: string;
  academic_year: string;
  amount: string;
  due_date: string;
  notes: string;
  immediate_payment: boolean;
  payment_method: string;
  reference_number: string;
}

export default function FeeModal({ open, onClose, onCreated }: FeeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    student_id: "",
    fee_type_id: "",
    payment_plan_id: "",
    academic_year: "2024/2025",
    amount: "",
    due_date: "",
    notes: "",
    immediate_payment: false,
    payment_method: "cash",
    reference_number: ""
  });

  // Load data when modal opens
  useEffect(() => {
    if (!open) return;
    loadInitialData();
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData({
        student_id: "",
        fee_type_id: "",
        payment_plan_id: "",
        academic_year: "2024/2025",
        amount: "",
        due_date: "",
        notes: "",
        immediate_payment: false,
        payment_method: "cash",
        reference_number: ""
      });
      setSelectedStudent(null);
      setSearchTerm("");
      setSearchResults([]);
      setIsSearching(false);
      setErrors({});
    }
  }, [open]);

  // Debounced search effect
  useEffect(() => {
    if (!open) return;
    
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        searchStudents(searchTerm.trim());
      } else {
        // Don't show any results when search term is empty
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, open]);

  const loadInitialData = async () => {
    try {
      const [feeTypesRes, paymentPlansRes, feeStructuresRes] = await Promise.all([
        supabase
          .from("fee_types")
          .select("id, code, name, description")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("payment_plans")
          .select("id, code, name, installments_count, description")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("fee_structure")
          .select("id, department_id, fee_type_id, payment_plan_id, amount, academic_year")
          .eq("is_active", true)
          .eq("academic_year", "2024/2025")
      ]);

      if (feeTypesRes.data) setFeeTypes(feeTypesRes.data);
      if (paymentPlansRes.data) setPaymentPlans(paymentPlansRes.data);
      if (feeStructuresRes.data) setFeeStructures(feeStructuresRes.data);

      // Load initial students (first 20 for dropdown)
      await loadInitialStudents();
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadInitialStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, department_id, year, phone, email")
        .eq("status", "active")
        .order("name")
        .limit(20);

      if (error) throw error;
      if (data) {
        setStudents(data);
        // Don't set search results initially - only show when user searches
      }
    } catch (error) {
      console.error("Error loading initial students:", error);
    }
  };

  const searchStudents = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, department_id, year, phone, email")
        .eq("status", "active")
        .or(`name.ilike.%${term}%,id.ilike.%${term}%`)
        .order("name")
        .limit(50);

      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching students:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Use search results for display
  const displayStudents = searchResults;

  // Get suggested amount based on fee structure
  const suggestedAmount = useMemo(() => {
    if (!selectedStudent || !formData.fee_type_id || !formData.payment_plan_id) return null;
    
    const structure = feeStructures.find(fs =>
      fs.department_id === selectedStudent.department_id &&
      fs.fee_type_id === parseInt(formData.fee_type_id) &&
      fs.payment_plan_id === parseInt(formData.payment_plan_id) &&
      fs.academic_year === formData.academic_year
    );

    return structure?.amount || null;
  }, [selectedStudent, formData.fee_type_id, formData.payment_plan_id, formData.academic_year, feeStructures]);

  // Update amount when suggested amount changes
  useEffect(() => {
    if (suggestedAmount && !formData.amount) {
      setFormData(prev => ({ ...prev, amount: suggestedAmount.toString() }));
    }
  }, [suggestedAmount, formData.amount]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.student_id) newErrors.student_id = "???? ?????? ??????";
    } else if (step === 2) {
      if (!formData.fee_type_id) newErrors.fee_type_id = "???? ?????? ??? ??????";
      if (!formData.payment_plan_id) newErrors.payment_plan_id = "???? ?????? ??? ?????";
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = "???? ????? ???? ????";
      }
      if (!formData.due_date) newErrors.due_date = "???? ????? ????? ?????????";
    } else if (step === 3 && formData.immediate_payment) {
      if (!formData.payment_method) newErrors.payment_method = "???? ?????? ????? ?????";
      if (formData.payment_method !== "cash" && !formData.reference_number) {
        newErrors.reference_number = "???? ????? ??? ??????";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RCT-${timestamp}-${random}`.toUpperCase();
  };

  const generateInstallments = async (feeId: number, totalAmount: number, planId: number) => {
    const plan = paymentPlans.find(p => p.id === planId);
    if (!plan?.installments_count || plan.installments_count <= 1) return;

    const installmentAmount = totalAmount / plan.installments_count;
    const dueDate = new Date(formData.due_date);
    
    const installments = [];
    for (let i = 1; i <= plan.installments_count; i++) {
      const installmentDueDate = new Date(dueDate);
      installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
      
      installments.push({
        fee_id: feeId,
        installment_number: i,
        amount: installmentAmount,
        due_date: installmentDueDate.toISOString().split('T')[0],
        status: 'pending'
      });
    }

    const { error } = await supabase
      .from("fee_installments")
      .insert(installments);

    if (error) throw error;
    return installments;
  };

  const processPayment = async (feeId: number, amount: number) => {
    const receiptNumber = generateReceiptNumber();
    const paymentData = {
      fee_id: feeId,
      amount: amount,
      payment_method: formData.payment_method,
      payment_date: new Date().toISOString(),
      receipt_number: receiptNumber,
      reference_number: formData.reference_number || null,
      notes: formData.notes || null
    };

    const { data: payment, error: paymentError } = await supabase
      .from("fee_payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update fee status to paid
    const { error: updateError } = await supabase
      .from("fees")
      .update({
        status: 'paid',
        paid_amount: amount,
        paid_date: new Date().toISOString(),
        receipt_no: receiptNumber
      })
      .eq('id', feeId);

    if (updateError) throw updateError;

    return payment;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      
      // Create the fee record
      const feeData = {
        student_id: formData.student_id,
        amount: amount,
        status: formData.immediate_payment ? 'paid' : 'unpaid',
        academic_year: formData.academic_year,
        payment_plan_id: parseInt(formData.payment_plan_id),
        type: formData.fee_type_id,
        fee_type_id: parseInt(formData.fee_type_id),
        due_date: formData.due_date,
        payment_notes: formData.notes || null,
        paid_amount: formData.immediate_payment ? amount : 0,
        paid_date: formData.immediate_payment ? new Date().toISOString() : null,
        receipt_no: formData.immediate_payment ? generateReceiptNumber() : null
      };

      const { data: fee, error: feeError } = await supabase
        .from("fees")
        .insert(feeData)
        .select()
        .single();

      if (feeError) throw feeError;

      // Generate installments if payment plan requires it
      if (!formData.immediate_payment) {
        await generateInstallments(fee.id, amount, parseInt(formData.payment_plan_id));
      }

      // Process immediate payment if selected
      if (formData.immediate_payment) {
        await processPayment(fee.id, amount);
      }

      // Show success message and close modal
      alert(`?? ${formData.immediate_payment ? '????? ?????? ?????? ?????' : '????? ??????'} ?????!`);
      onCreated?.();
      onClose();
    } catch (error) {
      console.error("Error creating fee:", error);
      alert("??? ??? ????? ????? ??????. ???? ???????? ??? ????.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">????? ???? ?????</h3>
                <p className="text-sm text-gray-500">????? ???? ?????? ????? ?? ??????? ????? ??????</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4 space-x-reverse">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        currentStep >= step
                          ? 'bg-yellow-600 border-yellow-600 text-white'
                          : 'border-gray-300 text-gray-500'
                      }`}
                    >
                      {currentStep > step ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step
                      )}
                    </div>
                    <div className={`mr-2 text-sm font-medium ${currentStep >= step ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {step === 1 && '?????? ??????'}
                      {step === 2 && '?????? ??????'}
                      {step === 3 && '???????? ??????'}
                    </div>
                    {step < 3 && <div className="w-16 h-0.5 bg-gray-300 mx-4" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Student Selection */}
            {currentStep === 1 && (
        <div>
                <h4 className="text-lg font-medium text-gray-900 mb-6">?????? ??????</h4>
                
                <div className="mb-6">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-3">
                    ????? ?? ?????? <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="search"
                      className="block w-full pr-12 pl-4 py-3 text-lg rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                      placeholder="???? ?????? ?? ??? ??????..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-900"></div>
                      ) : (
                        <i className="fas fa-search text-gray-400 text-lg"></i>
                      )}
                    </div>
                  </div>
                  {!searchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                      ???? ?????? ??? ?????? ?? ???? ?????
                    </p>
                  )}
                  
                  {/* Search Results List */}
                  {searchTerm && (
                    <div className="mt-3">
                      {isSearching ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-600">???? ?????...</div>
                        </div>
                      ) : displayStudents.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto">
                          <div className="py-2">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                ??????? ({displayStudents.length})
                              </div>
                            </div>
                            {displayStudents.map((student) => (
                              <button
                                key={student.id}
                                type="button"
                                className={`w-full px-4 py-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                                  formData.student_id === student.id ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                                onClick={() => {
                                  handleInputChange('student_id', student.id);
                                  setSelectedStudent(student);
                                  setSearchTerm(""); // Clear search term after selection
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-xs text-gray-500">??? ??????: {student.id}</div>
                                  </div>
                                  {formData.student_id === student.id && (
                                    <div className="flex-shrink-0">
                                      <i className="fas fa-check text-blue-600"></i>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-600">?? ??? ?????? ??? ?????</div>
                          <div className="text-xs text-gray-500 mt-1">??? ????? ???? ????? ?? ??? ??????</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {errors.student_id && <p className="mt-2 text-sm text-red-600">{errors.student_id}</p>}
                </div>

                {selectedStudent && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-800 mb-2">??????? ?????? ???????</h5>
                    <div className="text-sm text-gray-700">
                      <p><strong>?????:</strong> {selectedStudent.name}</p>
                      <p><strong>??? ??????:</strong> {selectedStudent.id}</p>
                      {selectedStudent.year && <p><strong>????? ????????:</strong> ????? {selectedStudent.year}</p>}
                      {selectedStudent.phone && <p><strong>??????:</strong> {selectedStudent.phone}</p>}
                      {selectedStudent.email && <p><strong>?????? ??????????:</strong> {selectedStudent.email}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Fee Details */}
            {currentStep === 2 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-6">?????? ??????</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
                    <label htmlFor="fee_type" className="block text-sm font-medium text-gray-700 mb-2">
                      ??? ?????? <span className="text-red-500">*</span>
            </label>
            <select
                      id="fee_type"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm ${
                        errors.fee_type_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      value={formData.fee_type_id}
                      onChange={(e) => handleInputChange('fee_type_id', e.target.value)}
                    >
                      <option value="">???? ??? ??????</option>
                      {feeTypes.map((type) => (
                        <option key={type.id} value={type.id.toString()}>
                          {type.name}
                </option>
              ))}
            </select>
                    {errors.fee_type_id && <p className="mt-2 text-sm text-red-600">{errors.fee_type_id}</p>}
          </div>

          <div>
                    <label htmlFor="payment_plan" className="block text-sm font-medium text-gray-700 mb-2">
                      ??? ????? <span className="text-red-500">*</span>
            </label>
            <select
                      id="payment_plan"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm ${
                        errors.payment_plan_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      value={formData.payment_plan_id}
                      onChange={(e) => handleInputChange('payment_plan_id', e.target.value)}
                    >
                      <option value="">???? ??? ?????</option>
                      {paymentPlans.map((plan) => (
                        <option key={plan.id} value={plan.id.toString()}>
                          {plan.name}
                </option>
              ))}
            </select>
                    {errors.payment_plan_id && <p className="mt-2 text-sm text-red-600">{errors.payment_plan_id}</p>}
          </div>

          <div>
                    <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
              ????? ????????
            </label>
            <select
                      id="academic_year"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                      value={formData.academic_year}
                      onChange={(e) => handleInputChange('academic_year', e.target.value)}
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
                      <option value="2025/2026">2025/2026</option>
            </select>
          </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                      ????? ????????? <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm ${
                        errors.due_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      value={formData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                    />
                    {errors.due_date && <p className="mt-2 text-sm text-red-600">{errors.due_date}</p>}
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    ?????? (????? ????) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      min="0"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm ${
                        errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                    />
                    {suggestedAmount && (
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <button
                          type="button"
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-2"
                          onClick={() => handleInputChange('amount', suggestedAmount.toString())}
                        >
                          ???????: {suggestedAmount.toLocaleString()}
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount}</p>}
                  {suggestedAmount && (
                    <p className="mt-1 text-sm text-gray-500">
                      ?????? ??????? ??? ???? ??????: {suggestedAmount.toLocaleString()} ?????
                    </p>
                  )}
        </div>

        <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    ??????? ??????
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                    placeholder="??? ?? ??????? ??????..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review and Payment */}
            {currentStep === 3 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-6">?????? ???????? ??????</h4>
                
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h5 className="text-md font-medium text-gray-900 mb-4">???? ??????</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>??????:</strong> {selectedStudent?.name}</p>
                      <p><strong>??? ??????:</strong> {selectedStudent?.id}</p>
                      <p><strong>??? ??????:</strong> {feeTypes.find(t => t.id.toString() === formData.fee_type_id)?.name}</p>
                    </div>
                    <div>
                      <p><strong>??? ?????:</strong> {paymentPlans.find(p => p.id.toString() === formData.payment_plan_id)?.name}</p>
                      <p><strong>????? ????????:</strong> {formData.academic_year}</p>
                      <p><strong>????? ?????????:</strong> {new Date(formData.due_date).toLocaleDateString('ar-LY')}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-lg font-semibold text-gray-900">
                      ?????? ??????: {parseFloat(formData.amount || '0').toLocaleString()} ????? ????
                    </p>
                  </div>
                </div>

                {/* Immediate Payment Option */}
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      id="immediate_payment"
                      type="checkbox"
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      checked={formData.immediate_payment}
                      onChange={(e) => handleInputChange('immediate_payment', e.target.checked)}
                    />
                    <label htmlFor="immediate_payment" className="mr-2 block text-sm text-gray-900">
                      ????? ??? ???? ??????
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    ???? ??? ?????? ??? ??? ?????? ????? ?????? ????
                  </p>
                </div>

                {/* Payment Details (shown only if immediate payment is selected) */}
                {formData.immediate_payment && (
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h5 className="text-md font-medium text-blue-900 mb-4">?????? ?????</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    </div>

                    <div className="bg-blue-100 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="mr-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            ??????? ????
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>• ???? ????? ????? ??? ????????</p>
                            <p>• ???? ????? ???? ?????? ??? "?????"</p>
                            <p>• ???? ????? ??????? ?? ???? ??????</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
          <button
                type="button"
                className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={submitting}
          >
            ?????
          </button>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:opacity-50"
                  onClick={handlePrevious}
                  disabled={submitting}
                >
                  ??????
                </button>
              )}
            </div>

            <div>
              {currentStep < 3 ? (
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                  onClick={handleNext}
                >
                  ??????
                </button>
              ) : (
          <button
                  type="button"
                  className="inline-flex justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:opacity-50"
                  onClick={handleSubmit}
            disabled={submitting}
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
                    formData.immediate_payment ? "????? ?????? ?????? ?????" : "????? ??????"
                  )}
          </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}