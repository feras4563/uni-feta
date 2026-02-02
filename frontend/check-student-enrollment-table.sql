-- Check student_subject_enrollments table structure
-- Run this in Supabase SQL Editor

-- Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_subject_enrollments'
ORDER BY ordinal_position;

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'student_subject_enrollments'
) as table_exists;
