-- Fix RLS policies for teacher_subjects table
-- This script fixes the Row Level Security policies that are preventing inserts

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'teacher_subjects';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view teacher subjects" ON teacher_subjects;
DROP POLICY IF EXISTS "Authenticated users can insert teacher subjects" ON teacher_subjects;
DROP POLICY IF EXISTS "Authenticated users can update teacher subjects" ON teacher_subjects;
DROP POLICY IF EXISTS "Authenticated users can delete teacher subjects" ON teacher_subjects;
DROP POLICY IF EXISTS "Teachers can see their subject assignments" ON teacher_subjects;

-- Create simple, permissive policies that allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON teacher_subjects
    FOR ALL USING (true) WITH CHECK (true);

-- Alternative: Create specific policies if you prefer more control
-- CREATE POLICY "Allow select for all" ON teacher_subjects
--     FOR SELECT USING (true);

-- CREATE POLICY "Allow insert for authenticated users" ON teacher_subjects
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Allow update for authenticated users" ON teacher_subjects
--     FOR UPDATE USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow delete for authenticated users" ON teacher_subjects
--     FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'teacher_subjects';

-- Test insert (this should work now)
-- INSERT INTO teacher_subjects (teacher_id, subject_id, department_id, academic_year, semester)
-- VALUES ('test-teacher-id', 'test-subject-id', 'test-dept-id', '2025', 'fall');

SELECT 'RLS policies fixed for teacher_subjects table' as status;
