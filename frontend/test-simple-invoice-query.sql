-- ==============================================
-- TEST SIMPLE INVOICE QUERY
-- This tests the exact query used in fetchBasicInvoices
-- ==============================================

-- Test 1: Check table structure
SELECT 'Test 1: Table structure' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_invoices'
ORDER BY ordinal_position;

-- Test 2: Test the exact query from fetchBasicInvoices
SELECT 'Test 2: Exact query from fetchBasicInvoices' as test;
SELECT *
FROM student_invoices
ORDER BY invoice_date DESC;

-- Test 3: Test with limit to see if it's a data issue
SELECT 'Test 3: Test with limit' as test;
SELECT *
FROM student_invoices
ORDER BY invoice_date DESC
LIMIT 3;

-- Test 4: Check if invoice_date column exists and has data
SELECT 'Test 4: Check invoice_date column' as test;
SELECT 
  COUNT(*) as total_count,
  COUNT(invoice_date) as non_null_dates,
  MIN(invoice_date) as earliest_date,
  MAX(invoice_date) as latest_date
FROM student_invoices;

-- Test 5: Test without ORDER BY
SELECT 'Test 5: Test without ORDER BY' as test;
SELECT *
FROM student_invoices
LIMIT 3;

-- Summary
SELECT 'Simple invoice query test completed!' as summary;





