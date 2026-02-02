-- Ultra simple fix for student_subject_enrollments department_id column
-- Run this in Supabase SQL Editor

-- Add department_id column if it doesn't exist
ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS department_id TEXT;

-- Update existing records with department_id from subjects
UPDATE student_subject_enrollments 
SET department_id = s.department_id
FROM subjects s
WHERE student_subject_enrollments.subject_id = s.id
AND student_subject_enrollments.department_id IS NULL;

-- Disable RLS for testing
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;
