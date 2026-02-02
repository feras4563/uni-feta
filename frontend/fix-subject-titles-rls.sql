-- Fix infinite recursion in subject_titles RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view subject titles" ON subject_titles;
DROP POLICY IF EXISTS "Managers can manage subject titles" ON subject_titles;
DROP POLICY IF EXISTS "Staff can manage subject titles" ON subject_titles;

-- Create simpler policies that don't cause infinite recursion
CREATE POLICY "Enable read access for all users" ON subject_titles FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON subject_titles FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable update for authenticated users" ON subject_titles FOR UPDATE USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable delete for authenticated users" ON subject_titles FOR DELETE USING (
  auth.role() = 'authenticated'
);



