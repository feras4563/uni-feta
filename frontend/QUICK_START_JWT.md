# Quick Start: Switch to JWT Authentication

## 🚀 Quick Migration (5 Minutes)

### Step 1: Create `.env.local`
Create a new file `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

### Step 2: Update `App.tsx`

Find this line in `src/App.tsx`:
```typescript
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { hasClientPermission } from "./lib/auth";
```

Replace with:
```typescript
import { JWTAuthProvider, useAuth } from "./contexts/JWTAuthContext";
import { hasClientPermission } from "./lib/jwt-auth";
```

Find this line at the bottom:
```typescript
<AuthProvider>
  <AppContent />
</AuthProvider>
```

Replace with:
```typescript
<JWTAuthProvider>
  <AppContent />
</JWTAuthProvider>
```

### Step 3: Start Laravel Backend

```bash
cd backend
php artisan serve
```

### Step 4: Create Test User

```bash
php artisan tinker
```

In tinker:
```php
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

exit
```

### Step 5: Test Login

1. Start your frontend: `npm run dev`
2. Go to login page
3. Login with:
   - Email: `manager@test.com`
   - Password: `password123`

✅ You're now using JWT authentication!

---

## 🔧 Update API Calls (Gradual)

### Example: Update Students API

**File:** `src/lib/clean-student-api.ts`

**Before (Supabase):**
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

**After (JWT):**
```typescript
import { api } from './api-client';

export async function fetchAllStudents() {
  try {
    const data = await api.get('/students', {
      order_by: 'created_at',
      order_dir: 'desc'
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}
```

---

## 📝 Common API Patterns

### GET Request
```typescript
import { api } from './lib/api-client';

// Simple GET
const students = await api.get('/students');

// GET with query params
const students = await api.get('/students', {
  search: 'john',
  status: 'active',
  department_id: '123'
});

// GET single item
const student = await api.get(`/students/${id}`);
```

### POST Request
```typescript
// Create new record
const newStudent = await api.post('/students', {
  name: 'John Doe',
  email: 'john@example.com',
  // ... other fields
});
```

### PUT/PATCH Request
```typescript
// Update record
const updated = await api.put(`/students/${id}`, {
  name: 'John Updated',
  status: 'active'
});
```

### DELETE Request
```typescript
// Delete record
await api.delete(`/students/${id}`);
```

---

## ✅ Verification Checklist

- [ ] `.env.local` created with `VITE_API_URL`
- [ ] `App.tsx` updated to use `JWTAuthProvider`
- [ ] Laravel backend running (`php artisan serve`)
- [ ] Test user created
- [ ] Can login successfully
- [ ] JWT token stored in localStorage
- [ ] API requests include Authorization header

---

## 🐛 Troubleshooting

### Can't login?
1. Check Laravel is running: `http://localhost:8000/api/health`
2. Check browser console for errors
3. Verify `.env.local` has correct API URL

### CORS errors?
Update `backend/config/cors.php`:
```php
'allowed_origins' => ['http://localhost:5173'],
```

### Token not working?
1. Check browser DevTools → Application → Local Storage
2. Look for `jwt_token` key
3. Try logging out and back in

---

## 📚 Next Steps

1. ✅ Test login/logout
2. ✅ Update one API file at a time
3. ✅ Test each feature after updating
4. ✅ Read full migration guide: `MIGRATION_TO_JWT.md`

---

## 🎉 Benefits

✅ No Supabase dependency
✅ Full control over authentication
✅ Direct backend integration
✅ Better performance
✅ No external API costs
