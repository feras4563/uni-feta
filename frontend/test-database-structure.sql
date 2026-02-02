-- ==============================================
-- TEST DATABASE STRUCTURE
-- ==============================================
-- This script tests if the database has the correct structure
-- that the frontend expects

-- Test 1: Check if students table exists and has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if departments table exists and has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'departments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 3: Check foreign key relationship between students and departments
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='students'
AND tc.table_schema='public';

-- Test 4: Try to query students with departments (same as frontend)
SELECT 
    s.id,
    s.name,
    s.name_en,
    s.department_id,
    s.year,
    s.status,
    s.national_id_passport,
    s.email,
    s.phone,
    s.gender,
    s.nationality,
    s.birth_date,
    s.enrollment_date,
    s.address,
    s.sponsor_name,
    s.sponsor_contact,
    s.academic_history,
    s.academic_score,
    s.transcript_file,
    s.qr_code,
    s.created_at,
    s.updated_at,
    d.id as dept_id,
    d.name as dept_name
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Test 5: Check if there's any data in the tables
SELECT 'students' as table_name, COUNT(*) as row_count FROM students
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as row_count FROM departments
UNION ALL
SELECT 'semesters' as table_name, COUNT(*) as row_count FROM semesters
UNION ALL
SELECT 'subjects' as table_name, COUNT(*) as row_count FROM subjects;

