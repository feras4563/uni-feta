-- ==============================================
-- CHECK DATABASE STATUS
-- ==============================================
-- This script checks if the clean database schema has been applied

-- Check if our clean tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('students', 'departments', 'study_years', 'semesters', 'subjects', 'student_semester_registrations', 'student_subject_enrollments', 'student_invoices') 
        THEN '✅ Clean Schema Table'
        ELSE '❌ Old Table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if sequences exist
SELECT sequence_name, start_value, minimum_value, maximum_value
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- Check if our sample data exists
SELECT 
    'students' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ No Data' END as status
FROM students
UNION ALL
SELECT 
    'departments' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ No Data' END as status
FROM departments
UNION ALL
SELECT 
    'semesters' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ No Data' END as status
FROM semesters
UNION ALL
SELECT 
    'subjects' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ No Data' END as status
FROM subjects;

-- Check if foreign key constraints exist
SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

