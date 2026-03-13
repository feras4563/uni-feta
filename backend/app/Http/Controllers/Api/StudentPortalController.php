<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentInvoice;
use App\Models\StudentGrade;
use App\Models\AttendanceRecord;
use App\Models\TimetableEntry;
use App\Models\ClassSchedule;
use App\Models\TeacherSubject;
use App\Models\Subject;
use App\Models\StudentSemesterRegistration;
use App\Models\AppUser;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    /**
     * Get the authenticated student from the JWT user
     */
    private function getStudent(Request $request): ?Student
    {
        $user = auth('api')->user();
        $appUser = AppUser::where('auth_user_id', $user->id)->first();

        if (!$appUser || !$appUser->student_id) {
            return null;
        }

        return Student::find($appUser->student_id);
    }

    /**
     * Resolve student group IDs used for timetable lookup.
     *
     * Primary source: student_group_members pivot table
     * Fallback source: student_semester_registrations.group_id
     */
    private function getStudentGroupIds(Student $student)
    {
        $memberGroupIds = collect();

        // student_group_members table is optional in some deployments.
        if (\Schema::hasTable('student_group_members')) {
            $memberGroupIds = \DB::table('student_group_members')
                ->where('student_id', $student->id)
                ->pluck('student_group_id')
                ->filter();
        }

        $registrationGroupIds = StudentSemesterRegistration::where('student_id', $student->id)
            ->whereNotNull('group_id')
            ->pluck('group_id')
            ->filter();

        return $memberGroupIds->merge($registrationGroupIds)->unique()->values();
    }

    /**
     * Resolve subject IDs student is enrolled in (excluding dropped/failed).
     */
    private function getEnrolledSubjectIds(Student $student)
    {
        return StudentSubjectEnrollment::where('student_id', $student->id)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['dropped', 'failed']);
            })
            ->pluck('subject_id')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * Build schedule context used to resolve timetable rows for a student.
     *
     * Some deployments rely on group_id links, others on subject enrollments,
     * and others only on semester+department timetable rows (group_id nullable).
     */
    private function getStudentScheduleContext(Student $student): array
    {
        $groupIds = $this->getStudentGroupIds($student);
        $subjectIds = $this->getEnrolledSubjectIds($student);

        $registrationPairs = StudentSemesterRegistration::where('student_id', $student->id)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['withdrawn', 'suspended']);
            })
            ->whereNotNull('semester_id')
            ->get(['semester_id', 'department_id'])
            ->map(function ($row) {
                return [
                    'semester_id' => $row->semester_id,
                    'department_id' => $row->department_id,
                ];
            });

        $enrollmentPairs = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['dropped', 'failed']);
            })
            ->whereNotNull('semester_id')
            ->get(['semester_id', 'department_id'])
            ->map(function ($row) {
                return [
                    'semester_id' => $row->semester_id,
                    'department_id' => $row->department_id,
                ];
            });

        $semesterDepartmentPairs = $registrationPairs
            ->merge($enrollmentPairs)
            ->unique(fn($pair) => ($pair['semester_id'] ?? '') . '|' . ($pair['department_id'] ?? ''))
            ->values();

        $departmentIds = $semesterDepartmentPairs
            ->pluck('department_id')
            ->filter()
            ->unique()
            ->values();

        return [
            'group_ids' => $groupIds,
            'subject_ids' => $subjectIds,
            'semester_department_pairs' => $semesterDepartmentPairs,
            'department_ids' => $departmentIds,
        ];
    }

    /**
     * Resolve timetable entries by student schedule context.
     */
    private function getTimetableEntriesForStudent(array $scheduleContext, ?int $dayOfWeek = null)
    {
        $groupIds = $scheduleContext['group_ids'];
        $subjectIds = $scheduleContext['subject_ids'];
        $semesterDepartmentPairs = $scheduleContext['semester_department_pairs'];

        if ($groupIds->isEmpty() && $subjectIds->isEmpty() && $semesterDepartmentPairs->isEmpty()) {
            return collect();
        }

        $query = TimetableEntry::query()
            ->where('is_active', true);

        if ($dayOfWeek !== null) {
            $query->where('day_of_week', $dayOfWeek);

            // When filtering by a specific day, also ensure the resolved date
            // falls within the semester's start/end range so we don't show
            // timetable rows for semesters that haven't started or have ended.
            $today = now()->toDateString();
            $query->whereHas('semester', function ($sq) use ($today) {
                $sq->where('start_date', '<=', $today)
                   ->where('end_date', '>=', $today);
            });
        }

        $query->where(function ($outer) use ($groupIds, $subjectIds, $semesterDepartmentPairs) {
            $hasCondition = false;

            if ($groupIds->isNotEmpty()) {
                $outer->whereIn('group_id', $groupIds);
                $hasCondition = true;
            }

            if ($subjectIds->isNotEmpty()) {
                $method = $hasCondition ? 'orWhereIn' : 'whereIn';
                $outer->{$method}('subject_id', $subjectIds);
                $hasCondition = true;
            }

            if ($semesterDepartmentPairs->isNotEmpty()) {
                $method = $hasCondition ? 'orWhere' : 'where';
                $outer->{$method}(function ($pairsQuery) use ($semesterDepartmentPairs) {
                    foreach ($semesterDepartmentPairs as $index => $pair) {
                        $pairMethod = $index === 0 ? 'where' : 'orWhere';
                        $pairsQuery->{$pairMethod}(function ($pairQuery) use ($pair) {
                            $pairQuery->where('semester_id', $pair['semester_id']);

                            if (!empty($pair['department_id'])) {
                                $pairQuery->where('department_id', $pair['department_id']);
                            }
                        });
                    }
                });
            }
        });

        return $query
            ->with([
                'subject:id,name,name_en,code',
                'teacher:id,name,name_en',
                'room:id,name,code,building',
                'timeSlot:id,code,label,start_time,end_time',
                'studentGroup:id,group_name',
            ])
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->unique('id')
            ->values();
    }

    /**
     * Build schedule-like entries from class_schedules for enrolled subjects.
     */
    private function getClassScheduleFallbackEntries($subjectIds, $departmentIds = null, ?int $dayOfWeek = null)
    {
        $departmentIds = $departmentIds ?? collect();

        if ($subjectIds->isEmpty() && $departmentIds->isEmpty()) {
            return collect();
        }

        $query = ClassSchedule::query()
            ->where('is_active', true)
            ->whereNotNull('subject_id')
            ->where(function ($inner) use ($subjectIds, $departmentIds) {
                if ($subjectIds->isNotEmpty()) {
                    $inner->whereIn('subject_id', $subjectIds);
                }

                if ($departmentIds->isNotEmpty()) {
                    $method = $subjectIds->isNotEmpty() ? 'orWhereIn' : 'whereIn';
                    $inner->{$method}('department_id', $departmentIds);
                }
            })
            ->with([
                'subject:id,name,name_en,code',
                'teacher:id,name,name_en',
            ]);

        if ($dayOfWeek !== null) {
            $query->where('day_of_week', $dayOfWeek);
        }

        return $query
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->map(function ($row) {
                return (object) [
                    'id' => 'class-schedule-' . $row->id,
                    'day_of_week' => $row->day_of_week,
                    'start_time' => $row->start_time,
                    'end_time' => $row->end_time,
                    'subject' => $row->subject,
                    'teacher' => $row->teacher,
                    'room' => $row->room ? [
                        'name' => $row->room,
                        'code' => null,
                        'building' => null,
                    ] : null,
                    'time_slot' => null,
                    'student_group' => null,
                ];
            });

    }

    private function resolveEnrollmentEligibility(Student $student, StudentSubjectEnrollment $enrollment): array
    {
        $registrationQuery = StudentSemesterRegistration::where('student_id', $student->id)
            ->where('semester_id', $enrollment->semester_id);

        if (!empty($enrollment->department_id)) {
            $registrationQuery->where('department_id', $enrollment->department_id);
        }

        $registration = $registrationQuery
            ->orderByDesc('registration_date')
            ->orderByDesc('created_at')
            ->first();

        $subjectInvoiceQuery = StudentInvoice::where('student_id', $student->id)
            ->where('semester_id', $enrollment->semester_id);

        if (!empty($enrollment->department_id)) {
            $subjectInvoiceQuery->where(function ($query) use ($enrollment) {
                $query->where('department_id', $enrollment->department_id)
                    ->orWhereNull('department_id');
            });
        } else {
            $subjectInvoiceQuery->whereNull('department_id');
        }

        $subjectInvoice = $subjectInvoiceQuery
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($enrollment) {
                $query->whereHas('items', function ($itemQuery) use ($enrollment) {
                    $itemQuery->where('subject_id', $enrollment->subject_id);
                })->orWhereDoesntHave('items');
            })
            ->orderByRaw("CASE WHEN status = 'paid' THEN 0 WHEN status = 'partial' THEN 1 ELSE 2 END")
            ->orderByDesc('invoice_date')
            ->orderByDesc('created_at')
            ->first();

        $resolvedPaymentStatus = $enrollment->payment_status ?: 'unpaid';
        $isPaid = false;
        $hasAdminOverride = (bool) ($enrollment->admin_override && $enrollment->attendance_allowed);

        if ($subjectInvoice) {
            if ($subjectInvoice->status === 'paid' || (float) $subjectInvoice->balance <= 0) {
                $resolvedPaymentStatus = 'paid';
                $isPaid = true;
            } elseif ($subjectInvoice->status === 'partial' || (float) $subjectInvoice->paid_amount > 0) {
                $resolvedPaymentStatus = 'partial';
            } elseif (!empty($subjectInvoice->status)) {
                $resolvedPaymentStatus = $subjectInvoice->status;
            }
        }

        if ($registration && $registration->tuition_paid) {
            $resolvedPaymentStatus = 'paid';
            $isPaid = true;
        }

        if ($enrollment->payment_status === 'paid') {
            $resolvedPaymentStatus = 'paid';
            $isPaid = true;
        }

        if ($enrollment->attendance_allowed && !$enrollment->admin_override) {
            $resolvedPaymentStatus = 'paid';
            $isPaid = true;
        }

        $attendanceAllowed = $isPaid || $hasAdminOverride;

        $reason = 'fees_unpaid';
        if ($hasAdminOverride) {
            $reason = 'admin_override';
        } elseif ($registration && $registration->tuition_paid) {
            $reason = 'semester_registration_paid';
        } elseif ($subjectInvoice && ($subjectInvoice->status === 'paid' || (float) $subjectInvoice->balance <= 0)) {
            $reason = 'invoice_paid';
        } elseif ($enrollment->payment_status === 'paid') {
            $reason = 'subject_paid';
        }

        return [
            'payment_status' => $resolvedPaymentStatus,
            'attendance_allowed' => $attendanceAllowed,
            'has_admin_override' => $hasAdminOverride,
            'eligibility_reason' => $reason,
            'invoice_status' => $subjectInvoice?->status,
            'invoice_balance' => $subjectInvoice ? (float) $subjectInvoice->balance : null,
            'tuition_paid' => (bool) ($registration?->tuition_paid),
        ];
    }

    private function serializeEnrollmentForPortal(Student $student, StudentSubjectEnrollment $enrollment): array
    {
        $eligibility = $this->resolveEnrollmentEligibility($student, $enrollment);
        $payload = $enrollment->toArray();

        $payload['payment_status'] = $eligibility['payment_status'];
        $payload['attendance_allowed'] = $eligibility['attendance_allowed'];
        $payload['attendance_allowed_raw'] = (bool) $enrollment->attendance_allowed;
        $payload['payment_status_raw'] = $enrollment->payment_status;
        $payload['has_admin_override'] = $eligibility['has_admin_override'];
        $payload['eligibility_reason'] = $eligibility['eligibility_reason'];
        $payload['invoice_status'] = $eligibility['invoice_status'];
        $payload['invoice_balance'] = $eligibility['invoice_balance'];
        $payload['tuition_paid'] = $eligibility['tuition_paid'];

        return $payload;
    }

    public function mySubjectDetail(Request $request, string $subjectId)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $enrollment = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('subject_id', $subjectId)
            ->with([
                'subject:id,name,name_en,code,description,credits,weekly_hours,theoretical_hours,practical_hours,department_id,semester_number,semester_id,teacher_id,pdf_file_url,pdf_file_name,pdf_file_size',
                'subject.department:id,name,name_en',
                'subject.teacher:id,name,name_en,email,specialization,photo_url',
                'subject.semesterRelation:id,name,name_en',
                'subject.prerequisiteSubjects:id,name,name_en,code',
                'subject.titles:id,subject_id,title,title_en,description,order_index',
                'semester:id,name,name_en',
                'studyYear:id,name,name_en',
            ])
            ->orderByDesc('created_at')
            ->first();

        if (!$enrollment) {
            return response()->json(['error' => 'Subject enrollment not found'], 404);
        }

        $serializedEnrollment = $this->serializeEnrollmentForPortal($student, $enrollment);
        $subject = $enrollment->subject;
        $scheduleContext = $this->getStudentScheduleContext($student);

        $timetable = $this->getTimetableEntriesForStudent($scheduleContext)
            ->filter(function ($entry) use ($subjectId) {
                return (string) $entry->subject_id === (string) $subjectId
                    || (string) ($entry->subject?->id ?? '') === (string) $subjectId;
            })
            ->values();

        if ($timetable->isEmpty()) {
            $timetable = $this->getClassScheduleFallbackEntries(collect([$subjectId]), collect([$enrollment->department_id]))
                ->filter(function ($entry) use ($subjectId) {
                    return (string) ($entry->subject?->id ?? '') === (string) $subjectId;
                })
                ->values();
        }

        $classSessionsQuery = \App\Models\ClassSession::where('subject_id', $subjectId);

        if (!empty($enrollment->department_id)) {
            $classSessionsQuery->where(function ($query) use ($enrollment) {
                $query->where('department_id', $enrollment->department_id)
                    ->orWhereNull('department_id');
            });
        }

        $classSessions = $classSessionsQuery
            ->with([
                'teacher:id,name,name_en',
                'attendanceRecords' => function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                },
            ])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();

        $publishedGrades = StudentGrade::where('student_id', $student->id)
            ->where('subject_id', $subjectId)
            ->where('is_published', true)
            ->with('teacher:id,name,name_en')
            ->orderBy('due_date')
            ->orderBy('grade_date')
            ->get();

        $assignmentTypes = ['assignment', 'homework', 'project', 'quiz', 'classwork', 'participation'];
        $assignments = $publishedGrades
            ->whereIn('grade_type', $assignmentTypes)
            ->values()
            ->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'title' => $grade->grade_name,
                    'type' => $grade->grade_type,
                    'description' => $grade->description,
                    'feedback' => $grade->feedback,
                    'grade_value' => $grade->grade_value,
                    'max_grade' => $grade->max_grade,
                    'due_date' => $grade->due_date,
                    'grade_date' => $grade->grade_date,
                    'teacher' => $grade->teacher,
                ];
            });

        $attendance = AttendanceRecord::where('student_id', $student->id)
            ->whereHas('classSession', function ($query) use ($subjectId) {
                $query->where('subject_id', $subjectId);
            })
            ->with([
                'classSession:id,subject_id,session_name,session_date,start_time,end_time',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $subjectInvoicesQuery = StudentInvoice::where('student_id', $student->id)
            ->where('semester_id', $enrollment->semester_id)
            ->where('status', '!=', 'cancelled');

        if (!empty($enrollment->department_id)) {
            $subjectInvoicesQuery->where(function ($query) use ($enrollment) {
                $query->where('department_id', $enrollment->department_id)
                    ->orWhereNull('department_id');
            });
        }

        $subjectInvoices = $subjectInvoicesQuery
            ->with([
                'items' => function ($query) use ($subjectId) {
                    $query->where('subject_id', $subjectId)
                        ->orWhereNull('subject_id');
                },
                'items.feeDefinition:id,name_ar,name_en',
            ])
            ->orderByDesc('invoice_date')
            ->get()
            ->filter(function ($invoice) {
                return $invoice->items->isNotEmpty();
            })
            ->values();

        return response()->json([
            'enrollment' => $serializedEnrollment,
            'subject' => $subject,
            'syllabus' => [
                'url' => $subject?->pdf_file_url,
                'name' => $subject?->pdf_file_name,
                'size' => $subject?->pdf_file_size,
                'available' => !empty($subject?->pdf_file_url),
            ],
            'schedule' => $timetable,
            'sessions' => $classSessions,
            'assignments' => $assignments,
            'attendance' => [
                'records' => $attendance,
                'stats' => [
                    'total' => $attendance->count(),
                    'present' => $attendance->where('status', 'present')->count(),
                    'absent' => $attendance->where('status', 'absent')->count(),
                    'late' => $attendance->where('status', 'late')->count(),
                    'excused' => $attendance->where('status', 'excused')->count(),
                ],
            ],
            'grades' => $publishedGrades,
            'invoices' => $subjectInvoices,
        ]);
    }

    public function dashboard(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $student->load('department:id,name,name_en');

        $currentEnrollments = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['dropped', 'failed']);
            })
            ->with([
                'subject:id,name,name_en,code,credits,pdf_file_url,pdf_file_name',
                'semester:id,name,name_en',
            ])
            ->orderByDesc('enrollment_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($enrollment) use ($student) {
                return $this->serializeEnrollmentForPortal($student, $enrollment);
            })
            ->values();

        $invoices = StudentInvoice::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalFees = $invoices->sum('total_amount');
        $totalPaid = $invoices->sum('paid_amount');
        $totalBalance = $invoices->sum('balance');

        $totalGrades = StudentGrade::where('student_id', $student->id)->count();
        $publishedGrades = StudentGrade::where('student_id', $student->id)
            ->where('is_published', true)
            ->count();

        $todayDayOfWeek = now()->dayOfWeek;
        $scheduleContext = $this->getStudentScheduleContext($student);
        $todayTimetable = $this->getTimetableEntriesForStudent($scheduleContext, $todayDayOfWeek);

        if ($todayTimetable->isEmpty()) {
            $todayTimetable = $this->getClassScheduleFallbackEntries(
                $scheduleContext['subject_ids'],
                $scheduleContext['department_ids'],
                $todayDayOfWeek
            );
        }

        $attendanceRecords = AttendanceRecord::where('student_id', $student->id)->get();
        $totalAttendance = $attendanceRecords->count();
        $presentCount = $attendanceRecords->where('status', 'present')->count();
        $attendanceRate = $totalAttendance > 0 ? round(($presentCount / $totalAttendance) * 100, 1) : 0;

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'name_en' => $student->name_en,
                'campus_id' => $student->campus_id,
                'email' => $student->email,
                'department' => $student->department,
                'year' => $student->year,
                'status' => $student->status,
                'photo_url' => $student->photo_url,
            ],
            'stats' => [
                'enrolled_subjects' => $currentEnrollments->count(),
                'total_credits' => $currentEnrollments->sum(fn($e) => $e['subject']['credits'] ?? 0),
                'total_fees' => $totalFees,
                'total_paid' => $totalPaid,
                'total_balance' => $totalBalance,
                'total_grades' => $totalGrades,
                'published_grades' => $publishedGrades,
                'attendance_rate' => $attendanceRate,
                'today_classes' => $todayTimetable->count(),
            ],
            'current_enrollments' => $currentEnrollments,
            'today_timetable' => $todayTimetable,
            'recent_invoice' => $invoices->first(),
        ]);
    }

    public function mySubjects(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = StudentSubjectEnrollment::where('student_id', $student->id)
            ->with([
                'subject:id,name,name_en,code,credits,department_id,semester_number,pdf_file_url,pdf_file_name,pdf_file_size',
                'subject.department:id,name,name_en',
                'semester:id,name,name_en',
                'studyYear:id,name,name_en',
            ]);

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $enrollments = $query->orderBy('created_at', 'desc')->get();

        return response()->json(
            $enrollments->map(function ($enrollment) use ($student) {
                return $this->serializeEnrollmentForPortal($student, $enrollment);
            })->values()
        );
    }

    /**
     * Get student's fees/invoices
     */
    public function myFees(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = StudentInvoice::where('student_id', $student->id)
            ->with([
                'semester:id,name,name_en',
                'studyYear:id,name,name_en',
                'department:id,name,name_en',
                'items.subject:id,name,name_en,code',
                'items.feeDefinition:id,name_ar,name_en',
            ]);

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->orderBy('created_at', 'desc')->get();

        // Summary
        $totalFees = $invoices->sum('total_amount');
        $totalPaid = $invoices->sum('paid_amount');
        $totalBalance = $invoices->sum('balance');

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total_fees' => $totalFees,
                'total_paid' => $totalPaid,
                'total_balance' => $totalBalance,
                'invoice_count' => $invoices->count(),
            ],
        ]);
    }

    /**
     * Get student's schedule (timetable)
     */
    public function mySchedule(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        // Get student's groups
        $scheduleContext = $this->getStudentScheduleContext($student);
        $timetable = $this->getTimetableEntriesForStudent($scheduleContext);

        if ($timetable->isEmpty()) {
            $timetable = $this->getClassScheduleFallbackEntries(
                $scheduleContext['subject_ids'],
                $scheduleContext['department_ids']
            );
        }

        return response()->json([
            'timetable' => $timetable,
        ]);
    }

    /**
     * Get teachers for student's enrolled subjects
     */
    public function myTeachers(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $enrollments = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['dropped', 'failed']);
            })
            ->with('subject:id,name,name_en,code,teacher_id')
            ->get();

        $studentGroupIds = $this->getStudentGroupIds($student);
        $subjectIds = $enrollments->pluck('subject_id')->filter()->unique()->values();

        if ($subjectIds->isEmpty() && $studentGroupIds->isNotEmpty()) {
            $subjectIds = TimetableEntry::whereIn('group_id', $studentGroupIds)
                ->where('is_active', true)
                ->pluck('subject_id')
                ->filter()
                ->unique()
                ->values();
        }

        if ($subjectIds->isEmpty()) {
            return response()->json([
                'teachers' => [],
                'count' => 0,
            ]);
        }

        $teachersById = [];

        $appendTeacherSubject = function ($teacher, $subject) use (&$teachersById) {
            if (!$teacher || !$subject || !$teacher->id || !$subject->id) {
                return;
            }

            if (!isset($teachersById[$teacher->id])) {
                $teachersById[$teacher->id] = [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'name_en' => $teacher->name_en,
                    'email' => $teacher->email,
                    'campus_id' => $teacher->campus_id,
                    'specialization' => $teacher->specialization,
                    'photo_url' => $teacher->photo_url,
                    'department' => $teacher->department,
                    'subjects' => [],
                ];
            }

            $teachersById[$teacher->id]['subjects'][$subject->id] = [
                'id' => $subject->id,
                'name' => $subject->name,
                'name_en' => $subject->name_en,
                'code' => $subject->code,
            ];
        };

        $assignmentRows = TeacherSubject::whereIn('subject_id', $subjectIds)
            ->where('is_active', true)
            ->with([
                'teacher:id,name,name_en,email,campus_id,department_id,specialization,photo_url',
                'teacher.department:id,name,name_en',
                'subject:id,name,name_en,code',
            ])
            ->get();

        foreach ($assignmentRows as $row) {
            $appendTeacherSubject($row->teacher, $row->subject);
        }

        $directSubjects = Subject::whereIn('id', $subjectIds)
            ->whereNotNull('teacher_id')
            ->with([
                'teacher:id,name,name_en,email,campus_id,department_id,specialization,photo_url',
                'teacher.department:id,name,name_en',
            ])
            ->get(['id', 'name', 'name_en', 'code', 'teacher_id']);

        foreach ($directSubjects as $subject) {
            $appendTeacherSubject($subject->teacher, $subject);
        }

        $timetableTeacherRows = TimetableEntry::query()
            ->where('is_active', true)
            ->where(function ($query) use ($studentGroupIds, $subjectIds) {
                if ($studentGroupIds->isNotEmpty()) {
                    $query->whereIn('group_id', $studentGroupIds);
                }

                if ($subjectIds->isNotEmpty()) {
                    $query->orWhereIn('subject_id', $subjectIds);
                }
            })
            ->with([
                'teacher:id,name,name_en,email,campus_id,department_id,specialization,photo_url',
                'teacher.department:id,name,name_en',
                'subject:id,name,name_en,code',
            ])
            ->get();

        foreach ($timetableTeacherRows as $row) {
            $appendTeacherSubject($row->teacher, $row->subject);
        }

        $classScheduleTeacherRows = ClassSchedule::query()
            ->where('is_active', true)
            ->whereNotNull('subject_id')
            ->whereIn('subject_id', $subjectIds)
            ->with([
                'teacher:id,name,name_en,email,campus_id,department_id,specialization,photo_url',
                'teacher.department:id,name,name_en',
                'subject:id,name,name_en,code',
            ])
            ->get();

        foreach ($classScheduleTeacherRows as $row) {
            $appendTeacherSubject($row->teacher, $row->subject);
        }

        $teachers = collect($teachersById)
            ->map(function ($teacher) {
                $teacher['subjects'] = array_values($teacher['subjects']);
                return $teacher;
            })
            ->sortBy('name')
            ->values();

        return response()->json([
            'teachers' => $teachers,
            'count' => $teachers->count(),
        ]);
    }

    /**
     * Get student's grades
     */
    public function myGrades(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = StudentGrade::where('student_id', $student->id)
            ->where('is_published', true)
            ->with([
                'subject:id,name,name_en,code',
                'teacher:id,name,name_en',
                'semester:id,name,name_en',
            ]);

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        $grades = $query->orderBy('grade_date', 'desc')->get();

        // Compute per-grade letter + percentage
        $grades->each(function ($grade) {
            $pct = $grade->max_grade > 0 ? round(($grade->grade_value / $grade->max_grade) * 100, 1) : 0;
            $grade->percentage = $pct;
            $grade->letter_grade = $this->getLetterGrade($pct);
        });

        // Group by subject
        $grouped = $grades->groupBy('subject_id')->map(function ($subjectGrades) {
            $subject = $subjectGrades->first()->subject;
            $totalValue = 0;
            $totalMax = 0;

            foreach ($subjectGrades as $grade) {
                $totalValue += $grade->grade_value;
                $totalMax += $grade->max_grade;
            }

            $average = $totalMax > 0 ? round(($totalValue / $totalMax) * 100, 1) : 0;
            $letterGrade = $this->getLetterGrade($average);
            $gpa = $this->getGPA($average);
            $isFailing = $average < 50;

            return [
                'subject' => $subject,
                'grades' => $subjectGrades->values(),
                'average' => $average,
                'total_value' => round($totalValue, 2),
                'total_max' => round($totalMax, 2),
                'letter_grade' => $letterGrade,
                'gpa' => $gpa,
                'status' => $isFailing ? 'failed' : 'passed',
                'needs_retake' => $isFailing,
                'grade_count' => $subjectGrades->count(),
            ];
        })->values();

        // Overall GPA across all subjects
        $overallGPA = $grouped->count() > 0 ? round($grouped->avg('gpa'), 2) : 0;

        return response()->json([
            'grades' => $grades,
            'by_subject' => $grouped,
            'overall_gpa' => $overallGPA,
        ]);
    }

    /**
     * Get student's attendance records
     */
    public function myAttendance(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = AttendanceRecord::where('student_id', $student->id)
            ->with([
                'classSession:id,subject_id,session_name,session_date,start_time,end_time',
                'classSession.subject:id,name,name_en,code',
            ]);

        if ($request->has('subject_id')) {
            $query->whereHas('classSession', function ($q) use ($request) {
                $q->where('subject_id', $request->subject_id);
            });
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        // Stats
        $total = $records->count();
        $present = $records->where('status', 'present')->count();
        $absent = $records->where('status', 'absent')->count();
        $late = $records->where('status', 'late')->count();
        $excused = $records->where('status', 'excused')->count();
        $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        return response()->json([
            'records' => $records,
            'stats' => [
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'attendance_rate' => $rate,
            ],
        ]);
    }

    /**
     * Get student's profile info
     */
    public function myProfile(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $student->load([
            'department:id,name,name_en',
            'academicProgress',
        ]);

        return response()->json($student);
    }

    /**
     * Convert percentage to letter grade (Arab university standard scale)
     */
    private function getLetterGrade(float $percentage): array
    {
        if ($percentage >= 90) return ['letter' => 'A', 'label' => 'ممتاز', 'label_en' => 'Excellent'];
        if ($percentage >= 80) return ['letter' => 'B', 'label' => 'جيد جداً', 'label_en' => 'Very Good'];
        if ($percentage >= 70) return ['letter' => 'C', 'label' => 'جيد', 'label_en' => 'Good'];
        if ($percentage >= 60) return ['letter' => 'D', 'label' => 'مقبول', 'label_en' => 'Acceptable'];
        if ($percentage >= 50) return ['letter' => 'D-', 'label' => 'مقبول ضعيف', 'label_en' => 'Weak Pass'];
        return ['letter' => 'F', 'label' => 'راسب', 'label_en' => 'Fail'];
    }

    /**
     * Convert percentage to GPA on 4.0 scale
     */
    private function getGPA(float $percentage): float
    {
        if ($percentage >= 90) return 4.0;
        if ($percentage >= 85) return 3.7;
        if ($percentage >= 80) return 3.3;
        if ($percentage >= 75) return 3.0;
        if ($percentage >= 70) return 2.7;
        if ($percentage >= 65) return 2.3;
        if ($percentage >= 60) return 2.0;
        if ($percentage >= 55) return 1.7;
        if ($percentage >= 50) return 1.0;
        return 0.0;
    }
}
