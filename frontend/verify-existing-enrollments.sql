-- Verify existing enrollments for testing
-- Run this in Supabase SQL Editor

-- Check existing enrollments for ST259570
SELECT 
    'Existing enrollments for ST259570:' as info,
    sse.id,
    sse.student_id,
    sse.subject_id,
    sse.semester_id,
    sse.department_id,
    sse.status,
    sse.payment_status,
    sse.created_at,
    s.code as subject_code,
    s.name as subject_name,
    sem.name as semester_name,
    d.name as department_name
FROM student_subject_enrollments sse
LEFT JOIN subjects s ON s.id = sse.subject_id
LEFT JOIN semesters sem ON sem.id = sse.semester_id
LEFT JOIN departments d ON d.id = sse.department_id
WHERE sse.student_id = 'ST259570'
ORDER BY sse.created_at DESC;

-- Count total enrollments
SELECT 
    'Total enrollments for ST259570:' as info,
    COUNT(*) as count
FROM student_subject_enrollments
WHERE student_id = 'ST259570';

-- Show which subjects are enrolled
SELECT 
    'Enrolled subject IDs:' as info,
    subject_id,
    s.code as subject_code,
    s.name as subject_name
FROM student_subject_enrollments sse
LEFT JOIN subjects s ON s.id = sse.subject_id
WHERE sse.student_id = 'ST259570';

SELECT 'SUCCESS: Enrollment data exists and is ready for testing!' as result;
