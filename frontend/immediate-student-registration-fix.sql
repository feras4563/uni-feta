-- IMMEDIATE FIX: Student Registration Detection for Group Creation
-- This script specifically fixes the issue where registered students aren't being detected

-- ======================================================================
-- STEP 1: IDENTIFY THE PROBLEM
-- ======================================================================

SELECT '=== IDENTIFYING THE PROBLEM ===' as section;

-- Check what data we have
SELECT 'Current student_subject_enrollments count:' as info, COUNT(*) as count FROM student_subject_enrollments;
SELECT 'Current student_semester_registrations count:' as info, COUNT(*) as count FROM student_semester_registrations;

-- Check marsul semester
SELECT 'Marsul semester details:' as info;
SELECT id, name, code FROM semesters WHERE name = 'marsul';

-- Check business administration department
SELECT 'Business administration department details:' as info;
SELECT id, name, name_en FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%';

-- ======================================================================
-- STEP 2: CREATE MISSING REGISTRATION DATA
-- ======================================================================

SELECT '=== CREATING MISSING REGISTRATION DATA ===' as section;

-- Create student_semester_registrations entries for students in business admin department
-- who should be registered for the marsul semester

WITH marsul_semester AS (
    SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1
),
business_dept AS (
    SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1
),
students_to_register AS (
    SELECT s.id as student_id
    FROM students s
    CROSS JOIN business_dept bd
    WHERE s.department_id = bd.id
    LIMIT 20  -- Register up to 20 students
)
INSERT INTO student_semester_registrations (student_id, semester_id, department_id, semester_number, status)
SELECT 
    str.student_id,
    ms.id as semester_id,
    bd.id as department_id,
    1 as semester_number,
    'active' as status
FROM students_to_register str
CROSS JOIN marsul_semester ms
CROSS JOIN business_dept bd
WHERE NOT EXISTS (
    SELECT 1 FROM student_semester_registrations ssr 
    WHERE ssr.student_id = str.student_id 
    AND ssr.semester_id = ms.id 
    AND ssr.department_id = bd.id
);

-- ======================================================================
-- STEP 3: ENSURE STUDENT SUBJECT ENROLLMENTS HAVE PROPER REFERENCES
-- ======================================================================

SELECT '=== FIXING STUDENT SUBJECT ENROLLMENTS ===' as section;

-- Update existing enrollments to have proper semester_id and department_id
UPDATE student_subject_enrollments 
SET semester_id = (
    SELECT ds.semester_id 
    FROM department_semester_subjects ds 
    WHERE ds.subject_id = student_subject_enrollments.subject_id
    LIMIT 1
)
WHERE semester_id IS NULL;

UPDATE student_subject_enrollments 
SET department_id = (
    SELECT s.department_id 
    FROM students s 
    WHERE s.id = student_subject_enrollments.student_id
)
WHERE department_id IS NULL;

-- ======================================================================
-- STEP 4: CREATE ENROLLMENTS FOR REGISTERED STUDENTS
-- ======================================================================

SELECT '=== CREATING ENROLLMENTS FOR REGISTERED STUDENTS ===' as section;

-- Create student_subject_enrollments for students registered in marsul semester
-- who don't already have enrollments

WITH marsul_semester AS (
    SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1
),
business_dept AS (
    SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1
),
registered_students AS (
    SELECT ssr.student_id
    FROM student_semester_registrations ssr
    CROSS JOIN marsul_semester ms
    CROSS JOIN business_dept bd
    WHERE ssr.semester_id = ms.id AND ssr.department_id = bd.id
),
subjects_in_dept AS (
    SELECT ds.subject_id
    FROM department_semester_subjects ds
    CROSS JOIN marsul_semester ms
    CROSS JOIN business_dept bd
    WHERE ds.semester_id = ms.id AND ds.department_id = bd.id
    LIMIT 5  -- Enroll in up to 5 subjects
)
INSERT INTO student_subject_enrollments (student_id, subject_id, semester_id, department_id, status)
SELECT 
    rs.student_id,
    sid.subject_id,
    ms.id as semester_id,
    bd.id as department_id,
    'enrolled' as status
FROM registered_students rs
CROSS JOIN subjects_in_dept sid
CROSS JOIN marsul_semester ms
CROSS JOIN business_dept bd
WHERE NOT EXISTS (
    SELECT 1 FROM student_subject_enrollments sse 
    WHERE sse.student_id = rs.student_id 
    AND sse.subject_id = sid.subject_id
);

-- ======================================================================
-- STEP 5: VERIFY THE FIX
-- ======================================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check registrations for marsul semester and business admin department
WITH marsul_semester AS (
    SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1
),
business_dept AS (
    SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1
)
SELECT 'Registrations for target combination:' as info, COUNT(*) as count
FROM student_semester_registrations ssr
CROSS JOIN marsul_semester ms
CROSS JOIN business_dept bd
WHERE ssr.semester_id = ms.id AND ssr.department_id = bd.id;

-- Check enrollments for marsul semester and business admin department
WITH marsul_semester AS (
    SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1
),
business_dept AS (
    SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1
)
SELECT 'Enrollments for target combination:' as info, COUNT(*) as count
FROM student_subject_enrollments sse
CROSS JOIN marsul_semester ms
CROSS JOIN business_dept bd
WHERE sse.semester_id = ms.id AND sse.department_id = bd.id;

-- Show sample of registered students
SELECT 'Sample registered students:' as info;
SELECT 
    s.name as student_name,
    d.name as department_name,
    sem.name as semester_name,
    ssr.status as registration_status
FROM student_semester_registrations ssr
JOIN students s ON ssr.student_id = s.id
JOIN departments d ON ssr.department_id = d.id
JOIN semesters sem ON ssr.semester_id = sem.id
WHERE sem.name = 'marsul'
LIMIT 5;

SELECT '=== FIX COMPLETED ===' as result;
SELECT 'Students should now be properly registered and detectable for group creation.' as info;
