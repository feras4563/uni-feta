<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentInvoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeeController extends Controller
{
    /**
     * Display a listing of fees (student invoices)
     */
    public function index(Request $request)
    {
        $query = StudentInvoice::with([
            'student:id,name,email,campus_id',
            'semester:id,name',
            'studyYear:id,name',
            'department:id,name',
        ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by student
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        // Filter by semester
        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Search by student name or invoice number
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('student', function($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Order by
        $orderBy = $request->get('order_by', 'invoice_date');
        $orderDir = $request->get('order_dir', 'desc');
        $query->orderBy($orderBy, $orderDir);

        return response()->json($query->get());
    }

    /**
     * Display the specified fee
     */
    public function show($id)
    {
        $invoice = StudentInvoice::with([
            'student',
            'semester',
            'studyYear',
            'department',
            'items.subject',
            'journalEntry.lines.account'
        ])->findOrFail($id);

        return response()->json($invoice);
    }

    /**
     * Record payment for an invoice
     */
    public function recordPayment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'allow_attendance' => 'nullable|boolean', // Admin can override attendance permission
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $invoice = StudentInvoice::findOrFail($id);
        $paymentAmount = $request->amount;
        
        // Validate payment amount
        $newPaidAmount = $invoice->paid_amount + $paymentAmount;
        if ($newPaidAmount > $invoice->total_amount) {
            return response()->json([
                'message' => 'Invalid payment amount',
                'error' => 'المبلغ المدفوع يتجاوز رصيد الفاتورة'
            ], 422);
        }

        // Update invoice
        $invoice->paid_amount = $newPaidAmount;
        $invoice->balance = $invoice->total_amount - $newPaidAmount;
        
        // Update status
        if ($invoice->balance == 0) {
            $invoice->status = 'paid';
        } elseif ($invoice->paid_amount > 0) {
            $invoice->status = 'partial';
        }
        
        $invoice->save();

        // Handle admin override for attendance permission
        if ($request->has('allow_attendance')) {
            $this->updateAttendancePermission($invoice, $request->boolean('allow_attendance'));
        }

        // Create journal entry for payment
        $this->createPaymentJournalEntry($invoice, $paymentAmount, $request);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'invoice' => $invoice->fresh(['student', 'semester', 'studyYear', 'department'])
        ]);
    }

    /**
     * Update attendance permission for enrollments (admin override)
     */
    protected function updateAttendancePermission($invoice, $allowAttendance)
    {
        \App\Models\StudentSubjectEnrollment::where('student_id', $invoice->student_id)
            ->where('semester_id', $invoice->semester_id)
            ->where('study_year_id', $invoice->study_year_id)
            ->update([
                'attendance_allowed' => $allowAttendance,
                'admin_override' => true,
            ]);
    }

    /**
     * Toggle attendance permission for a student's enrollments
     */
    public function toggleAttendance(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'allow_attendance' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $invoice = StudentInvoice::findOrFail($id);
        $this->updateAttendancePermission($invoice, $request->boolean('allow_attendance'));

        return response()->json([
            'message' => 'Attendance permission updated successfully',
            'invoice' => $invoice->fresh(['student', 'semester', 'studyYear', 'department'])
        ]);
    }

    /**
     * Create journal entry for payment
     */
    protected function createPaymentJournalEntry($invoice, $amount, $request)
    {
        // Get default accounts
        $receivableAccount = \App\Models\AccountDefault::where('category', 'accounts_receivable')->first();
        $cashAccount = \App\Models\AccountDefault::where('category', 'cash')->first();
        
        if (!$cashAccount) {
            // If no cash account configured, skip journal entry
            return;
        }

        $journalEntry = \App\Models\JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => $invoice->invoice_number . '-PAY',
            'entry_date' => $request->payment_date ?? now(),
            'posting_date' => now(),
            'notes' => 'دفعة من الطالب: ' . $invoice->student->name . ' - ' . ($request->notes ?? ''),
            'status' => 'posted',
            'total_debit' => $amount,
            'total_credit' => $amount,
            'posted_at' => now(),
        ]);

        // Debit: Cash (or Bank)
        \App\Models\JournalEntryLine::create([
            'journal_entry_id' => $journalEntry->id,
            'account_id' => $cashAccount->account_id,
            'debit' => $amount,
            'credit' => 0,
            'description' => 'دفعة من الطالب - ' . $invoice->student->name,
            'line_number' => 1,
        ]);

        // Credit: Accounts Receivable
        \App\Models\JournalEntryLine::create([
            'journal_entry_id' => $journalEntry->id,
            'account_id' => $receivableAccount->account_id,
            'debit' => 0,
            'credit' => $amount,
            'description' => 'تخفيض المستحقات - ' . $invoice->student->name,
            'line_number' => 2,
        ]);
    }

    /**
     * Get fee statistics
     */
    public function statistics(Request $request)
    {
        $query = StudentInvoice::query();

        // Filter by semester if provided
        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        // Filter by department if provided
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $total = $query->sum('total_amount');
        $paid = $query->sum('paid_amount');
        $balance = $total - $paid;
        
        $pendingCount = (clone $query)->where('status', 'pending')->count();
        $partialCount = (clone $query)->where('status', 'partial')->count();
        $paidCount = (clone $query)->where('status', 'paid')->count();
        $overdueCount = (clone $query)->where('status', 'overdue')->count();

        return response()->json([
            'total_amount' => $total,
            'paid_amount' => $paid,
            'balance' => $balance,
            'pending_count' => $pendingCount,
            'partial_count' => $partialCount,
            'paid_count' => $paidCount,
            'overdue_count' => $overdueCount,
        ]);
    }
}
