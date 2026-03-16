<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Requests\EnrollSubjectsRequest;
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
        $query = Student::with(['department:id,name,name_en', 'enrollmentSemester:id,name,name_en,code']);

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

        // Filter by nationality
        if ($request->has('nationality') && $request->nationality) {
            if ($request->nationality === 'foreign') {
                $query->where(function($q) {
                    $q->where('nationality', '!=', 'ليبيا')
                      ->where('nationality', '!=', 'ليبي')
                      ->where('nationality', '!=', 'ليبية');
                });
            } else {
                $query->where('nationality', $request->nationality);
            }
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
    public function store(StoreStudentRequest $request)
    {
        try {
            return \DB::transaction(function () use ($request) {
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
                $student->load(['department:id,name,name_en', 'enrollmentSemester:id,name,name_en,code']);

                // Auto-create login account if student has email
                $generatedPassword = null;
                if ($student->email) {
                    // Keep student onboarding predictable unless an explicit password is provided.
                    $generatedPassword = $request->input('password', 'student123');
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
            });
        } catch (\Exception $e) {
            \Log::error('Failed to create student', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'فشل في إنشاء الطالب', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified student
     */
    public function show($id)
    {
        $student = Student::with([
            'department:id,name,name_en',
            'enrollmentSemester:id,name,name_en,code',
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
    public function update(UpdateStudentRequest $request, $id)
    {
        $student = Student::findOrFail($id);

        $student->update($request->all());
        $student->load(['department:id,name,name_en', 'enrollmentSemester:id,name,name_en,code']);

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
    public function enrollInSubjects(EnrollSubjectsRequest $request, $id)
    {

        $student = Student::findOrFail($id);

        $requestedSubjects = \App\Models\Subject::select('id', 'name', 'code', 'semester_number', 'department_id')
            ->whereIn('id', $request->subject_ids)
            ->get();

        if ($requestedSubjects->count() !== collect($request->subject_ids)->unique()->count()) {
            return response()->json([
                'message' => 'تعذر العثور على بعض المقررات المطلوبة للتسجيل',
            ], 422);
        }

        $invalidDepartmentSubjects = $requestedSubjects->filter(function ($subject) use ($request) {
            return (string) $subject->department_id !== (string) $request->department_id;
        });

        if ($invalidDepartmentSubjects->isNotEmpty()) {
            return response()->json([
                'message' => 'بعض المقررات لا تتبع القسم المحدد للتسجيل',
                'invalid_subjects' => $invalidDepartmentSubjects->map(function ($subject) {
                    return [
                        'id' => $subject->id,
                        'code' => $subject->code,
                        'name' => $subject->name,
                    ];
                })->values(),
            ], 422);
        }

        $invalidSemesterSubjects = $requestedSubjects->filter(function ($subject) use ($request) {
            return (int) $subject->semester_number !== (int) $request->semester_number;
        });

        if ($invalidSemesterSubjects->isNotEmpty()) {
            return response()->json([
                'message' => 'بعض المقررات لا تتبع الفصل الدراسي المحدد',
                'invalid_subjects' => $invalidSemesterSubjects->map(function ($subject) {
                    return [
                        'id' => $subject->id,
                        'code' => $subject->code,
                        'name' => $subject->name,
                        'semester_number' => $subject->semester_number,
                    ];
                })->values(),
            ], 422);
        }

        $isVisualArtsDigitalMedia = \App\Models\Department::where('id', $request->department_id)
            ->where(function ($query) {
                $query->where('name', 'قسم الفنون البصرية والإعلام الرقمي')
                    ->orWhere('name_en', 'Department of Visual Arts and Digital Media');
            })
            ->exists();

        if ($isVisualArtsDigitalMedia && (int) $request->semester_number >= 5) {
            $trackPrefixes = [
                'fine_arts_media' => ['FA '],
                'advertising_design' => ['AD '],
                'photography_cinema' => ['PH '],
                'multimedia_media' => ['MM '],
            ];
            $sharedPrefixes = ['EL ', 'SUP DE '];

            $requestedTrack = $request->input('specialization_track');

            if (empty($student->specialization_track)) {
                if (!$requestedTrack || !array_key_exists($requestedTrack, $trackPrefixes)) {
                    return response()->json([
                        'message' => 'يجب اختيار مسار تخصص لطلبة قسم الفنون البصرية والإعلام الرقمي ابتداءً من الفصل الخامس',
                        'allowed_tracks' => array_keys($trackPrefixes),
                    ], 422);
                }

                $student->update([
                    'specialization_track' => $requestedTrack,
                ]);
            } elseif (!empty($requestedTrack) && $requestedTrack !== $student->specialization_track) {
                return response()->json([
                    'message' => 'لا يمكن تغيير مسار التخصص بعد اعتماده للطالب',
                    'current_track' => $student->specialization_track,
                ], 422);
            }

            $effectiveTrack = $student->specialization_track;
            $allowedPrefixes = array_merge($trackPrefixes[$effectiveTrack] ?? [], $sharedPrefixes);

            $trackInvalidSubjects = $requestedSubjects->filter(function ($subject) use ($allowedPrefixes) {
                $code = (string) $subject->code;
                foreach ($allowedPrefixes as $prefix) {
                    if (str_starts_with($code, $prefix)) {
                        return false;
                    }
                }
                return true;
            });

            if ($trackInvalidSubjects->isNotEmpty()) {
                return response()->json([
                    'message' => 'المقررات المختارة لا تتوافق مع مسار التخصص المعتمد للطالب',
                    'student_track' => $effectiveTrack,
                    'invalid_subjects' => $trackInvalidSubjects->map(function ($subject) {
                        return [
                            'id' => $subject->id,
                            'code' => $subject->code,
                            'name' => $subject->name,
                        ];
                    })->values(),
                ], 422);
            }
        }
        
        // Check if default accounts are configured before proceeding
        $studentReceivableAccount = \App\Models\AccountDefault::where('category', 'accounts_receivable')->first();
        $tuitionRevenueAccount = \App\Models\AccountDefault::where('category', 'sales_revenue')->first();
        
        if (!$studentReceivableAccount || !$tuitionRevenueAccount) {
            return response()->json([
                'message' => 'يجب تحديد الحسابات الافتراضية أولاً',
                'error' => 'الرجاء تحديد حساب العملاء (المدينون) وحساب الإيرادات - المبيعات في إعدادات الحسابات الافتراضية قبل تسجيل الطلاب'
            ], 400);
        }
        
        // Check prerequisites for all requested subjects
        // Uses GradeFinalizationService::hasPassedSubject which checks both
        // enrollment status AND actual published grades (handles un-synced enrollments)
        $prerequisiteErrors = [];
        foreach ($request->subject_ids as $subjectId) {
            $subjectToCheck = \App\Models\Subject::with('prerequisiteSubjects:id,name,code')->find($subjectId);
            if ($subjectToCheck && $subjectToCheck->prerequisiteSubjects->isNotEmpty()) {
                $missing = $subjectToCheck->prerequisiteSubjects->filter(function ($prereq) use ($id) {
                    return !\App\Services\GradeFinalizationService::hasPassedSubject($id, $prereq->id);
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

        try {
            return \DB::transaction(function () use ($request, $id, $student) {
                // Create or update semester registration without auto-creating/auto-assigning groups.
                // Group membership is handled manually from Student Groups screens.
                $existingSemesterRegistration = \App\Models\StudentSemesterRegistration::with('group:id,department_id,semester_id')
                    ->where('student_id', $id)
                    ->where('semester_id', $request->semester_id)
                    ->first();

                $preservedGroupId = $existingSemesterRegistration?->group_id;
                if ($existingSemesterRegistration && $existingSemesterRegistration->group_id) {
                    $existingGroup = $existingSemesterRegistration->group;
                    $groupIsInvalid = !$existingGroup
                        || (string) $existingGroup->department_id !== (string) $request->department_id
                        || (string) $existingGroup->semester_id !== (string) $request->semester_id;

                    if ($groupIsInvalid) {
                        $preservedGroupId = null;
                    }
                }

                $semesterRegistration = \App\Models\StudentSemesterRegistration::updateOrCreate(
                    [
                        'student_id' => $id,
                        'semester_id' => $request->semester_id,
                    ],
                    [
                        'study_year_id' => $request->study_year_id,
                        'department_id' => $request->department_id,
                        'group_id' => $preservedGroupId,
                        'semester_number' => $request->semester_number,
                        'registration_date' => now(),
                        'status' => 'active',
                    ]
                );

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
                    
                    // Calculate total credits for ALL enrollments in this semester (for fee rule matching)
                    $totalCredits = \App\Models\StudentSubjectEnrollment::where('student_id', $id)
                        ->where('semester_id', $request->semester_id)
                        ->whereHas('subject')
                        ->with('subject')
                        ->get()
                        ->sum(fn($e) => $e->subject->credits ?? 0);

                    // Calculate credits for NEWLY enrolled subjects only (for per_credit fee pricing)
                    $newlyEnrolledCredits = collect($subjects)->sum(fn($s) => $s->credits ?? 0);
                    
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
                    
                    // Add fee items to invoice — per_credit fees use newly enrolled credits
                    if (!empty($newFees)) {
                        \App\Services\FeeService::addFeeItemsToInvoice($invoice, $newFees, $newlyEnrolledCredits);
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
            });
        } catch (\Exception $e) {
            \Log::error('Failed to enroll student in subjects', ['student_id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'فشل في تسجيل الطالب في المقررات', 'error' => $e->getMessage()], 500);
        }
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
