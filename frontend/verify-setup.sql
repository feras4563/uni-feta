-- ============================================================================
-- Verify RBAC Setup - Run this to check everything is working
-- ============================================================================

-- 1. Check auth users
SELECT 
  'Auth Users:' as info,
  COUNT(*) as count
FROM auth.users;

SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users 
WHERE email IN ('manager@university.edu', 'staff@university.edu')
ORDER BY email;

-- 2. Check app_users table exists and has data
SELECT 
  'App Users:' as info,
  COUNT(*) as count
FROM app_users;

SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  role,
  status,
  created_at
FROM app_users
ORDER BY role DESC;

-- 3. Check if auth_user_id matches between tables
SELECT 
  'Matching Users:' as info,
  au.email,
  au.role,
  auth_u.email as auth_email,
  CASE 
    WHEN au.auth_user_id = auth_u.id THEN '✅ Match'
    ELSE '❌ No Match'
  END as id_match
FROM app_users au
LEFT JOIN auth.users auth_u ON au.auth_user_id = auth_u.id
ORDER BY au.email;

-- 4. Check permissions
SELECT 
  'Permissions:' as info,
  COUNT(*) as count
FROM permissions;

SELECT role, resource, array_to_string(actions, ', ') as actions
FROM permissions
ORDER BY role, resource;

-- 5. Check RLS status
SELECT 
  'RLS Status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('app_users', 'permissions', 'students', 'fees', 'teachers', 'departments')
ORDER BY tablename;

-- 6. Test a simple query that the app would make
SELECT 
  'Test Query:' as info,
  'This simulates what the app does after login' as description;

-- This is what getCurrentUser() tries to do:
-- (Replace the UUID with an actual auth_user_id from above)
-- SELECT * FROM app_users WHERE auth_user_id = 'YOUR_AUTH_USER_ID_HERE';
