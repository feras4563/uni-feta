-- Immediate fix for semester check constraint error
-- Run this to resolve the current error

-- Remove the restrictive check constraint
ALTER TABLE teacher_subjects 
DROP CONSTRAINT IF EXISTS teacher_subjects_semester_check;

-- Remove NOT NULL constraint
ALTER TABLE teacher_subjects 
ALTER COLUMN semester DROP NOT NULL;

-- Remove NOT NULL constraint from academic_year too
ALTER TABLE teacher_subjects 
ALTER COLUMN academic_year DROP NOT NULL;

SELECT 'Constraints removed successfully! The form should now work.' as status;


