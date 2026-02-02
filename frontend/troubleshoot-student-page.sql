-- Troubleshoot Student Page Issues
-- Run this to check if the database update was successful

-- 1. Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('students', 'departments', 'study_years', 'semesters', 'subjects', 'student_semester_registrations', 'student_subject_enrollments', 'student_invoices') 
        THEN '✅ Clean Schema Table'
        ELSE '❌ Old Table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check students table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check departments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'departments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if we have data
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'semesters' as table_name, COUNT(*) as count FROM semesters
UNION ALL
SELECT 'subjects' as table_name, COUNT(*) as count FROM subjects;

-- 5. Test the exact query the frontend is making
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

-- 6. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'departments')
ORDER BY tablename, policyname;

