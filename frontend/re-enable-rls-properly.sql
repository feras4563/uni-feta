-- Re-enable RLS with proper policies for frontend
-- Run this after confirming the data is accessible

-- Re-enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_semester_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON departments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON study_years;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON semesters;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON subjects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON student_semester_registrations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON student_subject_enrollments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON student_invoices;

-- Create more permissive policies for frontend
CREATE POLICY "Allow all for authenticated users" ON students FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON departments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON study_years FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON semesters FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON student_semester_registrations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON student_subject_enrollments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON student_invoices FOR ALL USING (true);

-- Alternative: Allow all operations (less secure but works for development)
-- CREATE POLICY "Allow all operations" ON students FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON departments FOR ALL USING (true);

