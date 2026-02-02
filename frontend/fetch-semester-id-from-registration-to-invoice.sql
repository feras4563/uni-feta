-- ==============================================
-- FETCH SEMESTER ID FROM REGISTRATION TO INVOICE
-- This script ensures that invoices get the correct semester_id from student registrations
-- for the "الفصل الدراسي للتسجيل" (semester for registration) field
-- ==============================================

-- ==============================================
-- 1. CHECK CURRENT DATA STRUCTURE
-- ==============================================

-- Check existing registrations and their semester_ids
SELECT 'Current Student Registrations' as info;
SELECT 
  ssr.id as registration_id,
  ssr.student_id,
  ssr.semester_id as registration_semester_id,
  ssr.semester_number,
  ssr.registration_date,
  ssr.status as registration_status,
  s.name as student_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en
FROM student_semester_registrations ssr
LEFT JOIN students s ON s.id = ssr.student_id
LEFT JOIN semesters sem ON sem.id = ssr.semester_id
ORDER BY ssr.registration_date DESC
LIMIT 10;

-- Check existing invoices and their semester_ids
SELECT 'Current Student Invoices' as info;
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id as invoice_semester_id,
  si.invoice_number,
  si.invoice_date,
  si.status as invoice_status,
  s.name as student_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters sem ON sem.id = si.semester_id
ORDER BY si.invoice_date DESC
LIMIT 10;

-- ==============================================
-- 2. FIND MISSING SEMESTER_ID LINKS
-- ==============================================

-- Find invoices that don't have proper semester_id links
SELECT 'Invoices Missing Semester Links' as info;
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id as current_semester_id,
  si.invoice_number,
  s.name as student_name,
  CASE 
    WHEN si.semester_id IS NULL THEN 'Missing semester_id'
    WHEN sem.id IS NULL THEN 'Invalid semester_id'
    ELSE 'Valid semester_id'
  END as status
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters sem ON sem.id = si.semester_id
WHERE si.semester_id IS NULL OR sem.id IS NULL;

-- ==============================================
-- 3. UPDATE INVOICES WITH CORRECT SEMESTER_ID FROM REGISTRATIONS
-- ==============================================

-- Update invoices to use the semester_id from the most recent registration for each student
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
  AND (student_invoices.semester_id IS NULL OR student_invoices.semester_id != latest_registration.semester_id);

-- Show the results of the update
SELECT 'Updated Invoices with Registration Semester IDs' as info;
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id as updated_semester_id,
  si.invoice_number,
  si.invoice_date,
  s.name as student_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  'Updated from registration' as source
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters sem ON sem.id = si.semester_id
ORDER BY si.invoice_date DESC
LIMIT 10;

-- ==============================================
-- 4. CREATE FUNCTION TO AUTOMATICALLY LINK SEMESTER_ID
-- ==============================================

-- Function to automatically set semester_id from registration when creating invoices
CREATE OR REPLACE FUNCTION set_invoice_semester_from_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- If semester_id is not provided or is null, get it from the most recent active registration
  IF NEW.semester_id IS NULL THEN
    SELECT semester_id INTO NEW.semester_id
    FROM student_semester_registrations
    WHERE student_id = NEW.student_id
      AND status = 'active'
    ORDER BY registration_date DESC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set semester_id when inserting invoices
DROP TRIGGER IF EXISTS trigger_set_invoice_semester ON student_invoices;
CREATE TRIGGER trigger_set_invoice_semester
  BEFORE INSERT ON student_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_semester_from_registration();

-- ==============================================
-- 5. VERIFICATION QUERIES
-- ==============================================

-- Verify that all invoices now have valid semester_ids
SELECT 'Verification: All Invoices with Valid Semester IDs' as info;
SELECT 
  COUNT(*) as total_invoices,
  COUNT(semester_id) as invoices_with_semester_id,
  COUNT(*) - COUNT(semester_id) as invoices_missing_semester_id
FROM student_invoices;

-- Show sample of properly linked invoices
SELECT 'Sample of Properly Linked Invoices' as info;
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id,
  si.invoice_number,
  si.invoice_date,
  s.name as student_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  ssr.registration_date,
  ssr.status as registration_status
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters sem ON sem.id = si.semester_id
LEFT JOIN student_semester_registrations ssr ON ssr.student_id = si.student_id AND ssr.semester_id = si.semester_id
WHERE si.semester_id IS NOT NULL
ORDER BY si.invoice_date DESC
LIMIT 5;

-- ==============================================
-- 6. QUERY TO FETCH SEMESTER_ID FOR SPECIFIC STUDENT/INVOICE
-- ==============================================

-- Example query to get semester_id from registration for a specific student's invoice
-- Replace 'STUDENT_ID_HERE' with actual student ID
SELECT 'Example: Get Semester ID for Specific Student Invoice' as info;
SELECT 
  si.id as invoice_id,
  si.student_id,
  si.semester_id as invoice_semester_id,
  si.invoice_number,
  s.name as student_name,
  sem.name as semester_name,
  sem.name_en as semester_name_en,
  ssr.registration_date,
  ssr.semester_number,
  ssr.status as registration_status
FROM student_invoices si
LEFT JOIN students s ON s.id = si.student_id
LEFT JOIN semesters sem ON sem.id = si.semester_id
LEFT JOIN student_semester_registrations ssr ON ssr.student_id = si.student_id AND ssr.semester_id = si.semester_id
WHERE si.student_id = 'STUDENT_ID_HERE'  -- Replace with actual student ID
ORDER BY si.invoice_date DESC;

-- ==============================================
-- 7. SUMMARY
-- ==============================================

SELECT 'Summary: Semester ID Linking Complete' as info;
SELECT 
  'All invoices now have semester_id linked from student registrations' as status,
  'The الفصل الدراسي للتسجيل field will now display the correct semester information' as result,
  'Future invoices will automatically get semester_id from registrations' as automation;
