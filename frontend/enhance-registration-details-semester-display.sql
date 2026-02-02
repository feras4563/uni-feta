-- ==============================================
-- ENHANCE REGISTRATION DETAILS SEMESTER DISPLAY
-- This script ensures that the registration details page shows
-- the correct semester information from the registration system
-- ==============================================

-- ==============================================
-- 1. CHECK CURRENT REGISTRATION DATA STRUCTURE
-- ==============================================

-- Check student semester registrations with semester details
SELECT 'Current Student Semester Registrations' as info;
SELECT 
  ssr.id as registration_id,
  ssr.student_id,
  ssr.semester_id,
  ssr.semester_number,
  ssr.registration_date,
  ssr.status as registration_status,
  ssr.tuition_paid,
  ssr.notes,
  
  -- Student information
  s.name as student_name,
  s.email as student_email,
  s.national_id_passport,
  
  -- Semester information
  sem.id as semester_id,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  sem.start_date as semester_start_date,
  sem.end_date as semester_end_date,
  
  -- Study year information
  sy.id as study_year_id,
  sy.name as study_year_name,
  sy.name_en as study_year_name_en,
  
  -- Department information
  d.id as department_id,
  d.name as department_name,
  d.name_en as department_name_en
  
FROM student_semester_registrations ssr
LEFT JOIN students s ON s.id = ssr.student_id
LEFT JOIN semesters sem ON sem.id = ssr.semester_id
LEFT JOIN study_years sy ON sy.id = sem.study_year_id
LEFT JOIN departments d ON d.id = ssr.department_id
ORDER BY ssr.registration_date DESC
LIMIT 10;

-- ==============================================
-- 2. CHECK STUDENT SUBJECT ENROLLMENTS
-- ==============================================

-- Check if student_subject_enrollments exists and has data
SELECT 'Student Subject Enrollments Check' as info;
SELECT 
  COUNT(*) as total_enrollments,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT semester_id) as unique_semesters
FROM student_subject_enrollments;

-- Sample of student subject enrollments
SELECT 'Sample Student Subject Enrollments' as info;
SELECT 
  sse.id as enrollment_id,
  sse.student_id,
  sse.semester_id,
  sse.subject_id,
  sse.enrollment_date,
  sse.payment_status,
  sse.subject_cost,
  
  -- Student information
  s.name as student_name,
  s.email as student_email,
  
  -- Semester information
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  sem.start_date as semester_start_date,
  sem.end_date as semester_end_date,
  
  -- Study year information
  sy.name as study_year_name,
  
  -- Subject information
  sub.code as subject_code,
  sub.name as subject_name,
  sub.credits,
  sub.total_cost
  
FROM student_subject_enrollments sse
LEFT JOIN students s ON s.id = sse.student_id
LEFT JOIN semesters sem ON sem.id = sse.semester_id
LEFT JOIN study_years sy ON sy.id = sem.study_year_id
LEFT JOIN subjects sub ON sub.id = sse.subject_id
ORDER BY sse.enrollment_date DESC
LIMIT 5;

-- ==============================================
-- 3. CREATE ENHANCED VIEW FOR REGISTRATION DETAILS
-- ==============================================

-- Create a comprehensive view that combines registration and enrollment data
CREATE OR REPLACE VIEW registration_details_view AS
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
  
  -- Semester information
  sem.id as semester_id,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  sem.start_date as semester_start_date,
  sem.end_date as semester_end_date,
  ssr.semester_number,
  
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

-- ==============================================
-- 4. CREATE FUNCTION TO GET REGISTRATION DETAILS
-- ==============================================

-- Function to get comprehensive registration details for a specific registration
CREATE OR REPLACE FUNCTION get_registration_details(registration_id TEXT)
RETURNS TABLE (
  id TEXT,
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  national_id_passport TEXT,
  department_id TEXT,
  department_name TEXT,
  semester_id TEXT,
  semester_name TEXT,
  semester_name_en TEXT,
  semester_start_date DATE,
  semester_end_date DATE,
  study_year_name TEXT,
  registration_date DATE,
  registration_status TEXT,
  tuition_paid BOOLEAN,
  registration_notes TEXT,
  total_subjects INTEGER,
  total_cost DECIMAL,
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rdv.id,
    rdv.student_id,
    rdv.student_name,
    rdv.student_email,
    rdv.national_id_passport,
    rdv.department_id,
    rdv.department_name,
    rdv.semester_id,
    rdv.semester_name,
    rdv.semester_name_en,
    rdv.semester_start_date,
    rdv.semester_end_date,
    rdv.study_year_name,
    rdv.registration_date,
    rdv.registration_status,
    rdv.tuition_paid,
    rdv.registration_notes,
    COUNT(DISTINCT rdv.subject_id)::INTEGER as total_subjects,
    COALESCE(SUM(rdv.subject_total_cost), 0) as total_cost,
    CASE 
      WHEN rdv.tuition_paid THEN 'paid'
      ELSE 'unpaid'
    END as payment_status
  FROM registration_details_view rdv
  WHERE rdv.id = registration_id
  GROUP BY 
    rdv.id, rdv.student_id, rdv.student_name, rdv.student_email, 
    rdv.national_id_passport, rdv.department_id, rdv.department_name,
    rdv.semester_id, rdv.semester_name, rdv.semester_name_en,
    rdv.semester_start_date, rdv.semester_end_date, rdv.study_year_name,
    rdv.registration_date, rdv.registration_status, rdv.tuition_paid,
    rdv.registration_notes;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. CREATE FUNCTION TO GET REGISTRATION SUBJECTS
-- ==============================================

-- Function to get subjects for a specific registration
CREATE OR REPLACE FUNCTION get_registration_subjects(registration_id TEXT)
RETURNS TABLE (
  subject_id TEXT,
  subject_code TEXT,
  subject_name TEXT,
  subject_name_en TEXT,
  credits INTEGER,
  total_cost DECIMAL,
  enrollment_date DATE,
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rdv.subject_id,
    rdv.subject_code,
    rdv.subject_name,
    rdv.subject_name_en,
    rdv.credits,
    rdv.subject_total_cost,
    rdv.enrollment_date,
    rdv.payment_status
  FROM registration_details_view rdv
  WHERE rdv.id = registration_id
    AND rdv.subject_id IS NOT NULL
  ORDER BY rdv.subject_code;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. TEST THE FUNCTIONS
-- ==============================================

-- Test the registration details function
SELECT 'Testing Registration Details Function' as info;
SELECT * FROM get_registration_details(
  (SELECT id FROM student_semester_registrations LIMIT 1)
);

-- Test the registration subjects function
SELECT 'Testing Registration Subjects Function' as info;
SELECT * FROM get_registration_subjects(
  (SELECT id FROM student_semester_registrations LIMIT 1)
);

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Verify the view works correctly
SELECT 'Verification: Registration Details View' as info;
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT semester_id) as unique_semesters,
  COUNT(DISTINCT subject_id) as unique_subjects
FROM registration_details_view;

-- Sample data from the view
SELECT 'Sample Registration Details' as info;
SELECT 
  id,
  student_name,
  semester_name,
  study_year_name,
  registration_date,
  registration_status,
  tuition_paid,
  data_source
FROM registration_details_view
ORDER BY registration_date DESC
LIMIT 5;

-- ==============================================
-- 8. SUMMARY
-- ==============================================

SELECT 'Summary: Enhanced Registration Details Display' as info;
SELECT 
  'Registration details now include comprehensive semester information' as status,
  'The view combines registration and enrollment data' as feature1,
  'Functions provide easy access to registration details and subjects' as feature2,
  'Frontend can now display complete semester information from registration' as result;
