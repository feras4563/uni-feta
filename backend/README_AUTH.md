# JWT Authentication System Documentation

## Setup Instructions

### 1. Install JWT Package
```bash
composer require php-open-source-saver/jwt-auth
```

### 2. Publish JWT Configuration
```bash
php artisan vendor:publish --provider="PHPOpenSourceSaver\JWTAuth\Providers\LaravelServiceProvider"
```

### 3. Generate JWT Secret
```bash
php artisan jwt:secret
```

This will add `JWT_SECRET` to your `.env` file.

### 4. Add JWT Configuration to .env
Add these lines to your `.env` file:
```env
JWT_SECRET=your-generated-secret-key
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_ALGO=HS256
JWT_BLACKLIST_ENABLED=true
```

### 5. Register Middleware (Optional)
Add to `bootstrap/app.php` or `app/Http/Kernel.php`:
```php
protected $middlewareAliases = [
    // ...
    'role' => \App\Http\Middleware\CheckRole::class,
    'permission' => \App\Http\Middleware\CheckPermission::class,
];
```

---

## API Endpoints

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "staff"
}
```

**Response:**
```json
{
  "message": "User successfully registered",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "app_user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "staff",
    "status": "active"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "app_user": {
    "id": "uuid",
    "role": "staff",
    "status": "active"
  },
  "permissions": {
    "students": ["view", "create"],
    "fees": ["view", "create"]
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "app_user": {
    "id": "uuid",
    "role": "staff",
    "status": "active"
  },
  "permissions": {
    "students": ["view", "create"],
    "fees": ["view", "create"]
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {...},
  "app_user": {...},
  "permissions": {...}
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

---

## Using Authentication in Requests

### With Bearer Token
Add the token to the Authorization header:

```javascript
// JavaScript/TypeScript
const response = await fetch('http://localhost:8000/api/students', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

```bash
# cURL
curl -X GET http://localhost:8000/api/students \
  -H "Authorization: Bearer your-token-here" \
  -H "Accept: application/json"
```

---

## User Roles and Permissions

### Available Roles
- **manager** - Full access to all resources
- **staff** - Limited access (students, fees - view and create only)
- **teacher** - Access to sessions, attendance, grades, schedules

### Permission Structure

#### Manager Permissions
```json
{
  "students": ["view", "create", "edit", "delete"],
  "fees": ["view", "create", "edit", "delete"],
  "teachers": ["view", "create", "edit", "delete"],
  "departments": ["view", "create", "edit", "delete"],
  "subjects": ["view", "create", "edit", "delete"],
  "finance": ["view", "create", "edit", "delete"],
  "users": ["view", "create", "edit", "delete"]
}
```

#### Staff Permissions
```json
{
  "students": ["view", "create"],
  "fees": ["view", "create"]
}
```

#### Teacher Permissions
```json
{
  "sessions": ["view", "create", "edit", "delete"],
  "attendance": ["view", "create", "edit"],
  "grades": ["view", "create", "edit", "delete"],
  "students": ["view"],
  "subjects": ["view"],
  "schedule": ["view", "edit"]
}
```

---

## Protecting Routes with Middleware

### Using Role Middleware
```php
// In routes/api.php
Route::middleware(['auth:api', 'role:manager'])->group(function () {
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);
});

// Multiple roles
Route::middleware(['auth:api', 'role:manager,staff'])->group(function () {
    Route::get('/students', [StudentController::class, 'index']);
});
```

### Using Permission Middleware
```php
// In routes/api.php
Route::middleware(['auth:api', 'permission:students,delete'])->group(function () {
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);
});
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 422 Validation Error
```json
{
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password confirmation does not match."]
  }
}
```

---

## Token Lifecycle

1. **Login** - Receive access token (valid for 60 minutes by default)
2. **Use Token** - Include in Authorization header for protected routes
3. **Refresh** - Get new token before expiry (within 2 weeks of original token)
4. **Logout** - Invalidate token (added to blacklist)

### Token Expiry
- **Access Token TTL**: 60 minutes (configurable via `JWT_TTL`)
- **Refresh Token TTL**: 20160 minutes / 2 weeks (configurable via `JWT_REFRESH_TTL`)

---

## Frontend Integration Example

### React/TypeScript Example

```typescript
// auth.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

class AuthService {
  async login(email: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();
```

```typescript
// api.interceptor.ts
import axios from 'axios';
import AuthService from './auth.service';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      AuthService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Implement token refresh** before expiry
4. **Validate tokens on every request**
5. **Use strong JWT secrets** (generate with `php artisan jwt:secret`)
6. **Enable token blacklisting** for logout
7. **Set appropriate token TTL** based on security requirements
8. **Implement rate limiting** on auth endpoints

---

## Troubleshooting

### "Token could not be parsed from the request"
- Ensure token is in Authorization header: `Bearer {token}`
- Check token format is correct

### "Token has expired"
- Use refresh endpoint to get new token
- Check JWT_TTL configuration

### "The token has been blacklisted"
- User has logged out, need to login again
- Token was invalidated

### "User not found"
- Token is valid but user was deleted
- Check user exists in database
