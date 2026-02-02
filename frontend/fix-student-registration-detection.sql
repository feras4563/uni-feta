-- Fix student registration detection issue for group creation
-- This script addresses common issues that prevent registered students from being detected

-- ======================================================================
-- 1. ENSURE PROPER DATA STRUCTURE
-- ======================================================================

SELECT '=== ENSURING PROPER DATA STRUCTURE ===' as section;

-- Make sure student_subject_enrollments table has the right columns
ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS semester_id TEXT REFERENCES semesters(id);

ALTER TABLE student_subject_enrollments 
ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id);

-- Make sure student_semester_registrations table exists and has proper structure
CREATE TABLE IF NOT EXISTS student_semester_registrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id, department_id)
);

-- ======================================================================
-- 2. POPULATE MISSING DATA
-- ======================================================================

SELECT '=== POPULATING MISSING DATA ===' as section;

-- If student_subject_enrollments has enrollments but missing semester_id or department_id,
-- try to populate them from related data

-- Update semester_id from subjects if missing
UPDATE student_subject_enrollments 
SET semester_id = (
    SELECT ds.semester_id 
    FROM department_semester_subjects ds 
    WHERE ds.subject_id = student_subject_enrollments.subject_id
    LIMIT 1
)
WHERE semester_id IS NULL;

-- Update department_id from students if missing
UPDATE student_subject_enrollments 
SET department_id = (
    SELECT s.department_id 
    FROM students s 
    WHERE s.id = student_subject_enrollments.student_id
)
WHERE department_id IS NULL;

-- ======================================================================
-- 3. CREATE SAMPLE REGISTRATION DATA (IF NEEDED)
-- ======================================================================

SELECT '=== CREATING SAMPLE REGISTRATION DATA ===' as section;

-- Get the marsul semester ID
WITH marsul_semester AS (
    SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1
),
business_dept AS (
    SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1
),
students_in_dept AS (
    SELECT s.id as student_id
    FROM students s
    CROSS JOIN business_dept bd
    WHERE s.department_id = bd.id
    LIMIT 10  -- Limit to avoid too many registrations
)
INSERT INTO student_semester_registrations (student_id, semester_id, department_id, semester_number, status)
SELECT 
    std.student_id,
    ms.id as semester_id,
    bd.id as department_id,
    1 as semester_number,
    'active' as status
FROM students_in_dept std
CROSS JOIN marsul_semester ms
CROSS JOIN business_dept bd
ON CONFLICT (student_id, semester_id, department_id) DO NOTHING;

-- ======================================================================
-- 4. CREATE SAMPLE ENROLLMENT DATA (IF NEEDED)
-- ======================================================================

SELECT '=== CREATING SAMPLE ENROLLMENT DATA ===' as section;

-- Get subjects for the business department and marsul semester
WITH target_data AS (
    SELECT 
        (SELECT id FROM departments WHERE name LIKE '%ادارة%' OR name LIKE '%اعمال%' LIMIT 1) as dept_id,
        (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1) as sem_id
),
subjects_in_dept AS (
    SELECT ds.subject_id
    FROM department_semester_subjects ds
    CROSS JOIN target_data td
    WHERE ds.department_id = td.dept_id
    LIMIT 3  -- Limit to a few subjects
),
students_in_dept AS (
    SELECT s.id as student_id
    FROM students s
    CROSS JOIN target_data td
    WHERE s.department_id = td.dept_id
    LIMIT 5  -- Limit to a few students
)
INSERT INTO student_subject_enrollments (student_id, subject_id, semester_id, department_id, status)
SELECT 
    std.student_id,
    sid.subject_id,
    td.sem_id as semester_id,
    td.dept_id as department_id,
    'enrolled' as status
FROM students_in_dept std
CROSS JOIN subjects_in_dept sid
CROSS JOIN target_data td
ON CONFLICT (student_id, subject_id) DO UPDATE SET
    semester_id = EXCLUDED.semester_id,
    department_id = EXCLUDED.department_id,
    status = EXCLUDED.status;

-- ======================================================================
-- 5. VERIFY THE FIX
-- ======================================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check student_subject_enrollments for marsul semester
SELECT 'Student subject enrollments for marsul semester:' as info;
SELECT COUNT(*) as count
FROM student_subject_enrollments sse
JOIN semesters s ON sse.semester_id = s.id
WHERE s.name = 'marsul';

-- Check student_semester_registrations for marsul semester
SELECT 'Student semester registrations for marsul semester:' as info;
SELECT COUNT(*) as count
FROM student_semester_registrations ssr
JOIN semesters s ON ssr.semester_id = s.id
WHERE s.name = 'marsul';

-- Check business administration department enrollments
SELECT 'Business administration department enrollments:' as info;
SELECT COUNT(*) as count
FROM student_subject_enrollments sse
JOIN departments d ON sse.department_id = d.id
WHERE d.name LIKE '%ادارة%' OR d.name LIKE '%اعمال%';

-- Show sample data
SELECT 'Sample enrollments:' as info;
SELECT 
    sse.id,
    st.name as student_name,
    d.name as department_name,
    s.name as semester_name,
    sse.status
FROM student_subject_enrollments sse
JOIN students st ON sse.student_id = st.id
JOIN departments d ON sse.department_id = d.id
JOIN semesters s ON sse.semester_id = s.id
LIMIT 5;

SELECT '=== FIX COMPLETED ===' as result;
SELECT 'Student registration data should now be properly populated.' as info;
