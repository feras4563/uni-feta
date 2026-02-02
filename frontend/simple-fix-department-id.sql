-- Simple fix for student_subject_enrollments department_id column
-- Run this in Supabase SQL Editor

-- Add department_id column if it doesn't exist
ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS department_id TEXT;

-- Add foreign key constraint (drop first if exists)
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_subject_enrollments_department_id_fkey'
        AND table_name = 'student_subject_enrollments'
    ) THEN
        ALTER TABLE student_subject_enrollments 
        DROP CONSTRAINT student_subject_enrollments_department_id_fkey;
    END IF;
    
    -- Add the constraint
    ALTER TABLE student_subject_enrollments 
    ADD CONSTRAINT student_subject_enrollments_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id);
END $$;

-- Update existing records with department_id from subjects
UPDATE student_subject_enrollments 
SET department_id = s.department_id
FROM subjects s
WHERE student_subject_enrollments.subject_id = s.id
AND student_subject_enrollments.department_id IS NULL;

-- Disable RLS for testing
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;
