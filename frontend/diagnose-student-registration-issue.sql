-- Diagnose student registration issue for group creation
-- This script will help identify why registered students aren't being detected

-- ======================================================================
-- 1. CHECK BASIC DATA AVAILABILITY
-- ======================================================================

SELECT '=== CHECKING BASIC DATA AVAILABILITY ===' as section;

-- Check departments
SELECT 'Available departments:' as info;
SELECT id, name, name_en FROM departments ORDER BY name;

-- Check semesters
SELECT 'Available semesters:' as info;
SELECT id, name, code, is_current, is_active FROM semesters ORDER BY name;

-- Check students
SELECT 'Available students:' as info;
SELECT COUNT(*) as student_count FROM students;

-- ======================================================================
-- 2. CHECK STUDENT SUBJECT ENROLLMENTS
-- ======================================================================

SELECT '=== CHECKING STUDENT SUBJECT ENROLLMENTS ===' as section;

-- Check if student_subject_enrollments table exists and has data
SELECT 'Student subject enrollments count:' as info;
SELECT COUNT(*) as enrollment_count FROM student_subject_enrollments;

-- Check enrollments by department
SELECT 'Enrollments by department:' as info;
SELECT d.name as department_name, COUNT(*) as enrollment_count
FROM student_subject_enrollments sse
LEFT JOIN departments d ON sse.department_id = d.id
GROUP BY d.name
ORDER BY enrollment_count DESC;

-- Check enrollments by semester
SELECT 'Enrollments by semester:' as info;
SELECT s.name as semester_name, s.code, COUNT(*) as enrollment_count
FROM student_subject_enrollments sse
LEFT JOIN semesters s ON sse.semester_id = s.id
GROUP BY s.name, s.code
ORDER BY enrollment_count DESC;

-- ======================================================================
-- 3. CHECK SPECIFIC DEPARTMENT AND SEMESTER COMBINATIONS
-- ======================================================================

SELECT '=== CHECKING SPECIFIC COMBINATIONS ===' as section;

-- Find the marsul semester ID
SELECT 'Marsul semester details:' as info;
SELECT id, name, code FROM semesters WHERE name = 'marsul' OR code LIKE '%marsul%';

-- Find the business administration department ID
SELECT 'Business Administration department details:' as info;
SELECT id, name, name_en FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' OR name_en LIKE '%business%';

-- Check enrollments for marsul semester specifically
SELECT 'Enrollments for marsul semester:' as info;
SELECT sse.*, d.name as department_name, s.name as semester_name
FROM student_subject_enrollments sse
LEFT JOIN departments d ON sse.department_id = d.id
LEFT JOIN semesters s ON sse.semester_id = s.id
WHERE s.name = 'marsul' OR s.code LIKE '%marsul%';

-- Check enrollments for business administration department specifically
SELECT 'Enrollments for business administration department:' as info;
SELECT sse.*, d.name as department_name, s.name as semester_name
FROM student_subject_enrollments sse
LEFT JOIN departments d ON sse.department_id = d.id
LEFT JOIN semesters s ON sse.semester_id = s.id
WHERE d.name LIKE '%ادارة%' OR d.name LIKE '%اعمال%' OR d.name_en LIKE '%business%';

-- ======================================================================
-- 4. CHECK STUDENT SEMESTER REGISTRATIONS (FALLBACK TABLE)
-- ======================================================================

SELECT '=== CHECKING STUDENT SEMESTER REGISTRATIONS ===' as section;

-- Check if student_semester_registrations table exists and has data
SELECT 'Student semester registrations count:' as info;
SELECT COUNT(*) as registration_count FROM student_semester_registrations;

-- Check registrations by department
SELECT 'Registrations by department:' as info;
SELECT d.name as department_name, COUNT(*) as registration_count
FROM student_semester_registrations ssr
LEFT JOIN departments d ON ssr.department_id = d.id
GROUP BY d.name
ORDER BY registration_count DESC;

-- Check registrations by semester
SELECT 'Registrations by semester:' as info;
SELECT s.name as semester_name, s.code, COUNT(*) as registration_count
FROM student_semester_registrations ssr
LEFT JOIN semesters s ON ssr.semester_id = s.id
GROUP BY s.name, s.code
ORDER BY registration_count DESC;

-- ======================================================================
-- 5. DETAILED ANALYSIS FOR SPECIFIC CASE
-- ======================================================================

SELECT '=== DETAILED ANALYSIS FOR SPECIFIC CASE ===' as section;

-- Get the exact IDs we need
WITH target_data AS (
    SELECT 
        (SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1) as dept_id,
        (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1) as sem_id
)
SELECT 
    'Target department ID:' as info, dept_id as value FROM target_data
UNION ALL
SELECT 
    'Target semester ID:' as info, sem_id as value FROM target_data;

-- Check if there are any enrollments for the specific combination
WITH target_data AS (
    SELECT 
        (SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1) as dept_id,
        (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1) as sem_id
)
SELECT 
    'Enrollments for target combination:' as info, 
    COUNT(*) as count
FROM student_subject_enrollments sse, target_data td
WHERE sse.department_id = td.dept_id AND sse.semester_id = td.sem_id;

-- ======================================================================
-- 6. CHECK STUDENT DEPARTMENT ASSIGNMENTS
-- ======================================================================

SELECT '=== CHECKING STUDENT DEPARTMENT ASSIGNMENTS ===' as section;

-- Check which students are assigned to which departments
SELECT 'Students by department:' as info;
SELECT d.name as department_name, COUNT(*) as student_count
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
GROUP BY d.name
ORDER BY student_count DESC;

-- Check students in business administration department
SELECT 'Students in business administration department:' as info;
SELECT s.id, s.name, s.name_en, d.name as department_name
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
WHERE d.name LIKE '%ادارة%' OR d.name LIKE '%اعمال%' OR d.name_en LIKE '%business%';

SELECT '=== DIAGNOSIS COMPLETE ===' as result;
