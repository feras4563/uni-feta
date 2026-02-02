-- Quick fix for teacher_subjects NOT NULL constraint error
-- This script removes the NOT NULL constraint from the old columns

-- Remove NOT NULL constraint from academic_year column
ALTER TABLE teacher_subjects 
ALTER COLUMN academic_year DROP NOT NULL;

-- Remove NOT NULL constraint from semester column  
ALTER TABLE teacher_subjects 
ALTER COLUMN semester DROP NOT NULL;

-- Display confirmation
SELECT 'NOT NULL constraints removed from academic_year and semester columns' as status;


