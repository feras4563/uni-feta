<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AppUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'staff',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user',
                'app_user',
                'access_token',
                'token_type',
                'expires_in',
            ]);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $this->assertDatabaseHas('app_users', ['email' => 'test@example.com', 'role' => 'staff']);
    }

    public function test_register_validation_fails_without_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login(): void
    {
        $user = User::create([
            'name' => 'Login Test',
            'email' => 'login@example.com',
            'password' => Hash::make('password123'),
        ]);

        AppUser::create([
            'auth_user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'role' => 'staff',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'expires_in',
                'user',
                'app_user',
                'permissions',
            ]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::create([
            'name' => 'Wrong Pass',
            'email' => 'wrong@example.com',
            'password' => Hash::make('correctpass'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'wrong@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::create([
            'name' => 'Profile Test',
            'email' => 'profile@example.com',
            'password' => Hash::make('password123'),
        ]);

        AppUser::create([
            'auth_user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'role' => 'manager',
            'status' => 'active',
        ]);

        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'app_user', 'permissions']);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::create([
            'name' => 'Change Pass',
            'email' => 'changepass@example.com',
            'password' => Hash::make('oldpassword'),
        ]);

        AppUser::create([
            'auth_user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'role' => 'staff',
            'status' => 'active',
        ]);

        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/change-password', [
                'current_password' => 'oldpassword',
                'new_password' => 'newpassword',
                'new_password_confirmation' => 'newpassword',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password successfully changed']);
    }
}
