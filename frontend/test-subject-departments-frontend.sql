-- ==============================================
-- TEST: FRONTEND SUBJECT DEPARTMENTS DATA
-- ==============================================
-- This tests the exact query the frontend uses

-- ==============================================
-- 1. TEST THE EXACT FRONTEND QUERY
-- ==============================================

-- This simulates getSubjectDepartments() function
SELECT 
    sd.id,
    sd.department_id,
    sd.is_primary_department,
    sd.is_active,
    json_build_object(
        'id', d.id,
        'name', d.name,
        'name_en', d.name_en
    ) as departments
FROM subject_departments sd
JOIN departments d ON d.id = sd.department_id
WHERE sd.subject_id = (SELECT id FROM subjects LIMIT 1)  -- Test with first subject
AND sd.is_active = true
ORDER BY sd.is_primary_department DESC;

-- ==============================================
-- 2. TEST ALL SUBJECTS WITH THEIR DEPARTMENTS
-- ==============================================

-- Show what data each subject should have
SELECT 
    s.id as subject_id,
    s.name as subject_name,
    s.code,
    json_agg(
        json_build_object(
            'id', sd.id,
            'department_id', sd.department_id,
            'is_primary_department', sd.is_primary_department,
            'is_active', sd.is_active,
            'departments', json_build_object(
                'id', d.id,
                'name', d.name,
                'name_en', d.name_en
            )
        ) ORDER BY sd.is_primary_department DESC
    ) as frontend_data
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.name, s.code
ORDER BY s.name;

-- ==============================================
-- 3. CHECK FOR SUBJECTS WITHOUT DEPARTMENTS
-- ==============================================

-- Find subjects that might be missing department relationships
SELECT 
    s.id,
    s.name,
    s.code,
    'Missing departments' as issue
FROM subjects s
WHERE NOT EXISTS (
    SELECT 1 FROM subject_departments sd 
    WHERE sd.subject_id = s.id AND sd.is_active = true
)
ORDER BY s.name;

-- ==============================================
-- 4. SIMULATE CREATING A NEW SUBJECT AND LINKING DEPARTMENTS
-- ==============================================

-- Test with a specific subject if needed
DO $$
DECLARE
    test_subject_id TEXT;
    test_dept_id TEXT;
BEGIN
    -- Get a subject that might not have departments
    SELECT s.id INTO test_subject_id 
    FROM subjects s
    WHERE NOT EXISTS (
        SELECT 1 FROM subject_departments sd 
        WHERE sd.subject_id = s.id AND sd.is_active = true
    )
    LIMIT 1;
    
    -- Get a department
    SELECT id INTO test_dept_id FROM departments LIMIT 1;
    
    IF test_subject_id IS NOT NULL AND test_dept_id IS NOT NULL THEN
        -- Create a test relationship
        INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
        VALUES (test_subject_id, test_dept_id, true, true)
        ON CONFLICT (subject_id, department_id) DO NOTHING;
        
        RAISE NOTICE 'Created test relationship for subject: %', test_subject_id;
        
        -- Show the result
        RAISE NOTICE 'Frontend should now see departments for this subject';
    END IF;
END $$;

-- ==============================================
-- 5. FINAL CHECK - SHOW WHAT FRONTEND WILL GET
-- ==============================================

-- Show first 5 subjects with their department data in frontend format
SELECT 
    s.name as "Subject Name",
    s.code as "Subject Code",
    COUNT(sd.id) as "Department Count",
    array_agg(d.name ORDER BY sd.is_primary_department DESC) as "Department Names"
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.name, s.code
ORDER BY s.name
LIMIT 5;

-- ==============================================
-- TEST COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Frontend data test completed!';
    RAISE NOTICE '🔍 Check the results above';
    RAISE NOTICE '📊 Frontend should receive department data for each subject';
    RAISE NOTICE '🎯 If departments still dont show, the issue is in React component state';
END $$;
