<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentInvoice;
use Illuminate\Http\Request;

class StudentInvoiceController extends Controller
{
    /**
     * Get all invoices
     */
    public function index(Request $request)
    {
        $query = StudentInvoice::with([
            'student:id,name,email',
            'semester:id,name',
            'studyYear:id,name',
            'department:id,name',
            'items.subject:id,name,code'
        ]);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        $invoices = $query->orderBy('invoice_date', 'desc')->get();

        return response()->json($invoices);
    }

    /**
     * Get basic invoices list
     */
    public function basic(Request $request)
    {
        $query = StudentInvoice::with([
            'student:id,name',
            'semester:id,name'
        ])->select('id', 'invoice_number', 'student_id', 'semester_id', 'invoice_date', 'total_amount', 'balance', 'status');

        $invoices = $query->orderBy('invoice_date', 'desc')->get();

        return response()->json($invoices);
    }

    /**
     * Get invoice statistics
     */
    public function statistics()
    {
        $stats = [
            'total_invoices' => StudentInvoice::count(),
            'pending' => StudentInvoice::where('status', 'pending')->count(),
            'paid' => StudentInvoice::where('status', 'paid')->count(),
            'partial' => StudentInvoice::where('status', 'partial')->count(),
            'overdue' => StudentInvoice::where('status', 'overdue')->count(),
            'total_amount' => StudentInvoice::sum('total_amount'),
            'total_paid' => StudentInvoice::sum('paid_amount'),
            'total_balance' => StudentInvoice::sum('balance'),
        ];

        return response()->json($stats);
    }

    /**
     * Get single invoice
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
     * Get invoices for a specific student
     */
    public function byStudent($studentId)
    {
        $invoices = StudentInvoice::with([
            'semester:id,name',
            'studyYear:id,name',
            'items.subject:id,name,code'
        ])
        ->where('student_id', $studentId)
        ->orderBy('invoice_date', 'desc')
        ->get();

        return response()->json($invoices);
    }

    /**
     * Update invoice status
     */
    public function updateStatus(Request $request, $id)
    {
        $invoice = StudentInvoice::findOrFail($id);
        
        $invoice->update([
            'status' => $request->status,
        ]);

        return response()->json($invoice);
    }
}
