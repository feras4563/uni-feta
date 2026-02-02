<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentSemesterRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    /**
     * Display a listing of students
     */
    public function index(Request $request)
    {
        $query = Student::with('department:id,name,name_en');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('national_id_passport', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        // Order by
        $orderBy = $request->get('order_by', 'created_at');
        $orderDir = $request->get('order_dir', 'desc');
        $query->orderBy($orderBy, $orderDir);

        // Pagination
        $perPage = $request->get('per_page', 15);
        
        if ($request->has('paginate') && $request->paginate === 'false') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * Store a newly created student
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'required|email|unique:students,email',
            'national_id_passport' => 'required|string|unique:students,national_id_passport',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'year' => 'nullable|integer|min:1|max:10',
            'status' => 'nullable|in:active,inactive,graduated,suspended',
            'gender' => 'nullable|in:male,female',
            'nationality' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'enrollment_date' => 'nullable|date',
            'sponsor_name' => 'nullable|string|max:255',
            'sponsor_contact' => 'nullable|string|max:255',
            'academic_history' => 'nullable|string',
            'academic_score' => 'nullable|numeric|min:0|max:100',
            'transcript_file' => 'nullable|string',
            'qr_code' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Generate unique student ID
        $year = date('y'); // Last 2 digits of year
        $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        $studentId = "ST{$year}{$random}";
        
        // Ensure uniqueness
        while (Student::where('id', $studentId)->exists()) {
            $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            $studentId = "ST{$year}{$random}";
        }

        $data = $request->all();
        $data['id'] = $studentId;

        $student = Student::create($data);
        $student->load('department:id,name,name_en');

        return response()->json($student, 201);
    }

    /**
     * Display the specified student
     */
    public function show($id)
    {
        $student = Student::with([
            'department:id,name,name_en',
            'semesterRegistrations.semester',
            'semesterRegistrations.studyYear',
            'grades.subject',
            'grades.teacher',
            'attendanceRecords.session',
            'academicProgress'
        ])->findOrFail($id);

        return response()->json($student);
    }

    /**
     * Update the specified student
     */
    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'sometimes|required|email|unique:students,email,' . $id,
            'national_id_passport' => 'sometimes|required|string|unique:students,national_id_passport,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'year' => 'nullable|integer|min:1|max:10',
            'status' => 'nullable|in:active,inactive,graduated,suspended',
            'gender' => 'nullable|in:male,female',
            'nationality' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'enrollment_date' => 'nullable|date',
            'sponsor_name' => 'nullable|string|max:255',
            'sponsor_contact' => 'nullable|string|max:255',
            'academic_history' => 'nullable|string',
            'academic_score' => 'nullable|numeric|min:0|max:100',
            'transcript_file' => 'nullable|string',
            'qr_code' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $student->update($request->all());
        $student->load('department:id,name,name_en');

        return response()->json($student);
    }

    /**
     * Remove the specified student
     */
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json(['message' => 'Student deleted successfully'], 200);
    }

    /**
     * Get students count by department
     */
    public function countByDepartment()
    {
        $counts = Student::selectRaw('department_id, count(*) as count')
            ->groupBy('department_id')
            ->with('department:id,name')
            ->get();

        return response()->json($counts);
    }

    /**
     * Get students statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => Student::count(),
            'active' => Student::where('status', 'active')->count(),
            'inactive' => Student::where('status', 'inactive')->count(),
            'graduated' => Student::where('status', 'graduated')->count(),
            'suspended' => Student::where('status', 'suspended')->count(),
            'by_year' => Student::selectRaw('year, count(*) as count')
                ->groupBy('year')
                ->orderBy('year')
                ->get(),
            'by_department' => Student::selectRaw('department_id, count(*) as count')
                ->groupBy('department_id')
                ->with('department:id,name')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Get enrollments for a specific student
     */
    public function enrollments($id)
    {
        $enrollments = StudentSemesterRegistration::with([
            'semester',
            'studyYear',
            'department',
            'group'
        ])
        ->where('student_id', $id)
        ->orderBy('registration_date', 'desc')
        ->get();

        return response()->json($enrollments);
    }

    /**
     * Enroll student in subjects
     */
    public function enrollInSubjects(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
            'semester_id' => 'required|exists:semesters,id',
            'study_year_id' => 'required|exists:study_years,id',
            'department_id' => 'required|exists:departments,id',
            'semester_number' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $student = Student::findOrFail($id);
        
        // Check if default accounts are configured before proceeding
        $studentReceivableAccount = \App\Models\AccountDefault::where('category', 'accounts_receivable')->first();
        $tuitionRevenueAccount = \App\Models\AccountDefault::where('category', 'sales_revenue')->first();
        
        if (!$studentReceivableAccount || !$tuitionRevenueAccount) {
            return response()->json([
                'message' => 'يجب تحديد الحسابات الافتراضية أولاً',
                'error' => 'الرجاء تحديد حساب العملاء (المدينون) وحساب الإيرادات - المبيعات في إعدادات الحسابات الافتراضية قبل تسجيل الطلاب'
            ], 400);
        }
        
        // Find or create student group for this department and semester
        $groupName = 'المجموعة ' . $request->semester_number;
        $studentGroup = \App\Models\StudentGroup::firstOrCreate(
            [
                'department_id' => $request->department_id,
                'semester_id' => $request->semester_id,
                'semester_number' => $request->semester_number,
            ],
            [
                'group_name' => $groupName,
                'max_students' => 30,
                'current_students' => 0,
                'is_active' => true,
                'description' => 'مجموعة تم إنشاؤها تلقائياً للفصل الدراسي ' . $request->semester_number,
            ]
        );
        
        // Create or update semester registration with group assignment
        $semesterRegistration = \App\Models\StudentSemesterRegistration::updateOrCreate(
            [
                'student_id' => $id,
                'semester_id' => $request->semester_id,
            ],
            [
                'study_year_id' => $request->study_year_id,
                'department_id' => $request->department_id,
                'group_id' => $studentGroup->id,
                'semester_number' => $request->semester_number,
                'registration_date' => now(),
                'status' => 'active',
            ]
        );
        
        // Update group student count
        $studentGroup->current_students = \App\Models\StudentSemesterRegistration::where('group_id', $studentGroup->id)->count();
        $studentGroup->save();
        
        $enrollments = [];
        $subjects = [];

        foreach ($request->subject_ids as $subjectId) {
            // Check if already enrolled
            $existing = \App\Models\StudentSubjectEnrollment::where([
                'student_id' => $id,
                'subject_id' => $subjectId,
                'semester_id' => $request->semester_id,
            ])->first();

            if (!$existing) {
                $enrollment = \App\Models\StudentSubjectEnrollment::create([
                    'student_id' => $id,
                    'subject_id' => $subjectId,
                    'semester_id' => $request->semester_id,
                    'study_year_id' => $request->study_year_id,
                    'department_id' => $request->department_id,
                    'semester_number' => $request->semester_number,
                    'enrollment_date' => now(),
                    'status' => 'enrolled',
                ]);
                $enrollments[] = $enrollment;
                
                // Load subject for invoice
                $subject = \App\Models\Subject::find($subjectId);
                if ($subject) {
                    $subjects[] = $subject;
                }
            }
        }

        // Create invoice and journal entry if there are new enrollments
        $invoice = null;
        $journalEntry = null;
        
        if (count($enrollments) > 0) {
            // Create invoice
            $subtotal = 0;
            foreach ($subjects as $subject) {
                $subtotal += ($subject->credits * $subject->cost_per_credit);
            }
            
            $invoice = \App\Models\StudentInvoice::create([
                'student_id' => $id,
                'semester_id' => $request->semester_id,
                'study_year_id' => $request->study_year_id,
                'department_id' => $request->department_id,
                'semester_number' => $request->semester_number,
                'invoice_date' => now(),
                'due_date' => now()->addDays(30),
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => 0,
                'total_amount' => $subtotal,
                'paid_amount' => 0,
                'balance' => $subtotal,
                'status' => 'pending',
            ]);
            
            // Create invoice items
            foreach ($enrollments as $index => $enrollment) {
                $subject = $subjects[$index];
                $amount = $subject->credits * $subject->cost_per_credit;
                
                \App\Models\StudentInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'subject_id' => $subject->id,
                    'enrollment_id' => $enrollment->id,
                    'description' => $subject->name . ' - ' . $subject->code,
                    'quantity' => $subject->credits,
                    'unit_price' => $subject->cost_per_credit,
                    'amount' => $amount,
                ]);
            }
            
            // Create journal entry
            $journalEntry = \App\Models\JournalEntry::create([
                'entry_type' => 'قيد يومية',
                'reference_number' => $invoice->invoice_number,
                'entry_date' => now(),
                'posting_date' => now(),
                'notes' => 'تسجيل رسوم دراسية للطالب: ' . $student->name,
                'status' => 'posted',
                'total_debit' => $subtotal,
                'total_credit' => $subtotal,
                'posted_at' => now(),
            ]);
            
            // Create journal entry lines using the accounts we already validated
            // Debit: حساب العملاء (المدينون) - Accounts Receivable
            \App\Models\JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $studentReceivableAccount->account_id,
                'debit' => $subtotal,
                'credit' => 0,
                'description' => 'رسوم دراسية - ' . $student->name,
                'line_number' => 1,
            ]);
            
            // Credit: حساب الإيرادات - المبيعات - Sales Revenue
            \App\Models\JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $tuitionRevenueAccount->account_id,
                'debit' => 0,
                'credit' => $subtotal,
                'description' => 'إيرادات رسوم دراسية - ' . $student->name,
                'line_number' => 2,
            ]);
            
            // Link journal entry to invoice
            $invoice->update(['journal_entry_id' => $journalEntry->id]);
        }

        return response()->json([
            'message' => 'Student enrolled successfully',
            'enrollments' => $enrollments,
            'invoice' => $invoice,
            'journal_entry' => $journalEntry,
            'count' => count($enrollments)
        ], 201);
    }

    /**
     * Get subject enrollments for a student
     */
    public function subjectEnrollments($id)
    {
        $enrollments = \App\Models\StudentSubjectEnrollment::with([
            'subject',
            'semester',
            'studyYear',
            'department'
        ])
        ->where('student_id', $id)
        ->orderBy('enrollment_date', 'desc')
        ->get();

        return response()->json($enrollments);
    }
}
