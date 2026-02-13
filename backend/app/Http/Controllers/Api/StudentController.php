<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\AppUser;
use App\Models\StudentSemesterRegistration;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    use LogsUserActions;

    /**
     * Generate and return the next student ID (preview before creation)
     */
    public function nextId()
    {
        $year = date('y');
        $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        $studentId = "ST{$year}{$random}";
        while (Student::where('id', $studentId)->exists()) {
            $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            $studentId = "ST{$year}{$random}";
        }
        return response()->json(['id' => $studentId]);
    }

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
                  ->orWhere('campus_id', 'like', "%{$search}%")
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
            // New enrollment fields
            'birth_place' => 'nullable|string|max:255',
            'certification_type' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_school' => 'nullable|string|max:255',
            'certification_specialization' => 'nullable|string|max:255',
            'port_of_entry' => 'nullable|string|max:255',
            'visa_type' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_nationality' => 'nullable|string|max:255',
            'passport_number' => 'nullable|string|max:100',
            'passport_issue_date' => 'nullable|date',
            'passport_expiry_date' => 'nullable|date',
            'passport_place_of_issue' => 'nullable|string|max:255',
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

        // Auto-create login account if student has email
        $generatedPassword = null;
        if ($student->email) {
            $generatedPassword = $request->input('password', $student->campus_id ?? 'student123');
            $this->createStudentLoginAccount($student, $generatedPassword);
        }

        $this->logAction('create', 'students', $student->id, [
            'student_name' => $student->name,
            'department_id' => $student->department_id,
        ]);

        $response = $student->toArray();
        if ($generatedPassword) {
            $response['login_credentials'] = [
                'email' => $student->email,
                'password' => $generatedPassword,
            ];
        }

        return response()->json($response, 201);
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
            // New enrollment fields
            'birth_place' => 'nullable|string|max:255',
            'certification_type' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_school' => 'nullable|string|max:255',
            'certification_specialization' => 'nullable|string|max:255',
            'port_of_entry' => 'nullable|string|max:255',
            'visa_type' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_nationality' => 'nullable|string|max:255',
            'passport_number' => 'nullable|string|max:100',
            'passport_issue_date' => 'nullable|date',
            'passport_expiry_date' => 'nullable|date',
            'passport_place_of_issue' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $student->update($request->all());
        $student->load('department:id,name,name_en');

        $this->logAction('update', 'students', $student->id, [
            'student_name' => $student->name,
            'updated_fields' => array_keys($request->all()),
        ]);

        return response()->json($student);
    }

    /**
     * Remove the specified student
     */
    public function destroy($id)
    {
        $student = Student::findOrFail($id);

        $this->logAction('delete', 'students', $student->id, [
            'student_name' => $student->name,
        ]);

        $student->delete();

        return response()->json(['message' => 'Student deleted successfully'], 200);
    }

    /**
     * Upload student photo
     */
    public function uploadPhoto(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Delete old photo if exists
        if ($student->photo_url) {
            $oldPath = str_replace('/storage/', '', $student->photo_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('photo')->store('student-photos', 'public');
        $student->update(['photo_url' => '/storage/' . $path]);

        return response()->json([
            'message' => 'تم رفع الصورة بنجاح',
            'photo_url' => '/storage/' . $path,
        ]);
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
            'is_paying' => 'nullable|boolean',
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
        
        // Check prerequisites for all requested subjects
        $completedSubjectIds = \App\Models\StudentSubjectEnrollment::where('student_id', $id)
            ->where('status', 'completed')
            ->pluck('subject_id')
            ->toArray();

        $prerequisiteErrors = [];
        foreach ($request->subject_ids as $subjectId) {
            $subjectToCheck = \App\Models\Subject::with('prerequisiteSubjects:id,name,code')->find($subjectId);
            if ($subjectToCheck && $subjectToCheck->prerequisiteSubjects->isNotEmpty()) {
                $missing = $subjectToCheck->prerequisiteSubjects->filter(function ($prereq) use ($completedSubjectIds) {
                    return !in_array($prereq->id, $completedSubjectIds);
                });
                if ($missing->isNotEmpty()) {
                    $prerequisiteErrors[] = [
                        'subject' => $subjectToCheck->name,
                        'subject_code' => $subjectToCheck->code,
                        'missing' => $missing->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code])->values(),
                    ];
                }
            }
        }

        if (!empty($prerequisiteErrors)) {
            return response()->json([
                'message' => 'لا يمكن تسجيل الطالب في بعض المقررات بسبب عدم استيفاء المتطلبات السابقة',
                'prerequisite_errors' => $prerequisiteErrors,
            ], 422);
        }

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
                $isPaying = $request->boolean('is_paying', false);
                
                $enrollment = \App\Models\StudentSubjectEnrollment::create([
                    'student_id' => $id,
                    'subject_id' => $subjectId,
                    'semester_id' => $request->semester_id,
                    'study_year_id' => $request->study_year_id,
                    'department_id' => $request->department_id,
                    'semester_number' => $request->semester_number,
                    'enrollment_date' => now(),
                    'status' => 'enrolled',
                    'payment_status' => $isPaying ? 'paid' : 'unpaid',
                    'attendance_allowed' => $isPaying,
                ]);
                $enrollments[] = $enrollment;
                
                // Load subject for invoice
                $subject = \App\Models\Subject::find($subjectId);
                if ($subject) {
                    $subjects[] = $subject;
                }
            }
        }

        // Create/update invoice if there are new enrollments
        $invoice = null;
        $journalEntry = null;
        
        if (count($enrollments) > 0) {
            $isPaying = $request->boolean('is_paying', false);
            
            // Calculate total credits for ALL enrollments in this semester (not just new ones)
            $totalCredits = \App\Models\StudentSubjectEnrollment::where('student_id', $id)
                ->where('semester_id', $request->semester_id)
                ->whereHas('subject')
                ->with('subject')
                ->get()
                ->sum(fn($e) => $e->subject->credits ?? 0);
            
            // Use FeeService to find or reuse existing invoice
            $invoice = \App\Services\FeeService::findOrCreateInvoice(
                $id,
                $request->semester_id,
                $request->study_year_id,
                $request->department_id,
                $request->semester_number,
                $isPaying
            );
            
            // Add subject items to invoice
            \App\Services\FeeService::addSubjectItemsToInvoice($invoice, $enrollments, $subjects);
            
            // Get NEW fees to charge (prevents duplicates across invoices)
            $newFees = \App\Services\FeeService::getNewFeesToCharge(
                $id,
                $request->semester_id,
                $request->department_id,
                $request->semester_number,
                $totalCredits,
                $student,
                $request->study_year_id
            );
            
            // Add fee items to invoice
            if (!empty($newFees)) {
                \App\Services\FeeService::addFeeItemsToInvoice($invoice, $newFees, $totalCredits);
            }
            
            // Recalculate invoice totals
            $invoice = \App\Services\FeeService::recalculateInvoice($invoice);
            
            // If paying immediately, update paid amount
            if ($isPaying) {
                $invoice->update([
                    'paid_amount' => $invoice->total_amount,
                    'balance' => 0,
                    'status' => 'paid',
                ]);
                $invoice = $invoice->fresh();
            }
            
            // Create or update journal entry for the invoice
            \App\Services\FeeService::updateOrCreateInvoiceJournalEntry($invoice);
            
            // If paying immediately, create payment journal entry
            if ($isPaying) {
                $this->createPaymentJournalEntry($invoice, (float) $invoice->total_amount, $student);
            }
        }

        $this->logAction('enroll', 'student-enrollments', $id, [
            'student_name' => $student->name,
            'subject_count' => count($enrollments),
            'semester_id' => $request->semester_id,
            'subject_ids' => $request->subject_ids,
        ]);

        return response()->json([
            'message' => 'Student enrolled successfully',
            'enrollments' => $enrollments,
            'invoice' => $invoice ? $invoice->fresh(['items.subject', 'items.feeDefinition']) : null,
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
            'department',
            'invoice'
        ])
        ->where('student_id', $id)
        ->orderBy('enrollment_date', 'desc')
        ->get();

        return response()->json($enrollments);
    }

    /**
     * Get invoices for a student
     */
    public function invoices($id)
    {
        $invoices = \App\Models\StudentInvoice::with([
            'semester',
            'studyYear',
            'department',
            'items.subject',
            'items.feeDefinition'
        ])
        ->where('student_id', $id)
        ->orderBy('invoice_date', 'desc')
        ->get();

        return response()->json($invoices);
    }

    /**
     * Get fee summary for a student in a semester (charged + pending fees)
     */
    public function feeSummary($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'semester_id' => 'required|exists:semesters,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $summary = \App\Services\FeeService::getStudentFeeSummary($id, $request->semester_id);
        return response()->json($summary);
    }

    /**
     * Create payment journal entry when student pays during registration
     */
    protected function createPaymentJournalEntry($invoice, $amount, $student)
    {
        // Get default accounts
        $receivableAccount = \App\Models\AccountDefault::where('category', 'accounts_receivable')->first();
        $cashAccount = \App\Models\AccountDefault::where('category', 'cash')->first();
        
        // If no cash account configured, try to find one or skip
        if (!$cashAccount) {
            // Try to find a cash account
            $cashAccountModel = \App\Models\Account::where('account_type', 'asset')
                ->where(function($q) {
                    $q->where('account_name', 'like', '%نقد%')
                      ->orWhere('account_name', 'like', '%cash%')
                      ->orWhere('account_number', 'like', '101%');
                })
                ->first();
            
            if (!$cashAccountModel) {
                // Create a basic cash account
                $cashAccountModel = \App\Models\Account::create([
                    'account_number' => '1010',
                    'account_name' => 'النقدية',
                    'account_type' => 'asset',
                    'root_account_type' => 'assets',
                    'is_active' => true,
                    'is_group' => false,
                    'description' => 'حساب النقدية - Cash Account'
                ]);
                
                // Set as default
                \App\Models\AccountDefault::create([
                    'category' => 'cash',
                    'account_id' => $cashAccountModel->id,
                    'description' => 'Default cash account'
                ]);
            }
            
            $cashAccountId = $cashAccountModel->id;
        } else {
            $cashAccountId = $cashAccount->account_id;
        }

        $journalEntry = \App\Models\JournalEntry::create([
            'entry_type' => 'قيد يومية',
            'reference_number' => $invoice->invoice_number . '-PAY',
            'entry_date' => now(),
            'posting_date' => now(),
            'notes' => 'دفعة من الطالب عند التسجيل: ' . $student->name,
            'status' => 'posted',
            'total_debit' => $amount,
            'total_credit' => $amount,
            'posted_at' => now(),
        ]);

        // Debit: Cash
        \App\Models\JournalEntryLine::create([
            'journal_entry_id' => $journalEntry->id,
            'account_id' => $cashAccountId,
            'debit' => $amount,
            'credit' => 0,
            'description' => 'دفعة نقدية من الطالب - ' . $student->name,
            'line_number' => 1,
        ]);

        // Credit: Accounts Receivable
        \App\Models\JournalEntryLine::create([
            'journal_entry_id' => $journalEntry->id,
            'account_id' => $receivableAccount->account_id,
            'debit' => 0,
            'credit' => $amount,
            'description' => 'تخفيض المستحقات - ' . $student->name,
            'line_number' => 2,
        ]);
        
        return $journalEntry;
    }

    /**
     * Create a login account (User + AppUser) for a student
     */
    private function createStudentLoginAccount(Student $student, string $rawPassword): void
    {
        try {
            // Check if a User already exists with this email
            $user = User::where('email', $student->email)->first();

            if (!$user) {
                $user = User::create([
                    'name' => $student->name,
                    'email' => $student->email,
                    'password' => Hash::make($rawPassword),
                ]);
            }

            // Check if AppUser already exists
            $appUser = AppUser::where('auth_user_id', $user->id)->first();

            if (!$appUser) {
                AppUser::create([
                    'auth_user_id' => $user->id,
                    'email' => $student->email,
                    'full_name' => $student->name,
                    'role' => 'student',
                    'status' => 'active',
                    'student_id' => $student->id,
                    'department_id' => $student->department_id,
                ]);
            } else {
                // Update existing AppUser to link to student
                $appUser->update([
                    'role' => 'student',
                    'student_id' => $student->id,
                    'department_id' => $student->department_id,
                ]);
            }

            // Link auth_user_id back to student
            $student->update(['auth_user_id' => $user->id]);

            \Log::info('Student login account created', [
                'student_id' => $student->id,
                'user_id' => $user->id,
                'email' => $student->email,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create student login account', [
                'student_id' => $student->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
