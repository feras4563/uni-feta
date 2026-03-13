<?php

namespace App\Services;

use App\Models\StudentGroup;
use App\Models\StudentSemesterRegistration;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentInvoice;

class GroupAssignmentService
{
    /**
     * Clear stale registrations that point to deleted groups for a given department+semester.
     */
    public static function clearOrphanedGroupAssignments(string $departmentId, string $semesterId): void
    {
        StudentSemesterRegistration::where('department_id', $departmentId)
            ->where('semester_id', $semesterId)
            ->whereNotNull('group_id')
            ->whereDoesntHave('group')
            ->update([
                'group_id' => null,
                'updated_at' => now(),
            ]);
    }

    /**
     * Build the list of candidate student IDs eligible for a group
     * (students registered / enrolled / invoiced in the same semester+department but without a valid group).
     */
    public static function getCandidateStudentIds(StudentGroup $group): array
    {
        $registrationStudentIds = StudentSemesterRegistration::where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->where(function ($query) {
                $query->whereNull('group_id')
                    ->orWhereDoesntHave('group');
            })
            ->pluck('student_id')
            ->all();

        $enrollmentStudentIds = StudentSubjectEnrollment::where('semester_id', $group->semester_id)
            ->where('department_id', $group->department_id)
            ->pluck('student_id')
            ->all();

        $invoiceStudentIds = StudentInvoice::where('semester_id', $group->semester_id)
            ->where(function ($query) use ($group) {
                $query->where('department_id', $group->department_id)
                    ->orWhereNull('department_id');
            })
            ->where('status', '!=', 'cancelled')
            ->pluck('student_id')
            ->all();

        $studentIds = array_values(array_unique(array_merge(
            $registrationStudentIds,
            $enrollmentStudentIds,
            $invoiceStudentIds
        )));

        if (empty($studentIds)) {
            return [];
        }

        $assignedStudentIds = StudentSemesterRegistration::where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->whereNotNull('group_id')
            ->whereHas('group', function ($query) use ($group) {
                $query->where('department_id', $group->department_id)
                    ->where('semester_id', $group->semester_id);
            })
            ->pluck('student_id')
            ->all();

        return array_values(array_diff($studentIds, $assignedStudentIds));
    }

    /**
     * Resolve whether a student can join a group based on payment status.
     *
     * @return array{fee_status: string, has_admin_override: bool, can_join_group: bool}
     */
    public static function resolveGroupEligibility(
        StudentGroup $group,
        string $studentId,
        ?StudentSemesterRegistration $registration = null
    ): array {
        $registration = $registration ?: StudentSemesterRegistration::with('group:id,department_id,semester_id')
            ->where('student_id', $studentId)
            ->where('department_id', $group->department_id)
            ->where('semester_id', $group->semester_id)
            ->first();

        $invoice = StudentInvoice::where('student_id', $studentId)
            ->where('semester_id', $group->semester_id)
            ->where(function ($query) use ($group) {
                $query->where('department_id', $group->department_id)
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

        $paidEnrollmentExists = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $group->semester_id)
            ->where('department_id', $group->department_id)
            ->where(function ($query) {
                $query->where('payment_status', 'paid')
                    ->orWhere(function ($sub) {
                        $sub->where('attendance_allowed', true)
                            ->where('admin_override', false);
                    });
            })
            ->exists();

        if ($paidEnrollmentExists) {
            $feeStatus = 'paid';
        }

        $hasAdminOverride = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('semester_id', $group->semester_id)
            ->where('department_id', $group->department_id)
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
