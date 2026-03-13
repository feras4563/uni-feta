<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentAcademicProgress;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Semester;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class AcademicProgressionService
{
    // GPA thresholds
    const GPA_GOOD_STANDING = 2.0;
    const GPA_DEANS_LIST = 3.5;
    const GPA_DISMISSAL = 1.0;
    const PASS_PERCENTAGE = 50.0;

    // Max semesters for a typical program
    const MAX_SEMESTERS = 8;

    /**
     * Evaluate a single student's academic standing and optionally promote.
     *
     * @return array evaluation result
     */
    public static function evaluateStudent(string $studentId, ?string $studyYearId = null): array
    {
        $student = Student::with(['department', 'academicProgress'])->findOrFail($studentId);

        $completedEnrollments = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('status', 'completed')
            ->where('passed', true)
            ->with('subject:id,credits')
            ->get();

        $failedEnrollments = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('status', 'failed')
            ->with('subject:id,name,code,credits,semester_number')
            ->get();

        // Calculate total credits earned (only from passed subjects, use latest per subject)
        $creditsEarned = self::calculateCreditsEarned($completedEnrollments);

        // Calculate cumulative GPA
        $gpaResult = self::calculateCumulativeGPA($studentId);
        $gpa = $gpaResult['gpa'];

        // Determine academic standing
        $standing = self::determineStanding($gpa, $student->academicProgress?->academic_standing);

        // Determine current progress semester (highest completed semester number)
        $highestCompletedSemester = self::getHighestCompletedSemester($studentId);

        // Can the student be promoted?
        $canPromote = self::canPromote($studentId, $highestCompletedSemester, $gpa, $standing);

        // Resolve study year
        $effectiveStudyYearId = $studyYearId ?? $student->academicProgress?->current_study_year_id;
        if (!$effectiveStudyYearId) {
            $currentSemester = Semester::where('is_current', true)->first();
            $effectiveStudyYearId = $currentSemester?->study_year_id;
        }
        if (!$effectiveStudyYearId) {
            // Fallback to latest study year
            $latestStudyYear = \App\Models\StudyYear::orderBy('created_at', 'desc')->first();
            $effectiveStudyYearId = $latestStudyYear?->id;
        }

        if (!$effectiveStudyYearId) {
            throw new \RuntimeException('لا توجد سنة دراسية معرفة في النظام. يرجى إنشاء سنة دراسية أولاً.');
        }

        // Upsert academic progress record
        $progress = StudentAcademicProgress::updateOrCreate(
            ['student_id' => $studentId],
            [
                'department_id' => $student->department_id,
                'current_semester' => $highestCompletedSemester + 1,
                'current_study_year_id' => $effectiveStudyYearId,
                'total_credits_earned' => $creditsEarned,
                'gpa' => $gpa,
                'status' => $student->status === 'graduated' ? 'graduated' : ($standing === 'dismissed' ? 'suspended' : 'active'),
                'academic_standing' => $standing,
                'last_evaluated_at' => now(),
            ]
        );

        return [
            'student_id' => $studentId,
            'student_name' => $student->name,
            'department' => $student->department?->name,
            'credits_earned' => $creditsEarned,
            'gpa' => $gpa,
            'gpa_details' => $gpaResult,
            'academic_standing' => $standing,
            'current_semester' => $highestCompletedSemester + 1,
            'highest_completed_semester' => $highestCompletedSemester,
            'can_promote' => $canPromote,
            'failed_subjects_count' => $failedEnrollments->count(),
            'failed_subjects' => $failedEnrollments->map(fn($e) => [
                'enrollment_id' => $e->id,
                'subject_id' => $e->subject_id,
                'subject_name' => $e->subject?->name,
                'subject_code' => $e->subject?->code,
                'credits' => $e->subject?->credits,
                'semester_number' => $e->subject?->semester_number,
                'grade' => $e->grade,
            ])->values(),
            'progress' => $progress,
        ];
    }

    /**
     * Promote a student to the next semester.
     */
    public static function promoteStudent(string $studentId, ?string $studyYearId = null): array
    {
        $eval = self::evaluateStudent($studentId, $studyYearId);

        if (!$eval['can_promote']) {
            return [
                'promoted' => false,
                'reason' => self::getPromotionBlockReason($eval),
                'evaluation' => $eval,
            ];
        }

        $nextSemester = $eval['highest_completed_semester'] + 1;

        // Update student year field (year = ceil(semester/2))
        $studentYear = (int) ceil($nextSemester / 2);

        $student = Student::findOrFail($studentId);
        $student->update(['year' => $studentYear]);

        // Update academic progress
        $progress = StudentAcademicProgress::where('student_id', $studentId)->first();
        if ($progress) {
            $notes = "تمت الترقية للفصل {$nextSemester} بتاريخ " . now()->format('Y-m-d');
            $progress->update([
                'current_semester' => $nextSemester,
                'progression_notes' => $notes,
            ]);
        }

        return [
            'promoted' => true,
            'new_semester' => $nextSemester,
            'new_year' => $studentYear,
            'evaluation' => self::evaluateStudent($studentId, $studyYearId),
        ];
    }

    /**
     * Bulk evaluate all active students in a department (semester-end workflow).
     */
    public static function bulkEvaluate(?string $departmentId = null, ?string $studyYearId = null): array
    {
        $query = Student::where('status', 'active');
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        $studentIds = $query->pluck('id');

        $results = [
            'total' => $studentIds->count(),
            'evaluated' => 0,
            'promoted' => 0,
            'on_probation' => 0,
            'dismissed' => 0,
            'deans_list' => 0,
            'errors' => [],
        ];

        foreach ($studentIds as $sid) {
            try {
                $eval = self::evaluateStudent($sid, $studyYearId);
                $results['evaluated']++;
                if ($eval['academic_standing'] === 'probation') $results['on_probation']++;
                if ($eval['academic_standing'] === 'dismissed') $results['dismissed']++;
                if ($eval['academic_standing'] === 'deans_list') $results['deans_list']++;
            } catch (\Exception $e) {
                $results['errors'][] = ['student_id' => $sid, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Bulk promote all eligible active students.
     */
    public static function bulkPromote(?string $departmentId = null, ?string $studyYearId = null): array
    {
        $query = Student::where('status', 'active');
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        $studentIds = $query->pluck('id');

        $results = [
            'total' => $studentIds->count(),
            'promoted' => 0,
            'not_eligible' => 0,
            'errors' => [],
            'details' => [],
        ];

        foreach ($studentIds as $sid) {
            try {
                $result = self::promoteStudent($sid, $studyYearId);
                if ($result['promoted']) {
                    $results['promoted']++;
                } else {
                    $results['not_eligible']++;
                }
                $results['details'][] = [
                    'student_id' => $sid,
                    'promoted' => $result['promoted'],
                    'reason' => $result['reason'] ?? null,
                ];
            } catch (\Exception $e) {
                $results['errors'][] = ['student_id' => $sid, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Get failed subjects for a student that are eligible for retake.
     */
    public static function getRetakeableSubjects(string $studentId): Collection
    {
        // Get all failed enrollments
        $failedEnrollments = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where(function ($q) {
                $q->where('status', 'failed')
                  ->orWhere('passed', false);
            })
            ->with('subject:id,name,name_en,code,credits,semester_number,department_id')
            ->get();

        // Exclude subjects that already have an active retake enrollment
        $activeRetakeSubjectIds = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('is_retake', true)
            ->whereIn('status', ['enrolled', 'completed'])
            ->pluck('subject_id')
            ->toArray();

        // Also exclude subjects the student has since passed
        $passedSubjectIds = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('status', 'completed')
            ->where('passed', true)
            ->pluck('subject_id')
            ->toArray();

        return $failedEnrollments
            ->filter(fn($e) => !in_array($e->subject_id, $activeRetakeSubjectIds))
            ->filter(fn($e) => !in_array($e->subject_id, $passedSubjectIds))
            ->unique('subject_id')
            ->map(fn($e) => [
                'failed_enrollment_id' => $e->id,
                'subject_id' => $e->subject_id,
                'subject_name' => $e->subject?->name,
                'subject_name_en' => $e->subject?->name_en,
                'subject_code' => $e->subject?->code,
                'credits' => $e->subject?->credits,
                'semester_number' => $e->subject?->semester_number,
                'department_id' => $e->subject?->department_id,
                'failed_grade' => $e->grade,
                'failed_semester_id' => $e->semester_id,
            ])
            ->values();
    }

    /**
     * Enroll a student in retake subjects.
     *
     * @return array created enrollments
     */
    public static function enrollRetakeSubjects(
        string $studentId,
        array $subjectIds,
        string $semesterId,
        string $studyYearId,
        string $departmentId,
        int $semesterNumber,
        bool $isPaying = false
    ): array {
        $student = Student::findOrFail($studentId);
        $retakeable = self::getRetakeableSubjects($studentId);
        $retakeableSubjectIds = $retakeable->pluck('subject_id')->toArray();

        $invalidSubjects = array_diff($subjectIds, $retakeableSubjectIds);
        if (!empty($invalidSubjects)) {
            throw new \InvalidArgumentException(
                'المقررات التالية غير مؤهلة لإعادة التسجيل: ' . implode(', ', $invalidSubjects)
            );
        }

        // Validate prerequisites are still met (they should be since student already took it)
        $prereqErrors = EnrollmentService::checkPrerequisites($studentId, $subjectIds);
        if (!empty($prereqErrors)) {
            throw new \InvalidArgumentException(
                'لا يمكن إعادة التسجيل بسبب عدم استيفاء المتطلبات السابقة'
            );
        }

        $enrollments = [];
        foreach ($subjectIds as $subjectId) {
            // Find the original failed enrollment
            $failedEnrollment = $retakeable->firstWhere('subject_id', $subjectId);

            // Check if already enrolled in this subject+semester
            $existing = StudentSubjectEnrollment::where([
                'student_id' => $studentId,
                'subject_id' => $subjectId,
                'semester_id' => $semesterId,
            ])->first();

            if ($existing) {
                continue;
            }

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
                'is_retake' => true,
                'original_enrollment_id' => $failedEnrollment['failed_enrollment_id'] ?? null,
                'notes' => 'إعادة تسجيل - مقرر راسب',
            ]);

            $enrollments[] = $enrollment;
        }

        return $enrollments;
    }

    // ────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────

    /**
     * Calculate total credits earned from passed enrollments (unique subjects only).
     */
    private static function calculateCreditsEarned(Collection $completedEnrollments): int
    {
        // Group by subject_id to avoid double-counting retakes
        return $completedEnrollments
            ->unique('subject_id')
            ->sum(fn($e) => $e->subject?->credits ?? 0);
    }

    /**
     * Calculate cumulative GPA from all graded subjects.
     * Uses weight-based GPA: sum(grade_points * credits) / sum(credits)
     */
    public static function calculateCumulativeGPA(string $studentId): array
    {
        // Get the best enrollment per subject (passed takes priority, then highest grade)
        $enrollments = StudentSubjectEnrollment::where('student_id', $studentId)
            ->whereIn('status', ['completed', 'failed'])
            ->whereNotNull('grade')
            ->with('subject:id,credits')
            ->get()
            ->groupBy('subject_id')
            ->map(function ($group) {
                // Prefer passed, then highest grade
                $passed = $group->where('passed', true)->sortByDesc('grade')->first();
                return $passed ?? $group->sortByDesc('grade')->first();
            })
            ->filter();

        $totalWeightedPoints = 0;
        $totalCredits = 0;
        $subjectResults = [];

        foreach ($enrollments as $enrollment) {
            $credits = $enrollment->subject?->credits ?? 0;
            if ($credits <= 0) continue;

            $grade = (float) $enrollment->grade;
            $maxGrade = 100;
            $percentage = $maxGrade > 0 ? ($grade / $maxGrade) * 100 : 0;
            $gpaPoints = StudentPortalService::aggregateGrades(collect([
                (object) ['grade_value' => $grade, 'max_grade' => $maxGrade]
            ]))['gpa'];

            $totalWeightedPoints += $gpaPoints * $credits;
            $totalCredits += $credits;

            $subjectResults[] = [
                'subject_id' => $enrollment->subject_id,
                'credits' => $credits,
                'grade' => $grade,
                'gpa_points' => $gpaPoints,
                'passed' => $enrollment->passed,
            ];
        }

        $cumulativeGPA = $totalCredits > 0 ? round($totalWeightedPoints / $totalCredits, 2) : 0;

        return [
            'gpa' => $cumulativeGPA,
            'total_credits_counted' => $totalCredits,
            'total_weighted_points' => round($totalWeightedPoints, 2),
            'subjects_counted' => count($subjectResults),
        ];
    }

    /**
     * Determine academic standing from GPA.
     */
    private static function determineStanding(float $gpa, ?string $previousStanding = null): string
    {
        if ($gpa >= self::GPA_DEANS_LIST) {
            return 'deans_list';
        }
        if ($gpa >= self::GPA_GOOD_STANDING) {
            return 'good_standing';
        }
        // If previously on probation and still below threshold → dismissed
        if ($previousStanding === 'probation' && $gpa < self::GPA_GOOD_STANDING) {
            return 'dismissed';
        }
        if ($gpa < self::GPA_DISMISSAL && $gpa > 0) {
            return 'dismissed';
        }
        if ($gpa < self::GPA_GOOD_STANDING && $gpa > 0) {
            return 'probation';
        }
        // No grades yet
        return 'good_standing';
    }

    /**
     * Get the highest semester number where the student has completed all required subjects.
     */
    private static function getHighestCompletedSemester(string $studentId): int
    {
        // Get unique semester numbers with at least one completed enrollment
        $completedSemesters = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('status', 'completed')
            ->where('passed', true)
            ->select('semester_number')
            ->distinct()
            ->pluck('semester_number')
            ->sort()
            ->values();

        if ($completedSemesters->isEmpty()) {
            return 0;
        }

        // Find the highest consecutive completed semester
        $highest = 0;
        foreach ($completedSemesters as $semNum) {
            if ($semNum <= $highest + 1) {
                $highest = $semNum;
            }
        }

        return $highest;
    }

    /**
     * Can the student be promoted to the next semester?
     */
    private static function canPromote(string $studentId, int $highestCompletedSemester, float $gpa, string $standing): bool
    {
        // Cannot promote if dismissed
        if ($standing === 'dismissed') {
            return false;
        }

        // Cannot promote beyond max semesters
        if ($highestCompletedSemester >= self::MAX_SEMESTERS) {
            return false;
        }

        // Must have completed at least one semester
        if ($highestCompletedSemester === 0) {
            return false;
        }

        // GPA must be above dismissal threshold (probation students CAN be promoted)
        if ($gpa < self::GPA_DISMISSAL && $gpa > 0) {
            return false;
        }

        return true;
    }

    /**
     * Explain why promotion is blocked.
     */
    private static function getPromotionBlockReason(array $eval): string
    {
        if ($eval['academic_standing'] === 'dismissed') {
            return 'الطالب مفصول أكاديمياً بسبب تدني المعدل التراكمي';
        }
        if ($eval['highest_completed_semester'] >= self::MAX_SEMESTERS) {
            return 'الطالب وصل للحد الأقصى من الفصول الدراسية';
        }
        if ($eval['highest_completed_semester'] === 0) {
            return 'لا يوجد فصل دراسي مكتمل بنجاح';
        }
        if ($eval['gpa'] < self::GPA_DISMISSAL && $eval['gpa'] > 0) {
            return 'المعدل التراكمي أقل من الحد الأدنى المطلوب';
        }
        return 'غير مؤهل للترقية';
    }
}
