<?php

namespace Tests\Unit;

use App\Services\GradeCalculationService;
use Tests\TestCase;

class GradeCalculationServiceTest extends TestCase
{
    public function test_percentage_to_gpa_scale(): void
    {
        $this->assertEquals(4.0, GradeCalculationService::percentageToGPA(95));
        $this->assertEquals(3.7, GradeCalculationService::percentageToGPA(87));
        $this->assertEquals(3.3, GradeCalculationService::percentageToGPA(82));
        $this->assertEquals(3.0, GradeCalculationService::percentageToGPA(76));
        $this->assertEquals(2.7, GradeCalculationService::percentageToGPA(72));
        $this->assertEquals(2.3, GradeCalculationService::percentageToGPA(67));
        $this->assertEquals(2.0, GradeCalculationService::percentageToGPA(61));
        $this->assertEquals(1.7, GradeCalculationService::percentageToGPA(56));
        $this->assertEquals(1.0, GradeCalculationService::percentageToGPA(50));
        $this->assertEquals(0.0, GradeCalculationService::percentageToGPA(40));
    }

    public function test_percentage_to_letter_grade(): void
    {
        $this->assertEquals('A', GradeCalculationService::percentageToLetterGrade(92)['letter']);
        $this->assertEquals('B', GradeCalculationService::percentageToLetterGrade(85)['letter']);
        $this->assertEquals('C', GradeCalculationService::percentageToLetterGrade(73)['letter']);
        $this->assertEquals('D', GradeCalculationService::percentageToLetterGrade(62)['letter']);
        $this->assertEquals('D-', GradeCalculationService::percentageToLetterGrade(53)['letter']);
        $this->assertEquals('F', GradeCalculationService::percentageToLetterGrade(30)['letter']);
    }

    public function test_percentage_to_letter_simple(): void
    {
        $this->assertEquals('A', GradeCalculationService::percentageToLetter(90));
        $this->assertEquals('F', GradeCalculationService::percentageToLetter(49));
    }

    public function test_aggregate_grades_single_subject(): void
    {
        $grades = collect([
            (object) ['grade_value' => 80, 'max_grade' => 100],
            (object) ['grade_value' => 90, 'max_grade' => 100],
        ]);

        $result = GradeCalculationService::aggregateGrades($grades);

        $this->assertEquals(170, $result['total_value']);
        $this->assertEquals(200, $result['total_max']);
        $this->assertEquals(85.0, $result['percentage']);
        $this->assertEquals(3.7, $result['gpa']);
        $this->assertEquals('B', $result['letter_grade']['letter']);
    }

    public function test_aggregate_grades_handles_empty(): void
    {
        $result = GradeCalculationService::aggregateGrades(collect());

        $this->assertEquals(0, $result['total_value']);
        $this->assertEquals(0, $result['total_max']);
        $this->assertEquals(0, $result['percentage']);
        $this->assertEquals(0.0, $result['gpa']);
    }

    public function test_weighted_gpa_with_different_credits(): void
    {
        // Subject A: 4 credits, GPA 4.0 (90%+)
        // Subject B: 2 credits, GPA 2.0 (60-64%)
        // Expected: (4.0*4 + 2.0*2) / (4+2) = (16+4)/6 = 3.33
        $subjects = [
            ['gpa' => 4.0, 'credits' => 4],
            ['gpa' => 2.0, 'credits' => 2],
        ];

        $result = GradeCalculationService::calculateWeightedGPA($subjects);

        $this->assertEquals(3.33, $result['gpa']);
        $this->assertEquals(6, $result['total_credits']);
        $this->assertEquals(20.0, $result['total_weighted_points']);
    }

    public function test_weighted_gpa_equal_credits(): void
    {
        // Same credits → weighted GPA should equal simple average
        $subjects = [
            ['gpa' => 4.0, 'credits' => 3],
            ['gpa' => 2.0, 'credits' => 3],
        ];

        $result = GradeCalculationService::calculateWeightedGPA($subjects);

        $this->assertEquals(3.0, $result['gpa']);
        $this->assertEquals(6, $result['total_credits']);
    }

    public function test_weighted_gpa_skips_zero_credits(): void
    {
        $subjects = [
            ['gpa' => 4.0, 'credits' => 3],
            ['gpa' => 2.0, 'credits' => 0],  // should be skipped
        ];

        $result = GradeCalculationService::calculateWeightedGPA($subjects);

        $this->assertEquals(4.0, $result['gpa']);
        $this->assertEquals(3, $result['total_credits']);
    }

    public function test_weighted_gpa_empty_input(): void
    {
        $result = GradeCalculationService::calculateWeightedGPA([]);

        $this->assertEquals(0.0, $result['gpa']);
        $this->assertEquals(0, $result['total_credits']);
    }

    public function test_weighted_gpa_real_world_scenario(): void
    {
        // Typical semester: 5 subjects with varying credits
        $subjects = [
            ['gpa' => 4.0, 'credits' => 3],  // A subject, 3 credits
            ['gpa' => 3.3, 'credits' => 3],  // B subject, 3 credits
            ['gpa' => 2.7, 'credits' => 2],  // C subject, 2 credits
            ['gpa' => 3.7, 'credits' => 4],  // B+ subject, 4 credits
            ['gpa' => 1.0, 'credits' => 2],  // D- subject, 2 credits
        ];

        // (4.0*3 + 3.3*3 + 2.7*2 + 3.7*4 + 1.0*2) / (3+3+2+4+2)
        // = (12 + 9.9 + 5.4 + 14.8 + 2.0) / 14
        // = 44.1 / 14 = 3.15
        $result = GradeCalculationService::calculateWeightedGPA($subjects);

        $this->assertEquals(3.15, $result['gpa']);
        $this->assertEquals(14, $result['total_credits']);
    }
}
