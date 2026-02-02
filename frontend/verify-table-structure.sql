-- ==============================================
-- VERIFY TABLE STRUCTURE
-- This script checks the actual table structures to confirm the column names
-- ==============================================

-- Check semesters table structure
SELECT 'SEMESTERS TABLE COLUMNS:' as table_name;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'semesters' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check student_semester_registrations table structure
SELECT 'STUDENT_SEMESTER_REGISTRATIONS TABLE COLUMNS:' as table_name;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_semester_registrations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple query to verify the fix works
SELECT 'TESTING CORRECTED QUERY:' as test_name;

SELECT 
  ssr.id as registration_id,
  ssr.semester_number,  -- This should work
  sem.name as semester_name,
  sem.start_date,
  sem.end_date
FROM student_semester_registrations ssr
LEFT JOIN semesters sem ON sem.id = ssr.semester_id
LIMIT 3;

-- If the above query works, then the fix is correct
SELECT 'QUERY TEST COMPLETED' as status;

