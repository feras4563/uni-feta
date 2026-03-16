<?php

namespace Tests\Unit;

use App\Models\Student;
use App\Models\Department;
use App\Models\Semester;
use App\Models\StudentSemesterRegistration;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudyYear;
use App\Models\Subject;
use App\Services\StudentPortalService;
use App\Services\GradeCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPortalServiceTest extends TestCase
{
    use RefreshDatabase;

    private Department $department;
    private Student $student;
    private Semester $semester;

    protected function setUp(): void
    {
        parent::setUp();

        $this->department = Department::create([
            'name' => 'قسم اختبار',
            'name_en' => 'Test Department',
            'is_active' => true,
        ]);

        $this->student = Student::create([
            'id' => 'ST260020',
            'name' => 'Portal Test Student',
            'email' => 'portal@example.com',
            'national_id_passport' => 'NIDPORTAL',
            'department_id' => $this->department->id,
        ]);

        $this->semester = Semester::create([
            'name' => 'الفصل الأول',
            'code' => 'S1',
            'is_current' => true,
        ]);
    }

    public function test_get_student_group_ids_returns_empty_for_unregistered(): void
    {
        $groupIds = StudentPortalService::getStudentGroupIds($this->student);

        $this->assertTrue($groupIds->isEmpty());
    }

    public function test_get_enrolled_subject_ids_returns_enrolled_subjects(): void
    {
        $subject = Subject::create([
            'name' => 'مادة بوابة',
            'code' => 'PTL101',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        $studyYear = StudyYear::create(['name' => '2025-2026', 'is_current' => true]);

        StudentSubjectEnrollment::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'semester_id' => $this->semester->id,
            'study_year_id' => $studyYear->id,
            'department_id' => $this->department->id,
            'semester_number' => 1,
            'enrollment_date' => now(),
            'status' => 'enrolled',
        ]);

        $ids = StudentPortalService::getEnrolledSubjectIds($this->student);

        $this->assertCount(1, $ids);
        $this->assertEquals($subject->id, $ids->first());
    }

    public function test_get_enrolled_subject_ids_excludes_dropped(): void
    {
        $subject = Subject::create([
            'name' => 'مادة محذوفة',
            'code' => 'DRP101',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        $studyYear = StudyYear::create(['name' => '2025-2026', 'is_current' => true]);

        StudentSubjectEnrollment::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'semester_id' => $this->semester->id,
            'study_year_id' => $studyYear->id,
            'department_id' => $this->department->id,
            'semester_number' => 1,
            'enrollment_date' => now(),
            'status' => 'dropped',
        ]);

        $ids = StudentPortalService::getEnrolledSubjectIds($this->student);

        $this->assertTrue($ids->isEmpty());
    }

    public function test_get_schedule_context_includes_registrations(): void
    {
        $studyYear = StudyYear::create(['name' => '2025-2026', 'is_current' => true]);

        StudentSemesterRegistration::create([
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
            'study_year_id' => $studyYear->id,
            'department_id' => $this->department->id,
            'semester_number' => 1,
            'registration_date' => now(),
            'status' => 'active',
        ]);

        $ctx = StudentPortalService::getScheduleContext($this->student);

        $this->assertArrayHasKey('group_ids', $ctx);
        $this->assertArrayHasKey('subject_ids', $ctx);
        $this->assertArrayHasKey('semester_department_pairs', $ctx);
        $this->assertArrayHasKey('department_ids', $ctx);
        $this->assertCount(1, $ctx['semester_department_pairs']);
    }

    public function test_aggregate_grades_calculates_correctly(): void
    {
        $grades = collect([
            (object) ['grade_value' => 80, 'max_grade' => 100],
            (object) ['grade_value' => 90, 'max_grade' => 100],
        ]);

        $result = StudentPortalService::aggregateGrades($grades);

        $this->assertEquals(170, $result['total_value']);
        $this->assertEquals(200, $result['total_max']);
        $this->assertEquals(85.0, $result['percentage']);
        $this->assertEquals(3.7, $result['gpa']);
        $this->assertEquals('B', $result['letter_grade']['letter']);
    }

    public function test_aggregate_grades_handles_empty(): void
    {
        $result = StudentPortalService::aggregateGrades(collect());

        $this->assertEquals(0, $result['total_value']);
        $this->assertEquals(0, $result['percentage']);
        $this->assertEquals(0.0, $result['gpa']);
    }
}
