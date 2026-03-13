<?php

namespace Tests\Unit;

use App\Models\Student;
use App\Models\Subject;
use App\Models\Department;
use App\Models\AccountDefault;
use App\Models\StudentSubjectEnrollment;
use App\Services\EnrollmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private Department $department;
    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->department = Department::create([
            'name' => 'قسم اختبار',
            'name_en' => 'Test Department',
            'is_active' => true,
        ]);

        $this->student = Student::create([
            'id' => 'ST260010',
            'name' => 'Service Test Student',
            'email' => 'svctest@example.com',
            'national_id_passport' => 'NIDSVC',
            'department_id' => $this->department->id,
        ]);
    }

    public function test_validate_subjects_exist_passes_for_valid_ids(): void
    {
        $subject = Subject::create([
            'name' => 'مادة 1',
            'code' => 'SVC101',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        $result = EnrollmentService::validateSubjectsExist([$subject->id]);

        $this->assertTrue($result['valid']);
        $this->assertCount(1, $result['subjects']);
    }

    public function test_validate_subjects_exist_fails_for_missing_ids(): void
    {
        $result = EnrollmentService::validateSubjectsExist(['nonexistent-id']);

        $this->assertFalse($result['valid']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_validate_subjects_department_passes(): void
    {
        $subject = Subject::create([
            'name' => 'مادة قسم',
            'code' => 'DEPT101',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        $subjects = collect([$subject]);
        $result = EnrollmentService::validateSubjectsDepartment($subjects, $this->department->id);

        $this->assertTrue($result['valid']);
    }

    public function test_validate_subjects_department_fails_for_wrong_dept(): void
    {
        $otherDept = Department::create([
            'name' => 'قسم آخر',
            'name_en' => 'Other Dept',
            'is_active' => true,
        ]);

        $subject = Subject::create([
            'name' => 'مادة أخرى',
            'code' => 'OTH101',
            'credits' => 3,
            'department_id' => $otherDept->id,
        ]);

        $subjects = collect([$subject]);
        $result = EnrollmentService::validateSubjectsDepartment($subjects, $this->department->id);

        $this->assertFalse($result['valid']);
    }

    public function test_validate_default_accounts_fails_when_not_configured(): void
    {
        $result = EnrollmentService::validateDefaultAccounts();

        $this->assertFalse($result['valid']);
    }

    public function test_check_prerequisites_returns_empty_when_no_prereqs(): void
    {
        $subject = Subject::create([
            'name' => 'مادة بدون متطلبات',
            'code' => 'NOPRE101',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        $errors = EnrollmentService::checkPrerequisites($this->student->id, [$subject->id]);

        $this->assertEmpty($errors);
    }

    public function test_check_prerequisites_detects_missing_prereqs(): void
    {
        $prereq = Subject::create([
            'name' => 'مادة مطلوبة',
            'code' => 'PRE101',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        $subject = Subject::create([
            'name' => 'مادة بمتطلبات',
            'code' => 'ADV201',
            'credits' => 3,
            'department_id' => $this->department->id,
        ]);

        // Set prerequisite relationship
        $subject->prerequisiteSubjects()->attach($prereq->id);

        $errors = EnrollmentService::checkPrerequisites($this->student->id, [$subject->id]);

        $this->assertNotEmpty($errors);
        $this->assertEquals('ADV201', $errors[0]['subject_code']);
    }

    public function test_create_subject_enrollments_skips_duplicates(): void
    {
        $subject = Subject::create([
            'name' => 'مادة تكرار',
            'code' => 'DUP101',
            'credits' => 3,
            'department_id' => $this->department->id,
            'semester_number' => 1,
        ]);

        $semester = \App\Models\Semester::create([
            'name' => 'الفصل 1',
            'code' => 'S1',
            'is_current' => true,
        ]);

        $studyYear = \App\Models\StudyYear::create([
            'name' => '2025-2026',
            'is_current' => true,
        ]);

        // Create first enrollment
        $result1 = EnrollmentService::createSubjectEnrollments(
            $this->student->id,
            [$subject->id],
            $semester->id,
            $studyYear->id,
            $this->department->id,
            1,
            false
        );

        $this->assertCount(1, $result1['enrollments']);

        // Try to enroll again — should skip
        $result2 = EnrollmentService::createSubjectEnrollments(
            $this->student->id,
            [$subject->id],
            $semester->id,
            $studyYear->id,
            $this->department->id,
            1,
            false
        );

        $this->assertCount(0, $result2['enrollments']);
    }
}
