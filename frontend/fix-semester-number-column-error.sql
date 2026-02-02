-- ==============================================
-- FIX SEMESTER NUMBER COLUMN ERROR
-- This script fixes the SQL error where sem.semester_number doesn't exist
-- The semester_number column is in the student_semester_registrations table, not semesters table
-- ==============================================

-- ==============================================
-- 1. CHECK TABLE STRUCTURES
-- ==============================================

-- Check what columns exist in the semesters table
SELECT 'Semesters table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'semesters' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what columns exist in the student_semester_registrations table
SELECT 'Student semester registrations table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_semester_registrations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- 2. CORRECTED QUERY
-- ==============================================

-- The corrected query that uses ssr.semester_number instead of sem.semester_number
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
LEFT JOIN subjects sub ON sub.id = sse.subject_id
ORDER BY ssr.registration_date DESC
LIMIT 5;

-- ==============================================
-- 3. VERIFICATION
-- ==============================================

-- Test the corrected query
SELECT 'Testing corrected query...' as info;

-- Simple test to verify the structure works
SELECT 
  ssr.id as registration_id,
  ssr.student_id,
  ssr.semester_number,  -- This should work now
  sem.name as semester_name,
  sem.start_date,
  sem.end_date
FROM student_semester_registrations ssr
LEFT JOIN semesters sem ON sem.id = ssr.semester_id
LIMIT 3;

-- ==============================================
-- 4. SUMMARY
-- ==============================================

SELECT 'Fix Applied Successfully' as info;
SELECT 
  'The semester_number column comes from student_semester_registrations table' as explanation,
  'Use ssr.semester_number instead of sem.semester_number' as solution,
  'The corrected query should now work without errors' as result;
