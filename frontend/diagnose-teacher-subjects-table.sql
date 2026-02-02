-- Diagnose teacher_subjects table structure
-- This script checks the current state of the teacher_subjects table

-- Check if the new columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects' 
ORDER BY ordinal_position;

-- Check constraints on the table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'teacher_subjects'::regclass;

-- Check if there are any existing records
SELECT COUNT(*) as total_records FROM teacher_subjects;

-- Check if study_years and semesters tables exist and have data
SELECT 
    (SELECT COUNT(*) FROM study_years) as study_years_count,
    (SELECT COUNT(*) FROM semesters) as semesters_count;

-- Show sample data from study_years and semesters
SELECT 'Study Years:' as table_name, id, name FROM study_years LIMIT 5
UNION ALL
SELECT 'Semesters:', id, name FROM semesters LIMIT 5;


