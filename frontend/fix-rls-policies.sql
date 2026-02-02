-- Fix RLS Policies for Student Page
-- Run this if the troubleshoot shows RLS issues

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON departments;

-- Recreate policies
CREATE POLICY "Allow all operations for authenticated users" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON departments FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: Disable RLS temporarily for testing
-- ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Check current auth status
SELECT auth.role() as current_role, auth.uid() as current_user_id;
