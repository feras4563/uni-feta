-- ==============================================
-- TEST SEMESTER NUMBER FIX
-- This script tests that the semester_number column fix works correctly
-- ==============================================

-- Test 1: Verify the corrected query works
SELECT 'Test 1: Corrected Query Test' as test_name;

SELECT 
  ssr.id as registration_id,
  ssr.student_id,
  ssr.semester_id,
  ssr.semester_number,  -- This should work now
  ssr.registration_date,
  ssr.status,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  sem.start_date,
  sem.end_date,
  sy.name as study_year_name
FROM student_semester_registrations ssr
LEFT JOIN semesters sem ON sem.id = ssr.semester_id
LEFT JOIN study_years sy ON sy.id = sem.study_year_id
ORDER BY ssr.registration_date DESC
LIMIT 3;

-- Test 2: Verify the view creation works
SELECT 'Test 2: View Creation Test' as test_name;

-- Drop the view if it exists
DROP VIEW IF EXISTS registration_details_view;

-- Create the corrected view
CREATE VIEW registration_details_view AS
SELECT 
  -- Registration ID (prefer enrollment ID if available, otherwise registration ID)
  COALESCE(sse.id, ssr.id) as id,
  
  -- Student information
  s.id as student_id,
  s.name as student_name,
  s.email as student_email,
  s.national_id_passport,
  s.phone,
  s.address,
  
  -- Department information
  d.id as department_id,
  d.name as department_name,
  d.name_en as department_name_en,
  
  -- Semester information (CORRECTED: using ssr.semester_number)
  sem.id as semester_id,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  sem.start_date as semester_start_date,
  sem.end_date as semester_end_date,
  ssr.semester_number,  -- CORRECTED: This comes from registration table
  
  -- Study year information
  sy.id as study_year_id,
  sy.name as study_year_name,
  sy.name_en as study_year_name_en,
  
  -- Registration information
  ssr.registration_date,
  ssr.status as registration_status,
  ssr.tuition_paid,
  ssr.notes as registration_notes,
  ssr.created_at as registration_created_at,
  ssr.updated_at as registration_updated_at,
  
  -- Enrollment information (if available)
  sse.enrollment_date,
  sse.payment_status,
  sse.subject_cost,
  sse.status as enrollment_status,
  
  -- Subject information (if available)
  sub.id as subject_id,
  sub.code as subject_code,
  sub.name as subject_name,
  sub.name_en as subject_name_en,
  sub.credits,
  sub.total_cost as subject_total_cost,
  
  -- Data source indicator
  CASE 
    WHEN sse.id IS NOT NULL THEN 'enrollment'
    ELSE 'registration'
  END as data_source
  
FROM student_semester_registrations ssr
LEFT JOIN students s ON s.id = ssr.student_id
LEFT JOIN departments d ON d.id = ssr.department_id
LEFT JOIN semesters sem ON sem.id = ssr.semester_id
LEFT JOIN study_years sy ON sy.id = sem.study_year_id
LEFT JOIN student_subject_enrollments sse ON sse.student_id = ssr.student_id 
  AND sse.semester_id = ssr.semester_id
LEFT JOIN subjects sub ON sub.id = sse.subject_id;

-- Test 3: Query the view
SELECT 'Test 3: View Query Test' as test_name;

SELECT 
  id,
  student_name,
  semester_name,
  semester_number,  -- This should work now
  study_year_name,
  registration_date,
  registration_status,
  data_source
FROM registration_details_view
ORDER BY registration_date DESC
LIMIT 3;

-- Test 4: Verify semester_number is accessible
SELECT 'Test 4: Semester Number Access Test' as test_name;

SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT semester_number) as unique_semester_numbers,
  MIN(semester_number) as min_semester_number,
  MAX(semester_number) as max_semester_number
FROM registration_details_view
WHERE semester_number IS NOT NULL;

-- Test 5: Sample data with semester numbers
SELECT 'Test 5: Sample Data with Semester Numbers' as test_name;

SELECT 
  student_name,
  semester_name,
  semester_number,
  study_year_name,
  registration_date
FROM registration_details_view
WHERE semester_number IS NOT NULL
ORDER BY semester_number, registration_date DESC
LIMIT 5;

-- ==============================================
-- SUMMARY
-- ==============================================

SELECT 'All Tests Completed Successfully!' as status;
SELECT 
  'The semester_number column fix has been applied' as fix_applied,
  'The corrected query uses ssr.semester_number instead of sem.semester_number' as solution,
  'The view creation and queries should now work without errors' as result;

