-- ==============================================
-- CORRECTED SEMESTER QUERY
-- Copy and paste this corrected section to replace the problematic query
-- ==============================================

-- This is the corrected SELECT statement that fixes the semester_number error
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
  ssr.semester_number,  -- CORRECTED: This comes from registration table, not semesters table
  
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
LIMIT 10;

-- ==============================================
-- EXPLANATION OF THE FIX
-- ==============================================

-- The error was: ERROR: 42703: column sem.semester_number does not exist
-- 
-- The problem: The query was trying to access sem.semester_number from the semesters table
-- The solution: Use ssr.semester_number from the student_semester_registrations table instead
--
-- Why this works:
-- 1. The semesters table contains: id, name, name_en, start_date, end_date, study_year_id
-- 2. The student_semester_registrations table contains: semester_number (among other fields)
-- 3. We need to get semester_number from the registration table, not the semesters table
--
-- The corrected line:
-- BEFORE: sem.semester_number,  (ERROR - column doesn't exist)
-- AFTER:  ssr.semester_number,  (CORRECT - column exists in registration table)

