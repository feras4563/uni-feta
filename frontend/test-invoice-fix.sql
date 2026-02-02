-- ==============================================
-- TEST INVOICE FIX
-- This tests if the ORDER BY clause was the issue
-- ==============================================

-- Test 1: Check if invoice_date column exists and has data
SELECT 'Test 1: Check invoice_date column' as test;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'student_invoices'
  AND column_name IN ('invoice_date', 'created_at', 'updated_at')
ORDER BY column_name;

-- Test 2: Check data in invoice_date column
SELECT 'Test 2: Check invoice_date data' as test;
SELECT 
  COUNT(*) as total_invoices,
  COUNT(invoice_date) as invoices_with_date,
  COUNT(*) - COUNT(invoice_date) as invoices_without_date,
  MIN(invoice_date) as earliest_date,
  MAX(invoice_date) as latest_date
FROM student_invoices;

-- Test 3: Test query without ORDER BY (should work)
SELECT 'Test 3: Query without ORDER BY' as test;
SELECT 
  id,
  invoice_number,
  student_id,
  total_amount,
  status,
  invoice_date
FROM student_invoices
LIMIT 3;

-- Test 4: Test query with ORDER BY (might fail)
SELECT 'Test 4: Query with ORDER BY' as test;
SELECT 
  id,
  invoice_number,
  student_id,
  total_amount,
  status,
  invoice_date
FROM student_invoices
ORDER BY invoice_date DESC
LIMIT 3;

-- Test 5: Test query with ORDER BY using created_at (fallback)
SELECT 'Test 5: Query with ORDER BY using created_at' as test;
SELECT 
  id,
  invoice_number,
  student_id,
  total_amount,
  status,
  invoice_date,
  created_at
FROM student_invoices
ORDER BY created_at DESC
LIMIT 3;

-- Summary
SELECT 'Invoice fix test completed!' as summary;





