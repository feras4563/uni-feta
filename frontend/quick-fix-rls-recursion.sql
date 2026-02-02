-- Quick fix for infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- Drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can create users" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Only managers can delete users" ON app_users;
DROP POLICY IF EXISTS "Allow authenticated users to read app_users" ON app_users;
DROP POLICY IF EXISTS "Allow users to read own profile" ON app_users;
DROP POLICY IF EXISTS "Allow managers to manage users" ON app_users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON app_users;

-- Create simple, non-recursive policies
CREATE POLICY "Simple read access" ON app_users FOR SELECT USING (true);
CREATE POLICY "Simple insert access" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Simple update access" ON app_users FOR UPDATE USING (true);
CREATE POLICY "Simple delete access" ON app_users FOR DELETE USING (true);

-- Also fix any subjects table policies
DROP POLICY IF EXISTS "Role-based subjects access" ON subjects;
DROP POLICY IF EXISTS "Managers can manage subjects" ON subjects;
DROP POLICY IF EXISTS "Staff can manage subjects" ON subjects;

CREATE POLICY "Simple subjects read" ON subjects FOR SELECT USING (true);
CREATE POLICY "Simple subjects insert" ON subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Simple subjects update" ON subjects FOR UPDATE USING (true);
CREATE POLICY "Simple subjects delete" ON subjects FOR DELETE USING (true);


