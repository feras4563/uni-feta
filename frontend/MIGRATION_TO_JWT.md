# Migration from Supabase to JWT Authentication

## Overview
This guide explains how to migrate your frontend from Supabase authentication to JWT authentication with your Laravel backend.

---

## Files Created

### ✅ New Authentication Files
1. **`src/lib/jwt-auth.ts`** - JWT authentication functions
2. **`src/contexts/JWTAuthContext.tsx`** - JWT auth context provider
3. **`src/lib/api-client.ts`** - API client with JWT token handling

### 📝 Files to Update
1. **`src/main.tsx`** or **`src/App.tsx`** - Switch auth provider
2. **`.env.local`** - Add API URL configuration

---

## Step-by-Step Migration

### Step 1: Update Environment Variables

Create or update `.env.local`:

```env
# Laravel API URL
VITE_API_URL=http://localhost:8000/api

# Optional: Keep Supabase config for gradual migration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Update Main App File

Find your main app file (usually `src/main.tsx` or `src/App.tsx`) and replace the auth provider:

**Before (Supabase):**
```tsx
import { AuthProvider } from './contexts/AuthContext';

// In your app
<AuthProvider>
  <App />
</AuthProvider>
```

**After (JWT):**
```tsx
import { JWTAuthProvider } from './contexts/JWTAuthContext';

// In your app
<JWTAuthProvider>
  <App />
</JWTAuthProvider>
```

### Step 3: Update API Calls

Replace Supabase API calls with the new API client.

**Before (Supabase):**
```typescript
import { supabase } from './lib/supabase';

// Fetch students
const { data, error } = await supabase
  .from('students')
  .select('*')
  .order('created_at', { ascending: false });
```

**After (JWT):**
```typescript
import { api } from './lib/api-client';

// Fetch students
const data = await api.get('/students', {
  order_by: 'created_at',
  order_dir: 'desc'
});
```

### Step 4: Update Specific API Files

Update your API files to use the new JWT client:

#### Example: `src/lib/clean-student-api.ts`

**Before:**
```typescript
import { supabase } from './supabase';

export async function fetchAllStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*, departments(id, name, name_en)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

**After:**
```typescript
import { api } from './api-client';

export async function fetchAllStudents() {
  const data = await api.get('/students', {
    order_by: 'created_at',
    order_dir: 'desc'
  });
  return data || [];
}
```

---

## API Endpoint Mapping

### Supabase → Laravel JWT

| Supabase Pattern | Laravel JWT Endpoint |
|-----------------|---------------------|
| `.from('students').select('*')` | `GET /api/students` |
| `.from('students').insert(data)` | `POST /api/students` |
| `.from('students').update(data).eq('id', id)` | `PUT /api/students/{id}` |
| `.from('students').delete().eq('id', id)` | `DELETE /api/students/{id}` |
| `.from('students').select('*').eq('status', 'active')` | `GET /api/students?status=active` |
| `.from('students').select('*').ilike('name', '%search%')` | `GET /api/students?search=search` |

---

## Authentication Flow Comparison

### Supabase Flow
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get user
const { data: { user } } = await supabase.auth.getUser();

// Logout
await supabase.auth.signOut();
```

### JWT Flow
```typescript
// Login
const user = await signIn({
  email: 'user@example.com',
  password: 'password'
});
// Token is automatically stored

// Get user
const user = await getCurrentUser();

// Logout
await signOut();
// Token is automatically removed
```

---

## Common Patterns

### 1. Fetching with Relationships

**Supabase:**
```typescript
const { data } = await supabase
  .from('students')
  .select('*, departments(id, name)')
  .eq('id', studentId)
  .single();
```

**JWT:**
```typescript
const data = await api.get(`/students/${studentId}`);
// Relationships are included automatically
```

### 2. Filtering and Searching

**Supabase:**
```typescript
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('department_id', deptId)
  .ilike('name', `%${search}%`);
```

**JWT:**
```typescript
const data = await api.get('/students', {
  department_id: deptId,
  search: search
});
```

### 3. Creating Records

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('students')
  .insert(studentData)
  .select()
  .single();
```

**JWT:**
```typescript
const data = await api.post('/students', studentData);
```

### 4. Updating Records

**Supabase:**
```typescript
const { data, error } = await supabase
  .from('students')
  .update(updates)
  .eq('id', id)
  .select()
  .single();
```

**JWT:**
```typescript
const data = await api.put(`/students/${id}`, updates);
```

### 5. Deleting Records

**Supabase:**
```typescript
const { error } = await supabase
  .from('students')
  .delete()
  .eq('id', id);
```

**JWT:**
```typescript
await api.delete(`/students/${id}`);
```

---

## Testing the Migration

### 1. Start Laravel Backend
```bash
cd backend
php artisan serve
```

### 2. Create Test User
```bash
php artisan tinker

$user = \App\Models\User::create([
    'name' => 'Test Manager',
    'email' => 'manager@test.com',
    'password' => bcrypt('password123')
]);

\App\Models\AppUser::create([
    'auth_user_id' => $user->id,
    'email' => $user->email,
    'full_name' => $user->name,
    'role' => 'manager',
    'status' => 'active'
]);
```

### 3. Test Login
Open your frontend and try logging in with:
- Email: `manager@test.com`
- Password: `password123`

### 4. Check Browser Console
You should see JWT authentication logs:
```
🔍 JWT: Initializing auth context...
🔍 JWT: Signing in: manager@test.com
✅ JWT: Login successful
```

### 5. Check Network Tab
- Login request to: `http://localhost:8000/api/auth/login`
- Subsequent requests should have `Authorization: Bearer {token}` header

---

## Gradual Migration Strategy

You can migrate gradually by keeping both systems:

### Option 1: Feature Flag
```typescript
const USE_JWT = import.meta.env.VITE_USE_JWT_AUTH === 'true';

// In your app
{USE_JWT ? (
  <JWTAuthProvider>
    <App />
  </JWTAuthProvider>
) : (
  <AuthProvider>
    <App />
  </AuthProvider>
)}
```

### Option 2: Separate Routes
```typescript
// JWT routes
<Route path="/jwt/*" element={
  <JWTAuthProvider>
    <JWTApp />
  </JWTAuthProvider>
} />

// Supabase routes (legacy)
<Route path="/*" element={
  <AuthProvider>
    <App />
  </AuthProvider>
} />
```

---

## Troubleshooting

### Issue: "Unauthorized" errors
**Solution:** Check that:
1. Laravel backend is running
2. Token is being sent in Authorization header
3. Token hasn't expired (default: 60 minutes)

### Issue: CORS errors
**Solution:** Update Laravel CORS config:
```php
// config/cors.php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:5173'], // Your frontend URL
```

### Issue: "Network Error"
**Solution:** Verify:
1. `VITE_API_URL` in `.env.local` is correct
2. Laravel backend is accessible at that URL
3. No firewall blocking the connection

### Issue: Token expired
**Solution:** Implement token refresh:
```typescript
import { refreshToken } from './lib/jwt-auth';

// Call before making API requests
await refreshToken();
```

---

## Rollback Plan

If you need to rollback to Supabase:

1. **Revert auth provider in main app:**
   ```tsx
   import { AuthProvider } from './contexts/AuthContext';
   ```

2. **Revert API calls to use Supabase:**
   ```typescript
   import { supabase } from './lib/supabase';
   ```

3. **Keep JWT files** for future migration

---

## Benefits of JWT Migration

✅ **Full Control** - Own your authentication system
✅ **No External Dependencies** - No Supabase subscription needed
✅ **Customizable** - Add custom auth logic as needed
✅ **Better Integration** - Direct connection to your Laravel backend
✅ **Cost Effective** - No per-user pricing
✅ **Offline Capable** - Works without internet (for local dev)

---

## Next Steps

1. ✅ Update `.env.local` with API URL
2. ✅ Switch to `JWTAuthProvider` in main app
3. ✅ Update API calls one file at a time
4. ✅ Test each feature after migration
5. ✅ Remove Supabase dependencies when complete

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Laravel logs: `storage/logs/laravel.log`
3. Verify JWT token in browser DevTools → Application → Local Storage
4. Test API endpoints with Postman or cURL

---

## Complete Example

See the example migration in the next section for a complete before/after comparison.
