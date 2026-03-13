<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AppUser;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Department;
use App\Models\StudentGrade;
use App\Models\Semester;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GradeTest extends TestCase
{
    use RefreshDatabase;

    private string $token;
    private Student $student;
    private Subject $subject;
    private Teacher $teacher;
    private Semester $semester;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::create([
            'name' => 'Manager',
            'email' => 'manager@example.com',
            'password' => Hash::make('password'),
        ]);

        AppUser::create([
            'auth_user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'role' => 'manager',
            'status' => 'active',
        ]);

        $this->token = auth('api')->login($user);

        $department = Department::create([
            'name' => 'قسم اختبار',
            'name_en' => 'Test Dept',
            'is_active' => true,
        ]);

        $this->student = Student::create([
            'id' => 'ST260001',
            'name' => 'Grade Student',
            'email' => 'gradestudent@example.com',
            'national_id_passport' => 'NIDGRADE',
            'department_id' => $department->id,
        ]);

        $this->teacher = Teacher::create([
            'name' => 'Grade Teacher',
            'email' => 'teacher@example.com',
            'department_id' => $department->id,
        ]);

        $this->subject = Subject::create([
            'name' => 'مادة اختبار',
            'code' => 'TST101',
            'credits' => 3,
            'department_id' => $department->id,
        ]);

        $this->semester = Semester::create([
            'name' => 'الفصل الأول',
            'code' => 'S1',
            'is_current' => true,
        ]);
    }

    private function authHeader(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_can_create_grade(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/grades', [
                'student_id' => $this->student->id,
                'subject_id' => $this->subject->id,
                'teacher_id' => $this->teacher->id,
                'semester_id' => $this->semester->id,
                'grade_type' => 'midterm',
                'grade_name' => 'امتحان نصفي',
                'grade_value' => 85,
                'max_grade' => 100,
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['grade_value' => '85.00']);

        $this->assertDatabaseHas('student_grades', [
            'student_id' => $this->student->id,
            'subject_id' => $this->subject->id,
        ]);
    }

    public function test_grade_value_cannot_exceed_max(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/grades', [
                'student_id' => $this->student->id,
                'subject_id' => $this->subject->id,
                'teacher_id' => $this->teacher->id,
                'grade_type' => 'quiz',
                'grade_name' => 'Quiz 1',
                'grade_value' => 110,
                'max_grade' => 100,
            ]);

        $response->assertStatus(422);
    }

    public function test_can_update_grade(): void
    {
        $grade = StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $this->subject->id,
            'teacher_id' => $this->teacher->id,
            'semester_id' => $this->semester->id,
            'grade_type' => 'assignment',
            'grade_name' => 'Assignment 1',
            'grade_value' => 70,
            'max_grade' => 100,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/grades/{$grade->id}", [
                'grade_value' => 80,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['grade_value' => '80.00']);
    }

    public function test_can_get_student_subject_grades(): void
    {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $this->subject->id,
            'teacher_id' => $this->teacher->id,
            'semester_id' => $this->semester->id,
            'grade_type' => 'midterm',
            'grade_name' => 'Midterm',
            'grade_value' => 80,
            'max_grade' => 100,
            'is_published' => true,
        ]);

        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $this->subject->id,
            'teacher_id' => $this->teacher->id,
            'semester_id' => $this->semester->id,
            'grade_type' => 'final',
            'grade_name' => 'Final',
            'grade_value' => 90,
            'max_grade' => 100,
            'is_published' => true,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/grades/student/{$this->student->id}/subject/{$this->subject->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'grades',
                'total_value',
                'total_max',
                'percentage',
                'letter_grade',
                'gpa',
                'status',
            ])
            ->assertJsonFragment(['status' => 'passed']);
    }
}
