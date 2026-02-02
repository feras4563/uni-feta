-- Disable RLS temporarily for testing
-- This will allow the frontend to access the data

-- Disable RLS on all tables
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_semester_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices DISABLE ROW LEVEL SECURITY;

-- Test if we can now access the data
SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as department_count FROM departments;

-- Test the exact query the frontend makes
SELECT 
    s.id,
    s.name,
    s.name_en,
    s.department_id,
    s.year,
    s.status,
    s.national_id_passport,
    s.email,
    s.phone,
    s.gender,
    s.nationality,
    s.birth_date,
    s.enrollment_date,
    s.address,
    s.sponsor_name,
    s.sponsor_contact,
    s.academic_history,
    s.academic_score,
    s.transcript_file,
    s.qr_code,
    s.created_at,
    s.updated_at,
    d.id as dept_id,
    d.name as dept_name
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY s.created_at DESC
LIMIT 5;
