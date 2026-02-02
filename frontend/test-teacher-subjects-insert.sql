-- Test inserting into teacher_subjects table
-- This will help identify what's causing the 400 error

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects' 
ORDER BY ordinal_position;

-- Check if we have any sample data in study_years and semesters
SELECT 'Study Years:' as table_name, id, name FROM study_years LIMIT 3;
SELECT 'Semesters:' as table_name, id, name FROM semesters LIMIT 3;

-- Try a simple insert to see what happens
-- (This will fail if there are constraint issues, but will show us the exact error)
INSERT INTO teacher_subjects (
    teacher_id, 
    subject_id, 
    department_id, 
    academic_year, 
    semester,
    is_primary_teacher,
    can_edit_grades,
    can_take_attendance
) VALUES (
    'test-teacher-id',
    'test-subject-id', 
    'test-department-id',
    '2024-2025',
    'fall',
    true,
    true,
    true
);


