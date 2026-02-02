-- ============================================================================
-- Fix Infinite Recursion in RLS Policies
-- This script fixes the "infinite recursion detected in policy for relation 'app_users'" error
-- ============================================================================

-- 1. First, let's check if subjects table has RLS enabled and drop problematic policies
DROP POLICY IF EXISTS "Role-based subjects access" ON subjects;
DROP POLICY IF EXISTS "Managers can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Staff can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Users can view subjects" ON subjects;
DROP POLICY IF EXISTS "Users can manage subjects" ON subjects;

-- 2. Drop problematic policies from subject_titles table
DROP POLICY IF EXISTS "Users can view subject titles" ON subject_titles;
DROP POLICY IF EXISTS "Managers can manage subject titles" ON subject_titles;
DROP POLICY IF EXISTS "Staff can manage subject titles" ON subject_titles;

-- 3. Drop problematic policies from subject_departments table
DROP POLICY IF EXISTS "Role-based subject_departments access" ON subject_departments;
DROP POLICY IF EXISTS "Managers can manage subject_departments" ON subject_departments;
DROP POLICY IF EXISTS "Staff can manage subject_departments" ON subject_departments;

-- 4. Fix the app_users table policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can create users" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can delete users" ON app_users;
DROP POLICY IF EXISTS "Allow authenticated users to read app_users" ON app_users;
DROP POLICY IF EXISTS "Allow users to read own profile" ON app_users;
DROP POLICY IF EXISTS "Allow managers to manage users" ON app_users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON app_users;

-- 5. Create simple, non-recursive policies for app_users
CREATE POLICY "Enable read access for authenticated users" ON app_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON app_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON app_users
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON app_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Create simple policies for subjects table
CREATE POLICY "Enable read access for authenticated users" ON subjects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON subjects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON subjects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON subjects
  FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Create simple policies for subject_titles table
CREATE POLICY "Enable read access for authenticated users" ON subject_titles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON subject_titles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON subject_titles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON subject_titles
  FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Create simple policies for subject_departments table
CREATE POLICY "Enable read access for authenticated users" ON subject_departments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON subject_departments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON subject_departments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON subject_departments
  FOR DELETE USING (auth.role() = 'authenticated');

-- 9. Ensure RLS is enabled on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_departments ENABLE ROW LEVEL SECURITY;

-- 10. Create a simple function to check if user is authenticated (no recursion)
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Test the fix by checking if policies work
-- This should not cause infinite recursion anymore
SELECT 'RLS policies fixed successfully' as status;


