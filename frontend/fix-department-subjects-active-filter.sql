-- ======================================================================
-- FIX DEPARTMENT SUBJECTS ACTIVE FILTER ISSUE
-- ======================================================================
-- The API filters subjects by is_active = true, but new subjects might not have this set

-- ======================================================================
-- 1. CHECK CURRENT IS_ACTIVE STATUS
-- ======================================================================

-- Check if is_active column exists in department_semester_subjects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'department_semester_subjects' 
AND column_name = 'is_active';

-- Show all relationships and their is_active status
SELECT 
    'All department-semester-subject relationships:' as info,
    d.name as department_name,
    s.name as subject_name,
    s.code,
    dss.semester_number,
    dss.is_active,
    dss.created_at
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
ORDER BY dss.created_at DESC
LIMIT 10;

-- Count active vs inactive relationships
SELECT 
    'Active status count:' as info,
    is_active,
    COUNT(*) as count
FROM department_semester_subjects
GROUP BY is_active;

-- ======================================================================
-- 2. ADD IS_ACTIVE COLUMN IF MISSING
-- ======================================================================

-- Add is_active column if it doesn't exist
ALTER TABLE department_semester_subjects 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ======================================================================
-- 3. UPDATE ALL RELATIONSHIPS TO BE ACTIVE
-- ======================================================================

-- Set all existing relationships to active
UPDATE department_semester_subjects 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- ======================================================================
-- 4. TEST THE API QUERY WITH FILTER
-- ======================================================================

-- Test the exact query that fetchDepartmentWithStats uses
SELECT 
    'Testing API query with is_active filter:' as test,
    d.name as department_name,
    COUNT(dss.id) as subjects_found
FROM departments d
LEFT JOIN department_semester_subjects dss ON d.id = dss.department_id AND dss.is_active = true
LEFT JOIN subjects s ON s.id = dss.subject_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- Show specific results for إدارة أعمال department
SELECT 
    'Results for إدارة أعمال department:' as test,
    dss.id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    s.name as subject_name,
    s.code,
    s.credits
FROM department_semester_subjects dss
JOIN subjects s ON s.id = dss.subject_id
JOIN departments d ON d.id = dss.department_id
WHERE d.name = 'إدارة أعمال' 
AND dss.is_active = true
ORDER BY dss.semester_number, s.name;

-- ======================================================================
-- 5. VERIFY THE FIX
-- ======================================================================

-- Final count of active relationships
SELECT 
    'Final active relationships:' as status,
    COUNT(*) as count
FROM department_semester_subjects
WHERE is_active = true;

-- Show subjects by semester for first department
SELECT 
    'Subjects by semester:' as info,
    dss.semester_number,
    COUNT(*) as subject_count,
    string_agg(s.name, ', ') as subjects
FROM department_semester_subjects dss
JOIN subjects s ON s.id = dss.subject_id
WHERE dss.department_id = (SELECT id FROM departments LIMIT 1)
AND dss.is_active = true
GROUP BY dss.semester_number
ORDER BY dss.semester_number;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: All department-semester-subject relationships are now active! Subjects should show in detail page.' as result;
