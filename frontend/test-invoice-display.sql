-- ==============================================
-- TEST INVOICE DISPLAY ISSUE
-- This script tests why invoices aren't showing in the UI
-- ==============================================

-- Test 1: Check the exact data in student_invoices
SELECT 'Test 1: Raw invoice data' as test;
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

-- Test 2: Check if students exist for these invoice student_ids
SELECT 'Test 2: Check if students exist' as test;
SELECT 
  si.student_id,
  s.id as student_exists,
  s.name as student_name,
  s.national_id_passport
FROM student_invoices si
LEFT JOIN students s ON si.student_id = s.id
ORDER BY si.invoice_date DESC;

-- Test 3: Check if semesters exist for these invoice semester_ids
SELECT 'Test 3: Check if semesters exist' as test;
SELECT 
  si.semester_id,
  sem.id as semester_exists,
  sem.name as semester_name,
  sem.name_en as semester_name_en
FROM student_invoices si
LEFT JOIN semesters sem ON si.semester_id = sem.id
ORDER BY si.invoice_date DESC;

-- Test 4: Check if departments exist for these invoice department_ids
SELECT 'Test 4: Check if departments exist' as test;
SELECT 
  si.department_id,
  d.id as department_exists,
  d.name as department_name,
  d.name_en as department_name_en
FROM student_invoices si
LEFT JOIN departments d ON si.department_id = d.id
ORDER BY si.invoice_date DESC;

-- Test 5: Test the exact query structure the UI uses
SELECT 'Test 5: Test UI query structure' as test;
SELECT 
  si.id,
  si.invoice_number,
  si.total_amount,
  si.status,
  si.invoice_date,
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

-- Test 6: Check invoice items
SELECT 'Test 6: Check invoice items' as test;
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

-- Test 7: Check for any NULL values that might cause issues
SELECT 'Test 7: Check for NULL values' as test;
SELECT 
  COUNT(*) as total_invoices,
  COUNT(student_id) as invoices_with_student_id,
  COUNT(semester_id) as invoices_with_semester_id,
  COUNT(department_id) as invoices_with_department_id,
  COUNT(invoice_number) as invoices_with_invoice_number,
  COUNT(total_amount) as invoices_with_total_amount
FROM student_invoices;

-- Test 8: Check if there are any constraint violations
SELECT 'Test 8: Check constraint violations' as test;
SELECT 
  si.student_id,
  CASE WHEN s.id IS NULL THEN 'MISSING STUDENT' ELSE 'OK' END as student_status,
  si.semester_id,
  CASE WHEN sem.id IS NULL THEN 'MISSING SEMESTER' ELSE 'OK' END as semester_status,
  si.department_id,
  CASE WHEN d.id IS NULL THEN 'MISSING DEPARTMENT' ELSE 'OK' END as department_status
FROM student_invoices si
LEFT JOIN students s ON si.student_id = s.id
LEFT JOIN semesters sem ON si.semester_id = sem.id
LEFT JOIN departments d ON si.department_id = d.id;

-- Final summary
SELECT 'Invoice display test completed!' as final_status;





