<?php

namespace App\Services;

use App\Models\Student;
use App\Models\DepartmentTransfer;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentSemesterRegistration;
use App\Models\StudentAcademicProgress;
use App\Models\Semester;
use Illuminate\Support\Facades\DB;

class DepartmentTransferService
{
    /**
     * Initiate a department transfer request.
     */
    public static function initiateTransfer(
        string $studentId,
        string $toDepartmentId,
        ?string $reason = null,
        ?string $approvedBy = null
    ): DepartmentTransfer {
        $student = Student::findOrFail($studentId);

        if ($student->department_id === $toDepartmentId) {
            throw new \InvalidArgumentException('الطالب مسجل بالفعل في هذا القسم');
        }

        // Check for pending transfers
        $pending = DepartmentTransfer::where('student_id', $studentId)
            ->where('status', 'pending')
            ->exists();

        if ($pending) {
            throw new \InvalidArgumentException('يوجد طلب نقل قيد المراجعة بالفعل لهذا الطالب');
        }

        $currentSemester = Semester::where('is_current', true)->first();

        return DepartmentTransfer::create([
            'student_id' => $studentId,
            'from_department_id' => $student->department_id,
            'to_department_id' => $toDepartmentId,
            'semester_id' => $currentSemester?->id,
            'approved_by' => $approvedBy,
            'status' => 'pending',
            'reason' => $reason,
        ]);
    }

    /**
     * Execute an approved department transfer.
     */
    public static function executeTransfer(string $transferId, ?string $adminNotes = null): DepartmentTransfer
    {
        return DB::transaction(function () use ($transferId, $adminNotes) {
            $transfer = DepartmentTransfer::with('student')->findOrFail($transferId);

            if ($transfer->status !== 'pending' && $transfer->status !== 'approved') {
                throw new \InvalidArgumentException('لا يمكن تنفيذ هذا النقل - الحالة: ' . $transfer->status);
            }

            $student = $transfer->student;
            $fromDeptId = $transfer->from_department_id;
            $toDeptId = $transfer->to_department_id;

            // 1. Identify completed/passed subjects that can transfer (credits)
            $passedEnrollments = StudentSubjectEnrollment::where('student_id', $student->id)
                ->where('status', 'completed')
                ->where('passed', true)
                ->with('subject:id,name,code,credits')
                ->get();

            $creditsTransferred = $passedEnrollments->sum(fn($e) => $e->subject?->credits ?? 0);
            $transferredSubjects = $passedEnrollments->map(fn($e) => [
                'subject_id' => $e->subject_id,
                'subject_name' => $e->subject?->name,
                'subject_code' => $e->subject?->code,
                'credits' => $e->subject?->credits,
                'grade' => $e->grade,
            ])->values()->toArray();

            // 2. Drop active enrollments in the old department for current semester
            $currentSemester = Semester::where('is_current', true)->first();
            if ($currentSemester) {
                StudentSubjectEnrollment::where('student_id', $student->id)
                    ->where('department_id', $fromDeptId)
                    ->where('semester_id', $currentSemester->id)
                    ->where('status', 'enrolled')
                    ->update(['status' => 'dropped', 'notes' => 'نقل قسم - إسقاط تلقائي']);
            }

            // 3. Remove from current semester group in old department
            if ($currentSemester) {
                StudentSemesterRegistration::where('student_id', $student->id)
                    ->where('department_id', $fromDeptId)
                    ->where('semester_id', $currentSemester->id)
                    ->update(['group_id' => null, 'notes' => 'نقل قسم']);
            }

            // 4. Update student's department + reset specialization track
            $student->update([
                'department_id' => $toDeptId,
                'specialization_track' => null,
            ]);

            // 5. Update academic progress department
            StudentAcademicProgress::where('student_id', $student->id)
                ->update(['department_id' => $toDeptId]);

            // 6. Complete the transfer record
            $transfer->update([
                'status' => 'completed',
                'admin_notes' => $adminNotes,
                'credits_transferred' => $creditsTransferred,
                'transferred_subjects' => $transferredSubjects,
                'completed_at' => now(),
            ]);

            // 7. Send notification
            NotificationService::notify(
                self::getStudentUserId($student),
                'department_transfer',
                'تم نقلك إلى قسم جديد',
                'تم نقلك من ' . ($transfer->fromDepartment?->name ?? '') . ' إلى ' . ($transfer->toDepartment?->name ?? '') . '. تم نقل ' . $creditsTransferred . ' ساعة معتمدة.',
                'shuffle',
                '/student/subjects',
                ['transfer_id' => $transfer->id]
            );

            return $transfer->fresh(['student', 'fromDepartment', 'toDepartment']);
        });
    }

    /**
     * Reject a transfer request.
     */
    public static function rejectTransfer(string $transferId, ?string $adminNotes = null): DepartmentTransfer
    {
        $transfer = DepartmentTransfer::findOrFail($transferId);

        if ($transfer->status !== 'pending') {
            throw new \InvalidArgumentException('لا يمكن رفض هذا الطلب');
        }

        $transfer->update([
            'status' => 'rejected',
            'admin_notes' => $adminNotes,
        ]);

        return $transfer->fresh(['student', 'fromDepartment', 'toDepartment']);
    }

    /**
     * Get transfer history for a student.
     */
    public static function getStudentTransfers(string $studentId): \Illuminate\Database\Eloquent\Collection
    {
        return DepartmentTransfer::where('student_id', $studentId)
            ->with(['fromDepartment:id,name', 'toDepartment:id,name', 'semester:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    private static function getStudentUserId(Student $student): ?int
    {
        if ($student->auth_user_id) {
            return (int) $student->auth_user_id;
        }
        return null;
    }
}
