-- ============================================================================
-- Link Supabase Auth Users to App Users Table
-- Run this AFTER creating users in the Supabase Dashboard
-- ============================================================================

-- First, let's see what auth users exist
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email IN ('manager@university.edu', 'staff@university.edu')
ORDER BY email;

-- Link manager user to app_users table
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
SELECT 
  id,
  'manager@university.edu',
  'مدير النظام',
  'manager'::user_role,
  'active'
FROM auth.users 
WHERE email = 'manager@university.edu'
ON CONFLICT (auth_user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Link staff user to app_users table
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
SELECT 
  id,
  'staff@university.edu',
  'موظف النظام',
  'staff'::user_role,
  'active'
FROM auth.users 
WHERE email = 'staff@university.edu'
ON CONFLICT (auth_user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Verify the setup worked
SELECT 
  au.email,
  au.full_name,
  au.role,
  au.status,
  au.created_at,
  CASE 
    WHEN auth_users.email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as email_status
FROM app_users au
JOIN auth.users auth_users ON auth_users.id = au.auth_user_id
WHERE au.email IN ('manager@university.edu', 'staff@university.edu')
ORDER BY au.role DESC;

-- Check permissions are set up correctly
SELECT 
  role, 
  resource, 
  array_to_string(actions, ', ') as allowed_actions
FROM permissions 
ORDER BY 
  CASE WHEN role = 'manager' THEN 1 ELSE 2 END,
  resource;

-- Final verification message
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ SUCCESS: Both users created and linked successfully!'
    WHEN COUNT(*) = 1 THEN '⚠️  WARNING: Only one user was created. Check the auth.users table.'
    ELSE '❌ ERROR: No users were linked. Check if users exist in auth.users table.'
  END as setup_status
FROM app_users 
WHERE email IN ('manager@university.edu', 'staff@university.edu');
