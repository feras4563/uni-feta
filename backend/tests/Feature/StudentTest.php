<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AppUser;
use App\Models\Student;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::create([
            'name' => 'Manager',
            'email' => 'manager@example.com',
            'password' => Hash::make('password'),
        ]);

        $appUser = AppUser::create([
            'auth_user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'role' => 'manager',
            'status' => 'active',
        ]);

        // Ensure manager role exists with full permissions
        if (\App\Models\Role::count() === 0) {
            \App\Models\Role::create([
                'name' => 'manager',
                'display_name' => 'Manager',
                'is_system' => true,
                'permissions' => json_encode(['students' => ['view', 'create', 'edit', 'delete']]),
            ]);
        }

        $this->token = auth('api')->login($user);
    }

    private function authHeader(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_can_list_students(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/students');

        $response->assertStatus(200);
    }

    public function test_can_create_student(): void
    {
        $department = Department::create([
            'name' => 'قسم اختبار',
            'name_en' => 'Test Department',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/students', [
                'name' => 'طالب اختبار',
                'name_en' => 'Test Student',
                'email' => 'student@example.com',
                'national_id_passport' => 'NID12345',
                'department_id' => $department->id,
                'year' => 1,
                'status' => 'active',
                'gender' => 'male',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'name', 'email', 'campus_id']);

        $this->assertDatabaseHas('students', ['email' => 'student@example.com']);
    }

    public function test_create_student_validation_fails_without_name(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/students', [
                'email' => 'noname@example.com',
                'national_id_passport' => 'NID99999',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_student_generates_login_credentials(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/students', [
                'name' => 'طالب بحساب',
                'email' => 'withaccount@example.com',
                'national_id_passport' => 'NID55555',
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['login_credentials' => ['email', 'password']]);

        $this->assertDatabaseHas('users', ['email' => 'withaccount@example.com']);
    }

    public function test_can_show_student(): void
    {
        $student = Student::create([
            'id' => 'ST250001',
            'name' => 'Show Test',
            'email' => 'show@example.com',
            'national_id_passport' => 'NIDSHOW',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/students/{$student->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Show Test']);
    }

    public function test_can_update_student(): void
    {
        $student = Student::create([
            'id' => 'ST250002',
            'name' => 'Before Update',
            'email' => 'update@example.com',
            'national_id_passport' => 'NIDUPD',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/students/{$student->id}", [
                'name' => 'After Update',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'After Update']);
    }

    public function test_can_delete_student(): void
    {
        $student = Student::create([
            'id' => 'ST250003',
            'name' => 'Delete Me',
            'email' => 'delete@example.com',
            'national_id_passport' => 'NIDDEL',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/students/{$student->id}");

        $response->assertStatus(200);

        // With soft deletes, the record should still exist but be soft-deleted
        $this->assertSoftDeleted('students', ['id' => $student->id]);
    }

    public function test_duplicate_email_rejected(): void
    {
        Student::create([
            'id' => 'ST250004',
            'name' => 'Existing',
            'email' => 'existing@example.com',
            'national_id_passport' => 'NIDEX1',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/students', [
                'name' => 'Duplicate',
                'email' => 'existing@example.com',
                'national_id_passport' => 'NIDEX2',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
