-- ============================================================================
-- Fix RBAC Policies - This should resolve the 500 error
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- 1. First, let's make sure the app_users table exists with correct structure
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES app_users(id),
  
  CONSTRAINT unique_auth_user UNIQUE(auth_user_id)
);

-- 2. Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can create users" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can delete users" ON app_users;

-- 3. Temporarily disable RLS to insert test data
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 4. Create or update the test users
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'manager@university.edu' THEN 'مدير النظام'
    WHEN email = 'staff@university.edu' THEN 'موظف النظام'
    ELSE 'مستخدم النظام'
  END,
  CASE 
    WHEN email = 'manager@university.edu' THEN 'manager'
    ELSE 'staff'
  END,
  'active'
FROM auth.users 
WHERE email IN ('manager@university.edu', 'staff@university.edu')
ON CONFLICT (auth_user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 5. Re-enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 6. Create simpler, working RLS policies
CREATE POLICY "Allow authenticated users to read app_users" ON app_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to read own profile" ON app_users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Allow managers to manage users" ON app_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users manager_check
      WHERE manager_check.auth_user_id = auth.uid() 
      AND manager_check.role = 'manager'
    )
  );

CREATE POLICY "Allow users to update own profile" ON app_users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- 7. Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  actions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Insert permissions
DELETE FROM permissions;
INSERT INTO permissions (role, resource, actions) VALUES
-- Manager permissions (full access)
('manager', 'students', ARRAY['view', 'create', 'edit', 'delete']),
('manager', 'fees', ARRAY['view', 'create', 'edit', 'delete']),
('manager', 'teachers', ARRAY['view', 'create', 'edit', 'delete']),
('manager', 'departments', ARRAY['view', 'create', 'edit', 'delete']),
('manager', 'finance', ARRAY['view', 'create', 'edit', 'delete']),
('manager', 'users', ARRAY['view', 'create', 'edit', 'delete']),

-- Staff permissions (limited access)
('staff', 'students', ARRAY['view', 'create']),
('staff', 'fees', ARRAY['view', 'create']);

-- 9. Enable RLS on permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read permissions" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Update existing table policies to be more permissive
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Role-based students access" ON students;
CREATE POLICY "Allow authenticated users to access students" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role IN ('manager', 'staff')
    )
  );

ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Role-based fees access" ON fees;
CREATE POLICY "Allow authenticated users to access fees" ON fees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role IN ('manager', 'staff')
    )
  );

-- 11. Keep teachers and departments manager-only
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only managers can access teachers" ON teachers;
CREATE POLICY "Only managers can access teachers" ON teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid() AND au.role = 'manager'
    )
  );

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only managers can access departments" ON departments;
CREATE POLICY "Only managers can access departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid() AND au.role = 'manager'
    )
  );

-- 12. Verify the setup
SELECT 'Setup completed!' as status;

SELECT 
  'Users created:' as info,
  COUNT(*) as count
FROM app_users;

SELECT 
  email,
  role,
  status
FROM app_users
ORDER BY role DESC;
