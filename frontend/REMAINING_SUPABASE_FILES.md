# Files Still Using Supabase

These files still have Supabase imports but won't cause immediate errors.
They can be migrated gradually as you use those features.

## High Priority (May cause errors)
- ✅ `src/hooks/useSystemSettings.ts` - FIXED
- ✅ `src/pages/InvoicePrintPage.tsx` - FIXED
- ✅ `src/lib/supabase.ts` - FIXED (made optional)

## Medium Priority (Used in main features)
- `src/lib/api.ts` - Main API file (204 Supabase references)
- `src/lib/clean-student-api.ts` - Student operations
- `src/lib/teacher-api.ts` - Teacher operations
- `src/lib/clean-subjects-api.ts` - Subject operations
- `src/lib/scheduling-api.ts` - Scheduling operations

## Low Priority (Specific features)
- `src/lib/fee-utils.ts` - Fee utilities
- `src/features/fees/FeeModal.tsx` - Fee modal
- `src/features/teachers/TeacherModal.tsx` - Teacher modal
- `src/pages/Teachers.tsx` - Teachers page
- `src/pages/Students.tsx` - Students page
- `src/pages/StudentDetail.tsx` - Student detail
- And others...

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
Migrate files as you use features:
1. Use the system normally
2. When you encounter a Supabase error, fix that specific file
3. Replace Supabase calls with JWT API calls

### Option 2: Bulk Migration
Migrate all files at once (time-consuming but complete)

## How to Migrate a File

### Before (Supabase):
```typescript
import { supabase } from './lib/supabase';

const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('status', 'active');

if (error) throw error;
return data;
```

### After (JWT):
```typescript
import { api } from './lib/api-client';

const data = await api.get('/students', {
  status: 'active'
});

return data;
```

## Quick Reference

| Supabase | JWT API |
|----------|---------|
| `.from('students').select('*')` | `api.get('/students')` |
| `.from('students').insert(data)` | `api.post('/students', data)` |
| `.from('students').update(data).eq('id', id)` | `api.put(\`/students/\${id}\`, data)` |
| `.from('students').delete().eq('id', id)` | `api.delete(\`/students/\${id}\`)` |
| `.eq('status', 'active')` | Query param: `{ status: 'active' }` |
| `.ilike('name', '%search%')` | Query param: `{ search: 'search' }` |

## For Now

The system will work with JWT authentication. Files using Supabase will either:
1. Use the placeholder client (won't work but won't crash)
2. Need to be migrated when you use that feature

Start using the system and migrate files as needed!
