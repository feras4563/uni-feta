-- ==============================================
-- DEBUG: SUBJECT DEPARTMENTS ISSUE
-- ==============================================
-- This script will help diagnose why departments aren't showing

-- ==============================================
-- 1. CHECK IF TABLES EXIST
-- ==============================================

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('subjects', 'departments', 'subject_departments')
ORDER BY table_name;

-- ==============================================
-- 2. CHECK TABLE STRUCTURES
-- ==============================================

-- Check subjects table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'subjects'
ORDER BY ordinal_position;

-- Check subject_departments table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'subject_departments'
ORDER BY ordinal_position;

-- ==============================================
-- 3. CHECK DATA EXISTS
-- ==============================================

-- Count records in each table
SELECT 'subjects' as table_name, COUNT(*) as count FROM subjects
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'subject_departments' as table_name, COUNT(*) as count FROM subject_departments;

-- ==============================================
-- 4. CHECK SUBJECT-DEPARTMENT RELATIONSHIPS
-- ==============================================

-- Show all subject-department relationships
SELECT 
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    sd.id as relationship_id,
    sd.department_id,
    d.name as department_name,
    sd.is_primary_department,
    sd.is_active,
    sd.created_at
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id
LEFT JOIN departments d ON d.id = sd.department_id
ORDER BY s.name, sd.is_primary_department DESC;

-- ==============================================
-- 5. CHECK THE VIEW
-- ==============================================

-- Check if the view exists
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_name = 'subjects_with_departments';

-- Test the view
SELECT 
    id,
    name,
    code,
    departments,
    primary_department,
    department_name
FROM subjects_with_departments
LIMIT 3;

-- ==============================================
-- 6. CREATE TEST DATA IF MISSING
-- ==============================================

-- Insert test relationships if none exist
DO $$
DECLARE
    test_subject_id TEXT;
    test_department_id TEXT;
    relationship_count INTEGER;
BEGIN
    -- Check if relationships exist
    SELECT COUNT(*) INTO relationship_count FROM subject_departments;
    
    IF relationship_count = 0 THEN
        -- Get first subject and department
        SELECT id INTO test_subject_id FROM subjects LIMIT 1;
        SELECT id INTO test_department_id FROM departments LIMIT 1;
        
        IF test_subject_id IS NOT NULL AND test_department_id IS NOT NULL THEN
            -- Create test relationship
            INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
            VALUES (test_subject_id, test_department_id, true, true);
            
            RAISE NOTICE 'Created test relationship: Subject % -> Department %', test_subject_id, test_department_id;
        ELSE
            RAISE NOTICE 'No subjects or departments found to create test relationship';
        END IF;
    ELSE
        RAISE NOTICE 'Found % existing relationships', relationship_count;
    END IF;
END $$;

-- ==============================================
-- 7. FINAL CHECK
-- ==============================================

-- Show final state
SELECT 
    'Total Subjects' as metric,
    COUNT(*)::text as value
FROM subjects
UNION ALL
SELECT 
    'Total Departments' as metric,
    COUNT(*)::text as value
FROM departments
UNION ALL
SELECT 
    'Total Relationships' as metric,
    COUNT(*)::text as value
FROM subject_departments
UNION ALL
SELECT 
    'Subjects with Departments' as metric,
    COUNT(DISTINCT subject_id)::text as value
FROM subject_departments
UNION ALL
SELECT 
    'Departments with Subjects' as metric,
    COUNT(DISTINCT department_id)::text as value
FROM subject_departments;

-- ==============================================
-- DEBUG COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Debug script completed!';
    RAISE NOTICE '🔍 Check the results above to identify the issue';
    RAISE NOTICE '📊 Look for: missing tables, empty relationships, view issues';
END $$;
