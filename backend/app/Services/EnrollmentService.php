<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Subject;
use App\Models\Department;
use App\Models\AccountDefault;
use App\Models\StudentSemesterRegistration;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Support\Facades\DB;

class EnrollmentService
{
    /**
     * Validate that all requested subjects exist.
     *
     * @return array{valid: bool, subjects: \Illuminate\Support\Collection, error?: array}
     */
    public static function validateSubjectsExist(array $subjectIds): array
    {
        $subjects = Subject::select('id', 'name', 'code', 'semester_number', 'department_id')
            ->whereIn('id', $subjectIds)
            ->get();

        if ($subjects->count() !== collect($subjectIds)->unique()->count()) {
            return ['valid' => false, 'subjects' => $subjects, 'error' => [
                'message' => 'تعذر العثور على بعض المقررات المطلوبة للتسجيل',
            ]];
        }

        return ['valid' => true, 'subjects' => $subjects];
    }

    /**
     * Validate subjects belong to the given department.
     *
     * @return array{valid: bool, error?: array}
     */
    public static function validateSubjectsDepartment($subjects, string $departmentId): array
    {
        $invalid = $subjects->filter(fn($s) => (string) $s->department_id !== (string) $departmentId);

        if ($invalid->isNotEmpty()) {
            return ['valid' => false, 'error' => [
                'message' => 'بعض المقررات لا تتبع القسم المحدد للتسجيل',
                'invalid_subjects' => $invalid->map(fn($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])->values(),
            ]];
        }

        return ['valid' => true];
    }

    /**
     * Validate subjects belong to the given semester number.
     *
     * @return array{valid: bool, error?: array}
     */
    public static function validateSubjectsSemester($subjects, int $semesterNumber): array
    {
        $invalid = $subjects->filter(fn($s) => (int) $s->semester_number !== $semesterNumber);

        if ($invalid->isNotEmpty()) {
            return ['valid' => false, 'error' => [
                'message' => 'بعض المقررات لا تتبع الفصل الدراسي المحدد',
                'invalid_subjects' => $invalid->map(fn($s) => [
                    'id' => $s->id, 'code' => $s->code, 'name' => $s->name, 'semester_number' => $s->semester_number,
                ])->values(),
            ]];
        }

        return ['valid' => true];
    }

    /**
     * Validate Visual Arts track enforcement for semester >= 5.
     *
     * @return array{valid: bool, error?: array}
     */
    public static function validateSpecializationTrack(Student $student, $subjects, string $departmentId, int $semesterNumber, ?string $requestedTrack): array
    {
        $isVisualArts = Department::where('id', $departmentId)
            ->where(function ($q) {
                $q->where('name', 'قسم الفنون البصرية والإعلام الرقمي')
                  ->orWhere('name_en', 'Department of Visual Arts and Digital Media');
            })->exists();

        if (!$isVisualArts || $semesterNumber < 5) {
            return ['valid' => true];
        }

        $trackPrefixes = [
            'fine_arts_media' => ['FA '],
            'advertising_design' => ['AD '],
            'photography_cinema' => ['PH '],
            'multimedia_media' => ['MM '],
        ];
        $sharedPrefixes = ['EL ', 'SUP DE '];

        if (empty($student->specialization_track)) {
            if (!$requestedTrack || !array_key_exists($requestedTrack, $trackPrefixes)) {
                return ['valid' => false, 'error' => [
                    'message' => 'يجب اختيار مسار تخصص لطلبة قسم الفنون البصرية والإعلام الرقمي ابتداءً من الفصل الخامس',
                    'allowed_tracks' => array_keys($trackPrefixes),
                ]];
            }
            $student->update(['specialization_track' => $requestedTrack]);
        } elseif (!empty($requestedTrack) && $requestedTrack !== $student->specialization_track) {
            return ['valid' => false, 'error' => [
                'message' => 'لا يمكن تغيير مسار التخصص بعد اعتماده للطالب',
                'current_track' => $student->specialization_track,
            ]];
        }

        $effectiveTrack = $student->specialization_track;
        $allowedPrefixes = array_merge($trackPrefixes[$effectiveTrack] ?? [], $sharedPrefixes);

        $trackInvalid = $subjects->filter(function ($s) use ($allowedPrefixes) {
            foreach ($allowedPrefixes as $prefix) {
                if (str_starts_with((string) $s->code, $prefix)) return false;
            }
            return true;
        });

        if ($trackInvalid->isNotEmpty()) {
            return ['valid' => false, 'error' => [
                'message' => 'المقررات المختارة لا تتوافق مع مسار التخصص المعتمد للطالب',
                'student_track' => $effectiveTrack,
                'invalid_subjects' => $trackInvalid->map(fn($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])->values(),
            ]];
        }

        return ['valid' => true];
    }

    /**
     * Validate that default accounts are configured.
     *
     * @return array{valid: bool, error?: array}
     */
    public static function validateDefaultAccounts(): array
    {
        $receivable = AccountDefault::where('category', 'accounts_receivable')->first();
        $revenue = AccountDefault::where('category', 'sales_revenue')->first();

        if (!$receivable || !$revenue) {
            return ['valid' => false, 'error' => [
                'message' => 'يجب تحديد الحسابات الافتراضية أولاً',
                'error' => 'الرجاء تحديد حساب العملاء (المدينون) وحساب الإيرادات - المبيعات في إعدادات الحسابات الافتراضية قبل تسجيل الطلاب',
            ]];
        }

        return ['valid' => true];
    }

    /**
     * Check prerequisites for requested subjects.
     *
     * @return array prerequisite errors (empty = all clear)
     */
    public static function checkPrerequisites(string $studentId, array $subjectIds): array
    {
        $completedIds = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('status', 'completed')
            ->pluck('subject_id')
            ->toArray();

        $errors = [];
        foreach ($subjectIds as $subjectId) {
            $subject = Subject::with('prerequisiteSubjects:id,name,code')->find($subjectId);
            if ($subject && $subject->prerequisiteSubjects->isNotEmpty()) {
                $missing = $subject->prerequisiteSubjects->filter(fn($p) => !in_array($p->id, $completedIds));
                if ($missing->isNotEmpty()) {
                    $errors[] = [
                        'subject' => $subject->name,
                        'subject_code' => $subject->code,
                        'missing' => $missing->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code])->values(),
                    ];
                }
            }
        }

        return $errors;
    }

    /**
     * Create or update the semester registration, preserving valid group assignments.
     */
    public static function upsertSemesterRegistration(string $studentId, string $semesterId, string $studyYearId, string $departmentId, int $semesterNumber): StudentSemesterRegistration
    {
        $existing = StudentSemesterRegistration::with('group:id,department_id,semester_id')
            ->where('student_id', $studentId)
            ->where('semester_id', $semesterId)
            ->first();

        $preservedGroupId = $existing?->group_id;
        if ($existing && $existing->group_id) {
            $group = $existing->group;
            $invalid = !$group
                || (string) $group->department_id !== (string) $departmentId
                || (string) $group->semester_id !== (string) $semesterId;
            if ($invalid) $preservedGroupId = null;
        }

        return StudentSemesterRegistration::updateOrCreate(
            ['student_id' => $studentId, 'semester_id' => $semesterId],
            [
                'study_year_id' => $studyYearId,
                'department_id' => $departmentId,
                'group_id' => $preservedGroupId,
                'semester_number' => $semesterNumber,
                'registration_date' => now(),
                'status' => 'active',
            ]
        );
    }

    /**
     * Create subject enrollments for subjects not yet enrolled.
     *
     * @return array{enrollments: array, subjects: array}
     */
    public static function createSubjectEnrollments(string $studentId, array $subjectIds, string $semesterId, string $studyYearId, string $departmentId, int $semesterNumber, bool $isPaying): array
    {
        $enrollments = [];
        $subjects = [];

        foreach ($subjectIds as $subjectId) {
            $existing = StudentSubjectEnrollment::where([
                'student_id' => $studentId,
                'subject_id' => $subjectId,
                'semester_id' => $semesterId,
            ])->first();

            if (!$existing) {
                $enrollment = StudentSubjectEnrollment::create([
                    'student_id' => $studentId,
                    'subject_id' => $subjectId,
                    'semester_id' => $semesterId,
                    'study_year_id' => $studyYearId,
                    'department_id' => $departmentId,
                    'semester_number' => $semesterNumber,
                    'enrollment_date' => now(),
                    'status' => 'enrolled',
                    'payment_status' => $isPaying ? 'paid' : 'unpaid',
                    'attendance_allowed' => $isPaying,
                ]);
                $enrollments[] = $enrollment;

                $subject = Subject::find($subjectId);
                if ($subject) $subjects[] = $subject;
            }
        }

        return ['enrollments' => $enrollments, 'subjects' => $subjects];
    }
}
