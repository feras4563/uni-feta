-- Create test enrollment data to test the uncheckable subjects functionality
-- Run this in Supabase SQL Editor

-- First, let's check what we have
SELECT 'Before creating test data:' as status;

-- Check if student ST259570 exists
SELECT 
    'Student ST259570:' as info,
    id,
    name,
    email,
    department_id
FROM students
WHERE id = 'ST259570';

-- Get an active semester
SELECT 
    'Active semester:' as info,
    id,
    name,
    name_en
FROM semesters
WHERE is_active = true
LIMIT 1;

-- Get some subjects to enroll in
SELECT 
    'Available subjects:' as info,
    id,
    code,
    name,
    total_cost
FROM subjects
WHERE is_active = true
LIMIT 3;

-- Create test enrollments for ST259570
-- First, get the active semester ID
WITH active_semester AS (
    SELECT id FROM semesters WHERE is_active = true LIMIT 1
),
student_dept AS (
    SELECT department_id FROM students WHERE id = 'ST259570'
),
test_subjects AS (
    SELECT id FROM subjects WHERE is_active = true LIMIT 2
)
INSERT INTO student_subject_enrollments (
    student_id,
    subject_id,
    semester_id,
    department_id,
    subject_cost,
    status,
    payment_status
)
SELECT 
    'ST259570',
    ts.id,
    sem.id,
    sd.department_id,
    s.total_cost,
    'enrolled',
    'unpaid'
FROM test_subjects ts
CROSS JOIN active_semester sem
CROSS JOIN student_dept sd
LEFT JOIN subjects s ON s.id = ts.id;

-- Verify the test enrollments were created
SELECT 
    'Test enrollments created:' as status,
    sse.*,
    s.code as subject_code,
    s.name as subject_name,
    sem.name as semester_name
FROM student_subject_enrollments sse
LEFT JOIN subjects s ON s.id = sse.subject_id
LEFT JOIN semesters sem ON sem.id = sse.semester_id
WHERE sse.student_id = 'ST259570'
ORDER BY sse.created_at DESC;

SELECT 'SUCCESS: Test enrollment data created!' as result;
