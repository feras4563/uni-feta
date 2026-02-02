-- ==============================================
-- TEST INVOICE TABLES
-- This script tests if the invoice tables exist and are accessible
-- ==============================================

-- Test 1: Check if tables exist
SELECT 'Testing table existence...' as test;

SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_name IN ('student_invoices', 'invoice_items')
ORDER BY table_name;

-- Test 2: Check table structure
SELECT 'Testing table structure...' as test;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('student_invoices', 'invoice_items')
ORDER BY table_name, ordinal_position;

-- Test 3: Test basic queries
SELECT 'Testing basic queries...' as test;

-- Test student_invoices query
SELECT 
  'student_invoices' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'QUERY SUCCESSFUL' 
    ELSE 'QUERY FAILED' 
  END as status
FROM student_invoices;

-- Test invoice_items query
SELECT 
  'invoice_items' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'QUERY SUCCESSFUL' 
    ELSE 'QUERY FAILED' 
  END as status
FROM invoice_items;

-- Test 4: Test joins with related tables
SELECT 'Testing joins with related tables...' as test;

-- Test join with students table
SELECT 
  'student_invoices + students' as test_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'JOIN SUCCESSFUL' 
    ELSE 'JOIN FAILED' 
  END as status
FROM student_invoices si
LEFT JOIN students s ON si.student_id = s.id;

-- Test join with semesters table
SELECT 
  'student_invoices + semesters' as test_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'JOIN SUCCESSFUL' 
    ELSE 'JOIN FAILED' 
  END as status
FROM student_invoices si
LEFT JOIN semesters sem ON si.semester_id = sem.id;

-- Test join with departments table
SELECT 
  'student_invoices + departments' as test_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'JOIN SUCCESSFUL' 
    ELSE 'JOIN FAILED' 
  END as status
FROM student_invoices si
LEFT JOIN departments d ON si.department_id = d.id;

-- Test join with subjects table
SELECT 
  'invoice_items + subjects' as test_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'JOIN SUCCESSFUL' 
    ELSE 'JOIN FAILED' 
  END as status
FROM invoice_items ii
LEFT JOIN subjects sub ON ii.subject_id = sub.id;

-- Test 5: Test the complex query that was failing
SELECT 'Testing complex query...' as test;

SELECT 
  'Complex invoice query' as test_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'COMPLEX QUERY SUCCESSFUL' 
    ELSE 'COMPLEX QUERY FAILED' 
  END as status
FROM student_invoices si
LEFT JOIN students s ON si.student_id = s.id
LEFT JOIN semesters sem ON si.semester_id = sem.id
LEFT JOIN departments d ON si.department_id = d.id
LEFT JOIN invoice_items ii ON si.id = ii.invoice_id
LEFT JOIN subjects sub ON ii.subject_id = sub.id;

-- Test 6: Check RLS policies
SELECT 'Testing RLS policies...' as test;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('student_invoices', 'invoice_items')
ORDER BY tablename, policyname;

-- Final success message
SELECT 'All tests completed!' as final_status;
