<?php

namespace App\Services;

use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use Illuminate\Support\Collection;

/**
 * Centralized grade calculation service — single source of truth for:
 * - Percentage → GPA point conversion (4.0 scale)
 * - Percentage → letter grade conversion
 * - Per-subject grade aggregation (raw grades → percentage)
 * - Credit-weighted GPA calculation across multiple subjects
 * - Credit-weighted GPA from published StudentGrade records
 */
class GradeCalculationService
{
    /**
     * Convert a percentage (0-100) to GPA on a 4.0 scale.
     */
    public static function percentageToGPA(float $percentage): float
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

    /**
     * Convert a percentage (0-100) to a letter grade with Arabic/English labels.
     *
     * @return array{letter: string, label: string, label_en: string}
     */
    public static function percentageToLetterGrade(float $percentage): array
    {
        if ($percentage >= 90) return ['letter' => 'A', 'label' => 'ممتاز', 'label_en' => 'Excellent'];
        if ($percentage >= 80) return ['letter' => 'B', 'label' => 'جيد جداً', 'label_en' => 'Very Good'];
        if ($percentage >= 70) return ['letter' => 'C', 'label' => 'جيد', 'label_en' => 'Good'];
        if ($percentage >= 60) return ['letter' => 'D', 'label' => 'مقبول', 'label_en' => 'Acceptable'];
        if ($percentage >= 50) return ['letter' => 'D-', 'label' => 'مقبول ضعيف', 'label_en' => 'Weak Pass'];
        return ['letter' => 'F', 'label' => 'راسب', 'label_en' => 'Fail'];
    }

    /**
     * Convert a percentage to a simple letter string (no labels).
     */
    public static function percentageToLetter(float $percentage): string
    {
        return self::percentageToLetterGrade($percentage)['letter'];
    }

    /**
     * Aggregate raw grade records into a subject-level summary.
     * Input: collection of objects with grade_value + max_grade.
     *
     * @return array{total_value: float, total_max: float, percentage: float, gpa: float, letter_grade: array}
     */
    public static function aggregateGrades(Collection $grades): array
    {
        $totalValue = $grades->sum('grade_value');
        $totalMax = $grades->sum('max_grade');
        $percentage = $totalMax > 0 ? round(($totalValue / $totalMax) * 100, 1) : 0;

        return [
            'total_value' => round($totalValue, 2),
            'total_max' => round($totalMax, 2),
            'percentage' => $percentage,
            'gpa' => self::percentageToGPA($percentage),
            'letter_grade' => self::percentageToLetterGrade($percentage),
        ];
    }

    /**
     * Calculate credit-weighted GPA across multiple subjects.
     *
     * Input: array of ['gpa' => float, 'credits' => int] items.
     * Formula: sum(gpa * credits) / sum(credits)
     *
     * @param array[] $subjectResults  Each element: ['gpa' => float, 'credits' => int]
     * @return array{gpa: float, total_credits: int, total_weighted_points: float}
     */
    public static function calculateWeightedGPA(array $subjectResults): array
    {
        $totalWeightedPoints = 0.0;
        $totalCredits = 0;

        foreach ($subjectResults as $item) {
            $credits = (int) ($item['credits'] ?? 0);
            if ($credits <= 0) continue;

            $gpa = (float) ($item['gpa'] ?? 0);
            $totalWeightedPoints += $gpa * $credits;
            $totalCredits += $credits;
        }

        return [
            'gpa' => $totalCredits > 0 ? round($totalWeightedPoints / $totalCredits, 2) : 0.0,
            'total_credits' => $totalCredits,
            'total_weighted_points' => round($totalWeightedPoints, 2),
        ];
    }

    /**
     * Calculate credit-weighted overall GPA from published StudentGrade records
     * for a given student. Groups grades by subject, aggregates each subject,
     * then weights by subject credits.
     *
     * @return array{gpa: float, total_credits: int, total_weighted_points: float, subjects: array}
     */
    public static function calculateStudentOverallGPA(string $studentId, ?string $semesterId = null): array
    {
        $query = StudentGrade::where('student_id', $studentId)
            ->where('is_published', true)
            ->with('subject:id,credits');

        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }

        $grades = $query->get();

        // Group by subject
        $grouped = $grades->groupBy('subject_id');

        $subjectResults = [];
        foreach ($grouped as $subjectId => $subjectGrades) {
            $subject = $subjectGrades->first()->subject;
            $credits = $subject?->credits ?? 0;

            $agg = self::aggregateGrades($subjectGrades);

            $subjectResults[] = [
                'subject_id' => $subjectId,
                'credits' => $credits,
                'gpa' => $agg['gpa'],
                'percentage' => $agg['percentage'],
                'letter_grade' => $agg['letter_grade'],
                'total_value' => $agg['total_value'],
                'total_max' => $agg['total_max'],
            ];
        }

        $weighted = self::calculateWeightedGPA($subjectResults);

        return [
            'gpa' => $weighted['gpa'],
            'total_credits' => $weighted['total_credits'],
            'total_weighted_points' => $weighted['total_weighted_points'],
            'subjects' => $subjectResults,
        ];
    }

    /**
     * Calculate cumulative credit-weighted GPA from finalized enrollments.
     * Uses StudentSubjectEnrollment grade field (percentage out of 100) + subject credits.
     * Takes best enrollment per subject (passed preferred, then highest grade).
     *
     * @return array{gpa: float, total_credits: int, total_weighted_points: float, subjects_counted: int, subject_details: array}
     */
    public static function calculateCumulativeGPAFromEnrollments(string $studentId): array
    {
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

        $subjectResults = [];
        foreach ($enrollments as $enrollment) {
            $credits = $enrollment->subject?->credits ?? 0;
            if ($credits <= 0) continue;

            $percentage = (float) $enrollment->grade;
            $gpaPoints = self::percentageToGPA($percentage);

            $subjectResults[] = [
                'subject_id' => $enrollment->subject_id,
                'credits' => $credits,
                'gpa' => $gpaPoints,
                'grade' => $percentage,
                'passed' => $enrollment->passed,
            ];
        }

        $weighted = self::calculateWeightedGPA($subjectResults);

        return [
            'gpa' => $weighted['gpa'],
            'total_credits' => $weighted['total_credits'],
            'total_weighted_points' => $weighted['total_weighted_points'],
            'subjects_counted' => count($subjectResults),
            'subject_details' => $subjectResults,
        ];
    }
}
