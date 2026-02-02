-- Check if there are any enrollments for specific students
-- Run this in Supabase SQL Editor

-- Check all enrollments in the table
SELECT 
    'Total enrollments:' as info,
    COUNT(*) as count
FROM student_subject_enrollments;

-- Check enrollments for ST259570 specifically
SELECT 
    'Enrollments for ST259570:' as info,
    COUNT(*) as count
FROM student_subject_enrollments
WHERE student_id = 'ST259570';

-- Show all enrollments with details
SELECT 
    sse.*,
    s.code as subject_code,
    s.name as subject_name,
    sem.name as semester_name,
    d.name as department_name
FROM student_subject_enrollments sse
LEFT JOIN subjects s ON s.id = sse.subject_id
LEFT JOIN semesters sem ON sem.id = sse.semester_id
LEFT JOIN departments d ON d.id = sse.department_id
ORDER BY sse.created_at DESC;

-- Check if the student exists
SELECT 
    'Student ST259570 exists:' as info,
    COUNT(*) as count
FROM students
WHERE id = 'ST259570';

-- Check available semesters
SELECT 
    'Available semesters:' as info,
    id,
    name,
    name_en,
    is_active
FROM semesters
WHERE is_active = true;
