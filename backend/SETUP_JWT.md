# JWT Authentication Setup Guide

## Installation Steps

### Step 1: Install JWT Package
Run this command in your backend directory:

```bash
composer require php-open-source-saver/jwt-auth --ignore-platform-req=ext-sodium
```

Or if that doesn't work, try:

```bash
composer require tymon/jwt-auth
```

### Step 2: Publish JWT Configuration
After successful installation, publish the config:

```bash
php artisan vendor:publish --provider="PHPOpenSourceSaver\JWTAuth\Providers\LaravelServiceProvider"
```

Or for tymon/jwt-auth:

```bash
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
```

### Step 3: Generate JWT Secret Key
```bash
php artisan jwt:secret
```

This will automatically add `JWT_SECRET` to your `.env` file.

### Step 4: Add JWT Configuration to .env
Add these lines to your `.env` file (if not already added):

```env
JWT_SECRET=your-generated-secret-key
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_ALGO=HS256
JWT_BLACKLIST_ENABLED=true
JWT_BLACKLIST_GRACE_PERIOD=0
JWT_SHOW_BLACKLIST_EXCEPTION=true
```

### Step 5: Update config/auth.php
The file has already been updated with the JWT guard configuration:

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
        'hash' => false,
    ],
],
```

### Step 6: Test the Installation
Create a test user and try logging in:

```bash
# Create a user via tinker
php artisan tinker

# In tinker:
$user = \App\Models\User::create([
    'name' => 'Test User',
    'email' => 'test@example.com',
    'password' => bcrypt('password123')
]);

$appUser = \App\Models\AppUser::create([
    'auth_user_id' => $user->id,
    'email' => $user->email,
    'full_name' => $user->name,
    'role' => 'manager',
    'status' => 'active'
]);
```

### Step 7: Test Login Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Files Created

✅ **Controllers:**
- `app/Http/Controllers/Api/AuthController.php` - Authentication logic

✅ **Middleware:**
- `app/Http/Middleware/CheckRole.php` - Role-based access control
- `app/Http/Middleware/CheckPermission.php` - Permission-based access control

✅ **Models:**
- `app/Models/User.php` - Updated with JWT interface

✅ **Configuration:**
- `config/auth.php` - Updated with JWT guard
- `config/jwt.php` - JWT configuration

✅ **Routes:**
- `routes/api.php` - Updated with auth routes

✅ **Documentation:**
- `README_AUTH.md` - Complete authentication documentation
- `SETUP_JWT.md` - This file

---

## Authentication Endpoints

All endpoints are now available at:

### Public Endpoints (No Auth Required)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/health` - Health check

### Protected Endpoints (Auth Required)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `PUT /api/auth/profile` - Update profile

### All Other API Endpoints
All student, department, subject, teacher, etc. endpoints now require authentication.

---

## Quick Start Example

### 1. Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "manager"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response will include `access_token`.

### 3. Use Token for Protected Routes
```bash
curl -X GET http://localhost:8000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

---

## Troubleshooting

### Issue: "Class 'Tymon\JWTAuth\Contracts\JWTSubject' not found"
**Solution:** The JWT package is not installed. Run the composer require command above.

### Issue: "JWT_SECRET not set"
**Solution:** Run `php artisan jwt:secret` to generate the secret key.

### Issue: "Token could not be parsed"
**Solution:** Make sure you're sending the token in the Authorization header as `Bearer {token}`.

### Issue: Extension sodium is missing
**Solution:** 
1. Enable sodium extension in php.ini
2. Or use `--ignore-platform-req=ext-sodium` flag when installing

---

## Next Steps

1. ✅ Install JWT package
2. ✅ Generate JWT secret
3. ✅ Test authentication endpoints
4. ✅ Update frontend to use JWT tokens
5. ✅ Implement token refresh logic
6. ✅ Add role-based access control where needed

See `README_AUTH.md` for complete API documentation and usage examples.
