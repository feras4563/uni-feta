-- Comprehensive Database Check
-- This will show us exactly what's wrong

-- 1. Check if students table exists and its structure
SELECT 
    'students' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if departments table exists and its structure
SELECT 
    'departments' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'departments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if we have any data
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as count FROM departments;

-- 4. Try to select all columns from students (this will show us what columns actually exist)
SELECT * FROM students LIMIT 1;

-- 5. Try to select all columns from departments
SELECT * FROM departments LIMIT 1;

-- 6. Check if there are any foreign key constraints
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
AND tc.table_name IN ('students', 'departments')
ORDER BY tc.table_name, tc.constraint_name;

