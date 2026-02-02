-- ============================================================================
-- Troubleshooting RBAC Setup Issues
-- Run these queries one by one to diagnose the problem
-- ============================================================================

-- 1. Check if app_users table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'app_users';

-- 2. Check if user_role enum exists
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'user_role';

-- 3. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;

-- 4. Check if any app_users exist
SELECT COUNT(*) as user_count FROM app_users;

-- 5. Check specific user that's failing
SELECT 
    id,
    auth_user_id,
    email,
    full_name,
    role,
    status
FROM app_users 
WHERE auth_user_id = '614eca7c-1670-461e-8f69-d130f4e79559';

-- 6. Check all auth users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- 7. Check RLS policies on app_users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'app_users';

-- 8. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('app_users', 'permissions', 'students', 'fees');

-- 9. Try to create a simple test query (this will help identify the exact issue)
SELECT 'Testing basic app_users access...' as test_message;

-- 10. Check permissions table
SELECT role, resource, actions FROM permissions ORDER BY role, resource;

-- ============================================================================
-- POTENTIAL FIXES
-- ============================================================================

-- If app_users table doesn't exist, create it:
-- (Uncomment and run if needed)

/*
CREATE TYPE user_role AS ENUM ('manager', 'staff');

CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES app_users(id),
  
  CONSTRAINT unique_auth_user UNIQUE(auth_user_id)
);
*/

-- If RLS is causing issues, temporarily disable it for testing:
-- (Uncomment and run if needed, but remember to re-enable it later)

/*
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
*/

-- Re-enable RLS after testing:
/*
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
*/
