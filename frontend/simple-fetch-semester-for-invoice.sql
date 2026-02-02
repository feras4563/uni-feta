-- ==============================================
-- SIMPLE QUERY: FETCH SEMESTER_ID FROM REGISTRATION FOR INVOICE
-- This query gets the semester_id from student registration to use in invoice
-- for the "الفصل الدراسي للتسجيل" field
-- ==============================================

-- Query to get semester_id from registration for invoice display
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id as invoice_semester_id,
  si.invoice_number,
  si.invoice_date,
  si.total_amount,
  si.status as invoice_status,
  
  -- Student information
  s.name as student_name,
  s.email as student_email,
  s.national_id_passport,
  
  -- Semester information from registration
  ssr.semester_id as registration_semester_id,
  ssr.semester_number,
  ssr.registration_date,
  ssr.status as registration_status,
  
  -- Semester details
  sem.id as semester_id,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  
  -- Department information
  d.name as department_name,
  d.name_en as department_name_en
  
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters sem ON sem.id = si.semester_id
LEFT JOIN departments d ON d.id = si.department_id
LEFT JOIN student_semester_registrations ssr ON ssr.student_id = si.student_id 
  AND ssr.semester_id = si.semester_id
ORDER BY si.invoice_date DESC;

-- Alternative query: Get the most recent registration semester for each student
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id as current_invoice_semester_id,
  si.invoice_number,
  si.invoice_date,
  si.total_amount,
  si.status as invoice_status,
  
  -- Student information
  s.name as student_name,
  s.email as student_email,
  
  -- Most recent registration semester
  latest_reg.semester_id as latest_registration_semester_id,
  latest_reg.semester_number,
  latest_reg.registration_date,
  latest_reg.status as registration_status,
  
  -- Semester details from latest registration
  latest_sem.name as latest_semester_name,
  latest_sem.name_en as latest_semester_name_en,
  
  -- Current semester details (if different from latest registration)
  current_sem.name as current_semester_name,
  current_sem.name_en as current_semester_name_en
  
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters current_sem ON current_sem.id = si.semester_id
LEFT JOIN LATERAL (
  SELECT 
    semester_id,
    semester_number,
    registration_date,
    status
  FROM student_semester_registrations
  WHERE student_id = si.student_id
    AND status = 'active'
  ORDER BY registration_date DESC
  LIMIT 1
) latest_reg ON true
LEFT JOIN semesters latest_sem ON latest_sem.id = latest_reg.semester_id
ORDER BY si.invoice_date DESC;

-- Query to update invoice semester_id from latest registration (if needed)
UPDATE student_invoices 
SET semester_id = latest_registration.semester_id
FROM (
  SELECT DISTINCT ON (student_id) 
    student_id,
    semester_id,
    registration_date
  FROM student_semester_registrations
  WHERE status = 'active'
  ORDER BY student_id, registration_date DESC
) AS latest_registration
WHERE student_invoices.student_id = latest_registration.student_id
  AND student_invoices.semester_id IS NULL;

-- Final verification query
SELECT 
  'Invoices with semester_id from registration' as status,
  COUNT(*) as total_invoices,
  COUNT(semester_id) as invoices_with_semester_id
FROM student_invoices;
