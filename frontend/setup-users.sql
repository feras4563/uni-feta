-- ============================================================================
-- Create Users in Supabase for RBAC System
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- First, let's check if the app_users table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'app_users';

-- If you haven't run the main RBAC setup yet, you need to run the complete schema first
-- This is just the user creation part

-- ============================================================================
-- STEP 1: Create the users in Supabase Auth (if not done via dashboard)
-- ============================================================================
-- Note: It's better to create users via the Supabase Dashboard > Authentication > Users
-- But if you want to do it via SQL, you can use these (uncomment if needed):

-- INSERT INTO auth.users (
--   id,
--   instance_id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) VALUES (
--   gen_random_uuid(),
--   '00000000-0000-0000-0000-000000000000',
--   'manager@university.edu',
--   crypt('password123', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   '',
--   '',
--   '',
--   ''
-- );

-- ============================================================================
-- STEP 2: Link Auth Users to App Users (Run after creating users in dashboard)
-- ============================================================================

-- First, let's see what auth users exist
SELECT id, email, created_at FROM auth.users WHERE email IN ('manager@university.edu', 'staff@university.edu');

-- Insert manager user into app_users table
-- Replace the UUID below with the actual auth user ID from the query above
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
SELECT 
  id,
  'manager@university.edu',
  'مدير النظام',
  'manager',
  'active'
FROM auth.users 
WHERE email = 'manager@university.edu'
ON CONFLICT (auth_user_id) DO NOTHING;

-- Insert staff user into app_users table
-- Replace the UUID below with the actual auth user ID from the query above
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
SELECT 
  id,
  'staff@university.edu',
  'موظف النظام',
  'staff',
  'active'
FROM auth.users 
WHERE email = 'staff@university.edu'
ON CONFLICT (auth_user_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Verify the setup
-- ============================================================================

-- Check if users were created successfully
SELECT 
  au.email,
  au.full_name,
  au.role,
  au.status,
  au.created_at
FROM app_users au
WHERE au.email IN ('manager@university.edu', 'staff@university.edu');

-- Check permissions are set up
SELECT role, resource, actions FROM permissions ORDER BY role, resource;

-- ============================================================================
-- If you get errors, here are some troubleshooting queries:
-- ============================================================================

-- Check if auth users exist
-- SELECT * FROM auth.users WHERE email IN ('manager@university.edu', 'staff@university.edu');

-- Check if app_users table exists and has the right structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_users';

-- Check if permissions table exists
-- SELECT * FROM permissions LIMIT 5;
