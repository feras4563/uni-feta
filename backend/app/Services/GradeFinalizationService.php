<?php

namespace App\Services;

use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\GradeCalculationService;

class GradeFinalizationService
{
    const PASS_PERCENTAGE = 50.0;

    /**
     * Sync enrollment status for specific student+subject combinations.
     * Called after grades are published/updated.
     *
     * @param array $pairs  Array of ['student_id' => ..., 'subject_id' => ..., 'semester_id' => ...]
     * @return array summary of updates
     */
    public static function syncEnrollmentStatusForPairs(array $pairs): array
    {
        $updated = 0;
        $errors = [];

        foreach ($pairs as $pair) {
            try {
                $changed = self::syncSingleEnrollment(
                    $pair['student_id'],
                    $pair['subject_id'],
                    $pair['semester_id'] ?? null
                );
                if ($changed) $updated++;
            } catch (\Exception $e) {
                $errors[] = [
                    'student_id' => $pair['student_id'],
                    'subject_id' => $pair['subject_id'],
                    'error' => $e->getMessage(),
                ];
            }
        }

        return ['updated' => $updated, 'errors' => $errors];
    }

    /**
     * Sync enrollment status for a single student+subject.
     * Aggregates all published grades and determines pass/fail.
     *
     * @return bool true if enrollment was updated
     */
    public static function syncSingleEnrollment(string $studentId, string $subjectId, ?string $semesterId = null): bool
    {
        // Find the enrollment (prefer specific semester, fall back to latest enrolled)
        $query = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('subject_id', $subjectId);

        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }

        $enrollment = $query->orderByDesc('enrollment_date')->first();

        if (!$enrollment) {
            return false;
        }

        // Only update enrollments that are still 'enrolled' or already 'completed'/'failed'
        // (don't touch 'dropped' or 'withdrawn')
        if (!in_array($enrollment->status, ['enrolled', 'completed', 'failed'])) {
            return false;
        }

        // Get all published grades for this student+subject+semester
        $gradesQuery = StudentGrade::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('is_published', true);

        if ($enrollment->semester_id) {
            $gradesQuery->where('semester_id', $enrollment->semester_id);
        }

        $grades = $gradesQuery->get();

        // If no published grades, don't change status
        if ($grades->isEmpty()) {
            return false;
        }

        // Aggregate: sum(grade_value) / sum(max_grade) * 100
        $totalValue = $grades->sum('grade_value');
        $totalMax = $grades->sum('max_grade');
        $percentage = $totalMax > 0 ? round(($totalValue / $totalMax) * 100, 2) : 0;

        $passed = $percentage >= self::PASS_PERCENTAGE;
        $letterGrade = GradeCalculationService::percentageToLetter($percentage);

        // Determine new status: any published grades → mark completed or failed.
        // Teachers may use any combination of grade types (midterm, assignment, quiz,
        // final, etc.), so we don't gate on the presence of a 'final' grade type.
        $newStatus = $passed ? 'completed' : 'failed';

        $changed = $enrollment->status !== $newStatus
            || (bool) $enrollment->passed !== $passed
            || (float) $enrollment->grade !== $percentage;

        if ($changed) {
            $enrollment->update([
                'status' => $newStatus,
                'passed' => $passed,
                'grade' => $percentage,
                'grade_letter' => $letterGrade,
            ]);
        }

        return $changed;
    }

    /**
     * Bulk sync ALL enrollments for a semester from published grades.
     * Useful for semester finalization or data repair.
     *
     * @return array summary
     */
    public static function syncAllForSemester(string $semesterId): array
    {
        $enrollments = StudentSubjectEnrollment::where('semester_id', $semesterId)
            ->whereIn('status', ['enrolled', 'completed', 'failed'])
            ->get();

        $updated = 0;
        $total = $enrollments->count();
        $errors = [];

        foreach ($enrollments as $enrollment) {
            try {
                $changed = self::syncSingleEnrollment(
                    $enrollment->student_id,
                    $enrollment->subject_id,
                    $enrollment->semester_id
                );
                if ($changed) $updated++;
            } catch (\Exception $e) {
                $errors[] = [
                    'enrollment_id' => $enrollment->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'total_enrollments' => $total,
            'updated' => $updated,
            'errors' => $errors,
        ];
    }

    /**
     * Check if a student has effectively passed a subject by looking at both
     * enrollment status AND actual published grades.
     * This is the authoritative check for prerequisite validation.
     */
    public static function hasPassedSubject(string $studentId, string $subjectId): bool
    {
        // First: check enrollment status (fast path)
        $passedEnrollment = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('status', 'completed')
            ->where('passed', true)
            ->exists();

        if ($passedEnrollment) {
            return true;
        }

        // Second: check actual published grades (fallback for un-synced enrollments)
        $grades = StudentGrade::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('is_published', true)
            ->get();

        if ($grades->isEmpty()) {
            return false;
        }

        $totalValue = $grades->sum('grade_value');
        $totalMax = $grades->sum('max_grade');
        $percentage = $totalMax > 0 ? ($totalValue / $totalMax) * 100 : 0;

        return $percentage >= self::PASS_PERCENTAGE;
    }

}
