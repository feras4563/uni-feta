-- ==============================================
-- TEST: EXACT API FUNCTION QUERY
-- ==============================================
-- This tests the exact query that getSubjectDepartments() uses

-- Get a real subject ID first
DO $$
DECLARE
    test_subject_id TEXT;
BEGIN
    -- Get the first subject with departments
    SELECT s.id INTO test_subject_id
    FROM subjects s
    WHERE EXISTS (
        SELECT 1 FROM subject_departments sd 
        WHERE sd.subject_id = s.id AND sd.is_active = true
    )
    LIMIT 1;
    
    RAISE NOTICE 'Testing with Subject ID: %', test_subject_id;
END $$;

-- ==============================================
-- EXACT API QUERY SIMULATION
-- ==============================================

-- This is exactly what getSubjectDepartments() does:
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
WHERE sd.subject_id = (
    SELECT s.id
    FROM subjects s
    WHERE EXISTS (
        SELECT 1 FROM subject_departments sd2 
        WHERE sd2.subject_id = s.id AND sd2.is_active = true
    )
    LIMIT 1
)
AND sd.is_active = true
ORDER BY sd.is_primary_department DESC;

-- ==============================================
-- CHECK FOR COMMON ISSUES
-- ==============================================

-- 1. Check if any subjects have no departments
SELECT 
    COUNT(*) as subjects_without_departments
FROM subjects s
WHERE NOT EXISTS (
    SELECT 1 FROM subject_departments sd 
    WHERE sd.subject_id = s.id AND sd.is_active = true
);

-- 2. Check if there are inactive relationships
SELECT 
    COUNT(*) as inactive_relationships
FROM subject_departments sd
WHERE sd.is_active = false;

-- 3. Show all subjects with their department count
SELECT 
    s.id,
    s.name,
    s.code,
    COUNT(sd.id) as department_count,
    array_agg(d.name) as department_names
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.name, s.code
ORDER BY department_count DESC, s.name
LIMIT 10;

-- ==============================================
-- TEST WITH SPECIFIC SUBJECT IDS
-- ==============================================

-- Test with the subjects we see in the first screenshot
SELECT 
    'Testing hfew subject' as test_name,
    sd.id,
    sd.department_id,
    sd.is_primary_department,
    sd.is_active,
    d.name as department_name
FROM subjects s
JOIN subject_departments sd ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
WHERE s.name = 'hfew' AND sd.is_active = true
ORDER BY sd.is_primary_department DESC;

SELECT 
    'Testing أمن المعلومات subject' as test_name,
    sd.id,
    sd.department_id,
    sd.is_primary_department,
    sd.is_active,
    d.name as department_name
FROM subjects s
JOIN subject_departments sd ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
WHERE s.name = 'أمن المعلومات' AND sd.is_active = true
ORDER BY sd.is_primary_department DESC;

-- ==============================================
-- FINAL VERIFICATION
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ API function test completed!';
    RAISE NOTICE '🔍 Check the results above to see what the API should return';
    RAISE NOTICE '📊 This data should appear in the React component';
    RAISE NOTICE '🚀 If the API returns data but frontend shows nothing, its a React issue';
END $$;
