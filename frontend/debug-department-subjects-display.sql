-- ======================================================================
-- DEBUG DEPARTMENT SUBJECTS DISPLAY ISSUE
-- ======================================================================
-- This script helps debug why subjects don't show in department detail page

-- ======================================================================
-- 1. CHECK CURRENT DATA IN DATABASE
-- ======================================================================

-- Show all departments
SELECT 
    'All departments:' as info,
    id,
    name,
    semester_count
FROM departments
ORDER BY name;

-- Show all subjects  
SELECT 
    'All subjects:' as info,
    COUNT(*) as total_subjects
FROM subjects;

-- Show all department-semester-subject relationships
SELECT 
    'All department-semester-subject relationships:' as info,
    COUNT(*) as total_relationships
FROM department_semester_subjects;

-- ======================================================================
-- 2. CHECK SPECIFIC DEPARTMENT DATA
-- ======================================================================

-- Show subjects for إدارة أعمال department (the one in the screenshot)
SELECT 
    'Subjects for إدارة أعمال department:' as debug_info,
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code,
    dss.semester_number,
    s.credits
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
WHERE d.name = 'إدارة أعمال'
ORDER BY dss.semester_number, s.name;

-- Alternative query if department name is different
SELECT 
    'All subjects by department:' as debug_info,
    d.name as department_name,
    COUNT(dss.id) as subject_count,
    array_agg(DISTINCT dss.semester_number ORDER BY dss.semester_number) as semesters
FROM departments d
LEFT JOIN department_semester_subjects dss ON d.id = dss.department_id
GROUP BY d.id, d.name
ORDER BY d.name;

-- ======================================================================
-- 3. TEST THE EXACT API QUERY
-- ======================================================================

-- This is the exact query that fetchDepartmentDetails uses
DO $$
DECLARE
    dept_id TEXT;
    subject_count INTEGER;
BEGIN
    -- Get the department ID for إدارة أعمال
    SELECT id INTO dept_id FROM departments WHERE name = 'إدارة أعمال' LIMIT 1;
    
    IF dept_id IS NOT NULL THEN
        -- Test the exact query from fetchDepartmentDetails
        SELECT COUNT(*) INTO subject_count
        FROM department_semester_subjects dss
        JOIN subjects s ON s.id = dss.subject_id
        WHERE dss.department_id = dept_id;
        
        RAISE NOTICE 'Department ID: %', dept_id;
        RAISE NOTICE 'Subjects found with API query: %', subject_count;
        
        -- Show the actual data that the API should return
        RAISE NOTICE 'API Query Results:';
        FOR rec IN 
            SELECT 
                dss.semester_number,
                s.name as subject_name,
                s.code,
                s.credits
            FROM department_semester_subjects dss
            JOIN subjects s ON s.id = dss.subject_id
            WHERE dss.department_id = dept_id
            ORDER BY dss.semester_number, s.name
        LOOP
            RAISE NOTICE 'Semester %, Subject: % (%), Credits: %', 
                rec.semester_number, rec.subject_name, rec.code, rec.credits;
        END LOOP;
    ELSE
        RAISE NOTICE 'Department "إدارة أعمال" not found';
    END IF;
END $$;

-- ======================================================================
-- 4. CHECK FOR COMMON ISSUES
-- ======================================================================

-- Check if there are subjects without semester assignments
SELECT 
    'Subjects without semester assignments:' as issue,
    s.name as subject_name,
    s.code
FROM subjects s
WHERE NOT EXISTS (
    SELECT 1 FROM department_semester_subjects dss 
    WHERE dss.subject_id = s.id
)
LIMIT 5;

-- Check if there are orphaned department_semester_subjects
SELECT 
    'Orphaned relationships (subjects deleted):' as issue,
    COUNT(*) as count
FROM department_semester_subjects dss
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.id = dss.subject_id
);

-- Check if there are relationships with invalid departments
SELECT 
    'Orphaned relationships (departments deleted):' as issue,
    COUNT(*) as count
FROM department_semester_subjects dss
WHERE NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.id = dss.department_id
);

-- ======================================================================
-- 5. SHOW SAMPLE DATA FOR VERIFICATION
-- ======================================================================

-- Show first 10 relationships for manual verification
SELECT 
    'Sample relationships for verification:' as info,
    d.name as department_name,
    s.name as subject_name,
    s.code,
    dss.semester_number,
    s.credits,
    dss.created_at
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
ORDER BY dss.created_at DESC
LIMIT 10;

-- ======================================================================
-- DEBUG COMPLETE
-- ======================================================================

SELECT 'DEBUG COMPLETE: Check the results above to identify the issue!' as result;
