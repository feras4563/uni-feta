-- ======================================================================
-- ADD TEST SUBJECTS TO DEPARTMENT FOR TESTING
-- ======================================================================
-- This adds some test subjects to see them in the department detail page

-- ======================================================================
-- 1. GET DEPARTMENT ID (إدارة أعمال)
-- ======================================================================

-- Get the department ID for إدارة أعمال
DO $$
DECLARE
    dept_id TEXT;
    subject_count INTEGER := 0;
    semester_id TEXT;
BEGIN
    -- Get department ID for "إدارة أعمال"
    SELECT id INTO dept_id FROM departments WHERE name = 'إدارة أعمال' LIMIT 1;
    
    -- Get a semester ID
    SELECT id INTO semester_id FROM semesters LIMIT 1;
    
    IF dept_id IS NOT NULL THEN
        RAISE NOTICE 'Found department: %', dept_id;
        
        -- Add subjects to semester 1
        INSERT INTO department_semester_subjects (department_id, subject_id, semester_number, semester_id, is_active)
        SELECT 
            dept_id,
            s.id,
            1,
            semester_id,
            true
        FROM subjects s
        WHERE s.id NOT IN (
            SELECT subject_id FROM department_semester_subjects 
            WHERE department_id = dept_id AND semester_number = 1
        )
        LIMIT 3
        ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
        
        GET DIAGNOSTICS subject_count = ROW_COUNT;
        RAISE NOTICE 'Added % subjects to semester 1', subject_count;
        
        -- Add subjects to semester 2
        INSERT INTO department_semester_subjects (department_id, subject_id, semester_number, semester_id, is_active)
        SELECT 
            dept_id,
            s.id,
            2,
            semester_id,
            true
        FROM subjects s
        WHERE s.id NOT IN (
            SELECT subject_id FROM department_semester_subjects 
            WHERE department_id = dept_id
        )
        LIMIT 2
        ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
        
        GET DIAGNOSTICS subject_count = ROW_COUNT;
        RAISE NOTICE 'Added % subjects to semester 2', subject_count;
        
    ELSE
        RAISE NOTICE 'Department "إدارة أعمال" not found';
    END IF;
END $$;

-- ======================================================================
-- 2. VERIFY THE DATA
-- ======================================================================

-- Show subjects by semester for إدارة أعمال department
SELECT 
    'Subjects for إدارة أعمال department:' as info,
    d.name as department_name,
    dss.semester_number,
    s.name as subject_name,
    s.code,
    s.credits,
    dss.is_active
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
WHERE d.name = 'إدارة أعمال'
ORDER BY dss.semester_number, s.name;

-- ======================================================================
-- 3. TEST THE API QUERY
-- ======================================================================

-- Test the exact query that fetchDepartmentWithStats uses
SELECT 
    'Testing API query for department detail page:' as test,
    dss.id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    s.id,
    s.name,
    s.code,
    s.credits
FROM department_semester_subjects dss
INNER JOIN subjects s ON s.id = dss.subject_id
WHERE dss.department_id = (SELECT id FROM departments WHERE name = 'إدارة أعمال' LIMIT 1)
AND dss.is_active = true
ORDER BY dss.semester_number, s.name;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Test subjects added to إدارة أعمال department! Check the detail page now.' as result;
