<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentSemesterRegistration;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentRegistrationController extends Controller
{
    use LogsUserActions;

    /**
     * Get all student registrations
     */
    public function index(Request $request)
    {
        $query = StudentSemesterRegistration::with([
            'student',
            'semester',
            'studyYear',
            'department',
            'group'
        ]);

        // Apply filters
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $registrations = $query->orderBy('registration_date', 'desc')->get();

        return response()->json($registrations);
    }

    /**
     * Get a specific registration
     */
    public function show($id)
    {
        $registration = StudentSemesterRegistration::with([
            'student',
            'semester',
            'studyYear',
            'department',
            'group'
        ])->find($id);

        if (!$registration) {
            return response()->json([
                'message' => 'Registration not found'
            ], 404);
        }

        return response()->json($registration);
    }

    /**
     * Register a student for a semester
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'semester_id' => 'required|exists:semesters,id',
            'study_year_id' => 'required|exists:study_years,id',
            'department_id' => 'required|exists:departments,id',
            'semester_number' => 'required|integer|min:1',
            'registration_date' => 'required|date',
            'status' => 'required|in:active,completed,withdrawn,suspended',
            'tuition_paid' => 'boolean',
            'group_id' => 'nullable|exists:student_groups,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if student is already registered for this semester
        $exists = StudentSemesterRegistration::where('student_id', $request->student_id)
            ->where('semester_id', $request->semester_id)
            ->where('status', 'active')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Student is already registered for this semester'
            ], 409);
        }

        // Fee check when assigning to a group
        if ($request->group_id && !$request->boolean('tuition_paid')) {
            $eligibility = $this->resolveGroupAssignmentEligibility(
                $request->student_id,
                $request->semester_id,
                $request->department_id,
                null
            );

            if (!$eligibility['can_join_group']) {
                return response()->json([
                    'message' => 'لا يمكن تعيين الطالب في مجموعة: الرسوم غير مدفوعة ولا يوجد تجاوز إداري.',
                    'error_code' => 'FEES_NOT_PAID'
                ], 422);
            }

            if ($eligibility['fee_status'] === 'paid') {
                $request->merge(['tuition_paid' => true]);
            }
        }

        $registration = StudentSemesterRegistration::create($request->all());
        $registration->load(['student', 'semester', 'studyYear', 'department', 'group']);

        $this->logAction('register', 'student-registration', $registration->id, [
            'student_id' => $request->student_id,
            'semester_id' => $request->semester_id,
            'department_id' => $request->department_id,
        ]);

        return response()->json($registration, 201);
    }

    /**
     * Create a new registration
     */
    public function store(Request $request)
    {
        return $this->register($request);
    }

    /**
     * Update a registration
     */
    public function update(Request $request, $id)
    {
        $registration = StudentSemesterRegistration::find($id);

        if (!$registration) {
            return response()->json([
                'message' => 'Registration not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'semester_id' => 'sometimes|exists:semesters,id',
            'study_year_id' => 'sometimes|exists:study_years,id',
            'department_id' => 'sometimes|exists:departments,id',
            'semester_number' => 'sometimes|integer|min:1',
            'registration_date' => 'sometimes|date',
            'status' => 'sometimes|in:active,completed,withdrawn,suspended',
            'tuition_paid' => 'boolean',
            'group_id' => 'nullable|exists:student_groups,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Fee check when assigning to a group during update
        if ($request->has('group_id') && $request->group_id && !$registration->group_id) {
            $tuitionPaid = $request->has('tuition_paid') ? $request->boolean('tuition_paid') : $registration->tuition_paid;
            if (!$tuitionPaid) {
                $semesterId = $request->semester_id ?? $registration->semester_id;
                $departmentId = $request->department_id ?? $registration->department_id;
                $eligibility = $this->resolveGroupAssignmentEligibility(
                    $registration->student_id,
                    $semesterId,
                    $departmentId,
                    $registration
                );

                if (!$eligibility['can_join_group']) {
                    return response()->json([
                        'message' => 'لا يمكن تعيين الطالب في مجموعة: الرسوم غير مدفوعة ولا يوجد تجاوز إداري.',
                        'error_code' => 'FEES_NOT_PAID'
                    ], 422);
                }

                if ($eligibility['fee_status'] === 'paid' && !$registration->tuition_paid) {
                    $request->merge(['tuition_paid' => true]);
                }
            }
        }

        $registration->update($request->all());
        $registration->load(['student', 'semester', 'studyYear', 'department', 'group']);

        return response()->json($registration);
    }

    /**
     * Delete a registration
     */
    public function destroy($id)
    {
        $registration = StudentSemesterRegistration::find($id);

        if (!$registration) {
            return response()->json([
                'message' => 'Registration not found'
            ], 404);
        }

        $registration->delete();

        return response()->json([
            'message' => 'Registration deleted successfully'
        ]);
    }

    private function resolveGroupAssignmentEligibility(
        string $studentId,
        string $semesterId,
        string $departmentId,
        ?StudentSemesterRegistration $registration = null
    ): array {
        $invoice = \App\Models\StudentInvoice::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->where(function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId)
                    ->orWhereNull('department_id');
            })
            ->where('status', '!=', 'cancelled')
            ->orderByRaw("CASE WHEN status = 'paid' THEN 0 WHEN status = 'partial' THEN 1 ELSE 2 END")
            ->orderByDesc('invoice_date')
            ->orderByDesc('created_at')
            ->first();

        $feeStatus = 'unpaid';

        if ($invoice) {
            if ($invoice->status === 'paid' || (float) $invoice->balance <= 0) {
                $feeStatus = 'paid';
            } elseif ($invoice->status === 'partial' || (float) $invoice->paid_amount > 0) {
                $feeStatus = 'partial';
            } elseif (!empty($invoice->status)) {
                $feeStatus = $invoice->status;
            }
        }

        if ($registration && $registration->tuition_paid) {
            $feeStatus = 'paid';
        }

        $paidEnrollmentExists = \App\Models\StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->where('department_id', $departmentId)
            ->where(function ($query) {
                $query->where('payment_status', 'paid')
                    ->orWhere(function ($subQuery) {
                        $subQuery->where('attendance_allowed', true)
                            ->where('admin_override', false);
                    });
            })
            ->exists();

        if ($paidEnrollmentExists) {
            $feeStatus = 'paid';
        }

        $hasAdminOverride = \App\Models\StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->where('department_id', $departmentId)
            ->where('admin_override', true)
            ->where('attendance_allowed', true)
            ->exists();

        return [
            'fee_status' => $feeStatus,
            'has_admin_override' => $hasAdminOverride,
            'can_join_group' => $feeStatus === 'paid' || $hasAdminOverride,
        ];
    }
}
