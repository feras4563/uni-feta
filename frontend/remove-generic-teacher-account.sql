-- Remove Generic Teacher Account
-- Run this in Supabase SQL Editor

-- Step 1: Find and remove any teacher record linked to teacher@university.edu
DELETE FROM public.teachers 
WHERE email = 'teacher@university.edu';

-- Step 2: Remove the auth user teacher@university.edu
DELETE FROM auth.users 
WHERE email = 'teacher@university.edu';

-- Step 3: Remove any app_users record (if exists)
DELETE FROM public.app_users 
WHERE email = 'teacher@university.edu';

-- Step 4: Verify removal
SELECT 'Auth Users' as table_name, email FROM auth.users WHERE email = 'teacher@university.edu'
UNION ALL
SELECT 'Teachers' as table_name, email FROM public.teachers WHERE email = 'teacher@university.edu'
UNION ALL
SELECT 'App Users' as table_name, email FROM public.app_users WHERE email = 'teacher@university.edu';

-- If the above query returns no rows, the generic teacher account has been successfully removed

-- Step 5: Verify individual teacher accounts still exist
SELECT 
  'Individual Teachers' as type,
  email,
  name,
  CASE 
    WHEN auth_user_id IS NOT NULL THEN 'Linked to Auth'
    ELSE 'Not Linked'
  END as auth_status
FROM public.teachers 
WHERE email != 'teacher@university.edu' 
  AND email IS NOT NULL
ORDER BY email;
