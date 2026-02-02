-- Fix teacher_subjects semester check constraint
-- This script updates the constraint to allow semester names from the master table

-- First, let's see what the current constraint looks like
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'teacher_subjects'::regclass 
AND conname LIKE '%semester%';

-- Drop the existing check constraint
ALTER TABLE teacher_subjects 
DROP CONSTRAINT IF EXISTS teacher_subjects_semester_check;

-- Create a new, more flexible check constraint
-- This allows both the old values and semester names from the master table
ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_semester_check 
CHECK (semester IN (
    'fall', 'spring', 'summer',  -- Old values
    'الفصل الأول', 'الفصل الثاني', 'الفصل الثالث',  -- Arabic semester names
    'Fall Semester', 'Spring Semester', 'Summer Semester'  -- English semester names
));

-- Also remove NOT NULL constraint if it still exists
ALTER TABLE teacher_subjects 
ALTER COLUMN semester DROP NOT NULL;

SELECT 'Semester constraint updated successfully!' as status;


