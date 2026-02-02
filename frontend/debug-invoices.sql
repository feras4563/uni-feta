-- ==============================================
-- DEBUG INVOICE QUERIES
-- This script helps debug why invoices aren't showing in the UI
-- ==============================================

-- Test 1: Check if invoices exist
SELECT 'Test 1: Check if invoices exist' as test;
SELECT COUNT(*) as invoice_count FROM student_invoices;

-- Test 2: Show all invoices with basic info
SELECT 'Test 2: Show all invoices with basic info' as test;
SELECT 
  id,
  invoice_number,
  student_id,
  semester_id,
  department_id,
  total_amount,
  status,
  invoice_date
FROM student_invoices
ORDER BY invoice_date DESC;

-- Test 3: Test the complex query that the UI uses
SELECT 'Test 3: Test complex query with joins' as test;
SELECT 
  si.id,
  si.invoice_number,
  si.total_amount,
  si.status,
  s.name as student_name,
  s.national_id_passport,
  sem.name as semester_name,
  d.name as department_name
FROM student_invoices si
LEFT JOIN students s ON si.student_id = s.id
LEFT JOIN semesters sem ON si.semester_id = sem.id
LEFT JOIN departments d ON si.department_id = d.id
ORDER BY si.invoice_date DESC;

-- Test 4: Check if related tables have data
SELECT 'Test 4: Check related tables' as test;
SELECT 
  'students' as table_name,
  COUNT(*) as count
FROM students
UNION ALL
SELECT 
  'semesters' as table_name,
  COUNT(*) as count
FROM semesters
UNION ALL
SELECT 
  'departments' as table_name,
  COUNT(*) as count
FROM departments
UNION ALL
SELECT 
  'invoice_items' as table_name,
  COUNT(*) as count
FROM invoice_items;

-- Test 5: Check invoice items
SELECT 'Test 5: Check invoice items' as test;
SELECT 
  ii.id,
  ii.invoice_id,
  ii.subject_id,
  ii.description,
  ii.unit_price,
  s.code as subject_code,
  s.name as subject_name
FROM invoice_items ii
LEFT JOIN subjects s ON ii.subject_id = s.id
ORDER BY ii.created_at DESC;

-- Test 6: Test the exact query structure used by the API
SELECT 'Test 6: Test exact API query structure' as test;
SELECT 
  si.*,
  s.id as student_id_check,
  s.name as student_name,
  s.national_id_passport,
  s.email,
  sem.id as semester_id_check,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  d.id as department_id_check,
  d.name as department_name,
  d.name_en as department_name_en
FROM student_invoices si
LEFT JOIN students s ON si.student_id = s.id
LEFT JOIN semesters sem ON si.semester_id = sem.id
LEFT JOIN departments d ON si.department_id = d.id
ORDER BY si.invoice_date DESC;

-- Test 7: Check for any data type issues
SELECT 'Test 7: Check data types and constraints' as test;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_invoices'
ORDER BY ordinal_position;

-- Test 8: Check for any RLS issues
SELECT 'Test 8: Check RLS policies' as test;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'student_invoices';

-- Final summary
SELECT 'Debug completed!' as final_status;





