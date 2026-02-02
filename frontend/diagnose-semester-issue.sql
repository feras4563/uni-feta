-- Diagnose the current semester issue
-- This script will help us understand what's going wrong

-- Check current database state
SELECT '=== CURRENT DATABASE STATE ===' as section;

-- Show all semesters with their current status
SELECT 
    s.id,
    s.name,
    s.code,
    sy.name as study_year,
    s.is_current,
    s.is_active,
    s.created_at,
    s.updated_at
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.created_at;

-- Count current semesters
SELECT 'Current semesters count:' as info, COUNT(*) as count
FROM semesters 
WHERE is_current = true;

-- Check if there are any existing triggers
SELECT 'Existing triggers on semesters table:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'semesters';

-- Check if there are any existing constraints/indexes
SELECT 'Existing indexes on semesters table:' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'semesters';

-- Check if the table has RLS enabled
SELECT 'RLS status on semesters table:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'semesters';

-- Check for any foreign key constraints
SELECT 'Foreign key constraints on semesters:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'semesters';

-- Check if there are any policies on the semesters table
SELECT 'RLS policies on semesters table:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'semesters';
