-- ============================================================================
-- COMPLETE RBAC (Role-Based Access Control) Setup for UniERP
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- 1. Create custom user roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create users table for application users (separate from auth.users)
CREATE TABLE IF NOT EXISTS app_users (
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

-- 3. Create permissions table for future extensibility
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  resource VARCHAR(50) NOT NULL, -- students, fees, teachers, departments, finance
  actions TEXT[] NOT NULL, -- ['view', 'create', 'edit', 'delete']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default permissions (clear existing first)
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

-- 5. Create audit log table for tracking user actions
CREATE TABLE IF NOT EXISTS user_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- create, update, delete, view
  resource VARCHAR(50) NOT NULL, -- students, fees, etc.
  resource_id VARCHAR(100), -- ID of the affected resource
  details JSONB, -- Additional action details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_role_param user_role)
RETURNS TABLE (
  resource VARCHAR(50),
  actions TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.resource, p.actions
  FROM permissions p
  WHERE p.role = user_role_param;
END;
$$;

-- 7. Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  user_role_param user_role,
  resource_param VARCHAR(50),
  action_param VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_actions TEXT[];
BEGIN
  SELECT actions INTO user_actions
  FROM permissions
  WHERE role = user_role_param AND resource = resource_param;
  
  RETURN action_param = ANY(user_actions);
END;
$$;

-- 8. Create function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  user_id_param UUID,
  action_param VARCHAR(50),
  resource_param VARCHAR(50),
  resource_id_param VARCHAR(100) DEFAULT NULL,
  details_param JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_actions_log (user_id, action, resource, resource_id, details)
  VALUES (user_id_param, action_param, resource_param, resource_id_param, details_param);
END;
$$;

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Add updated_at trigger to app_users
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at 
  BEFORE UPDATE ON app_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Enable Row Level Security on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions_log ENABLE ROW LEVEL SECURITY;

-- 12. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can create users" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can delete users" ON app_users;

-- Create RLS policies for app_users table
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (
    auth.uid() = auth_user_id OR 
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Only managers can create users" ON app_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (
    auth.uid() = auth_user_id OR 
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Only managers can delete users" ON app_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() AND role = 'manager'
    )
  );

-- 13. Enable RLS on existing tables and create policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Role-based students access" ON students;
DROP POLICY IF EXISTS "Role-based fees access" ON fees;
DROP POLICY IF EXISTS "Only managers can access teachers" ON teachers;
DROP POLICY IF EXISTS "Only managers can access departments" ON departments;

-- Create RLS policies for existing tables
CREATE POLICY "Role-based students access" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid() 
      AND (
        au.role = 'manager' OR 
        (au.role = 'staff' AND auth.jwt() ->> 'role' = 'authenticated')
      )
    )
  );

CREATE POLICY "Role-based fees access" ON fees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid() 
      AND (
        au.role = 'manager' OR 
        (au.role = 'staff' AND auth.jwt() ->> 'role' = 'authenticated')
      )
    )
  );

CREATE POLICY "Only managers can access teachers" ON teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid() AND au.role = 'manager'
    )
  );

CREATE POLICY "Only managers can access departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.auth_user_id = auth.uid() AND au.role = 'manager'
    )
  );

-- 14. Create function to get current user info
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role user_role,
  status VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email, au.full_name, au.role, au.status
  FROM app_users au
  WHERE au.auth_user_id = auth.uid();
END;
$$;

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id ON app_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_actions_log_user_id ON user_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_log_created_at ON user_actions_log(created_at);

-- 16. Show completion message
SELECT 'RBAC setup completed successfully!' as message;
SELECT 'Next: Create users in Authentication > Users, then run the user linking queries.' as next_step;
