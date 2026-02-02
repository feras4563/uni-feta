-- Debug enrollment data to understand the structure
-- Run this in Supabase SQL Editor

-- Check the structure of student_subject_enrollments
SELECT 
    'Table structure:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'student_subject_enrollments'
ORDER BY column_name;

-- Check sample data from student_subject_enrollments
SELECT 
    'Sample enrollments:' as info,
    id,
    student_id,
    subject_id,
    semester_id,
    department_id,
    status,
    payment_status,
    enrollment_date,
    created_at
FROM student_subject_enrollments
LIMIT 5;

-- Check if there are any enrollments for specific students
SELECT 
    'Enrollments for ST259570:' as info,
    COUNT(*) as total_enrollments
FROM student_subject_enrollments
WHERE student_id = 'ST259570';

-- Show detailed enrollments for ST259570
SELECT 
    sse.*,
    s.code as subject_code,
    s.name as subject_name,
    sem.name as semester_name
FROM student_subject_enrollments sse
LEFT JOIN subjects s ON s.id = sse.subject_id
LEFT JOIN semesters sem ON sem.id = sse.semester_id
WHERE sse.student_id = 'ST259570'
ORDER BY sse.created_at DESC;

-- Check if the subjects exist
SELECT 
    'Available subjects:' as info,
    id,
    code,
    name,
    total_cost,
    is_active
FROM subjects
WHERE is_active = true
LIMIT 10;
