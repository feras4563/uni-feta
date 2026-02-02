-- Test the database queries with the correct IDs
-- Run this in Supabase SQL Editor

-- Test with the correct student ID (ST259570)
SELECT 
    'Testing with correct student ID:' as info,
    sse.id,
    sse.student_id,
    sse.subject_id,
    sse.semester_id,
    sse.department_id,
    sse.status,
    sse.payment_status
FROM student_subject_enrollments sse
WHERE sse.student_id = 'ST259570'
LIMIT 5;

-- Test with the correct semester ID (284963e1-aae3-4b35-a372-89bb5066745f)
SELECT 
    'Testing with correct semester ID:' as info,
    sse.id,
    sse.student_id,
    sse.subject_id,
    sse.semester_id,
    sse.department_id,
    sse.status,
    sse.payment_status
FROM student_subject_enrollments sse
WHERE sse.semester_id = '284963e1-aae3-4b35-a372-89bb5066745f'
LIMIT 5;

-- Test with both correct IDs
SELECT 
    'Testing with both correct IDs:' as info,
    sse.id,
    sse.student_id,
    sse.subject_id,
    sse.semester_id,
    sse.department_id,
    sse.status,
    sse.payment_status
FROM student_subject_enrollments sse
WHERE sse.student_id = 'ST259570' 
AND sse.semester_id = '284963e1-aae3-4b35-a372-89bb5066745f';

-- Test invoices with correct student ID
SELECT 
    'Testing invoices with correct student ID:' as info,
    si.id,
    si.student_id,
    si.semester_id,
    si.total_amount,
    si.status,
    si.payment_status
FROM student_invoices si
WHERE si.student_id = 'ST259570'
LIMIT 5;

-- Test invoices with both correct IDs
SELECT 
    'Testing invoices with both correct IDs:' as info,
    si.id,
    si.student_id,
    si.semester_id,
    si.total_amount,
    si.status,
    si.payment_status
FROM student_invoices si
WHERE si.student_id = 'ST259570' 
AND si.semester_id = '284963e1-aae3-4b35-a372-89bb5066745f';
