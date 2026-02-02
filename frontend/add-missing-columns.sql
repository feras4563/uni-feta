-- Add Missing Columns to Existing Tables
-- This will add the columns the frontend expects

-- Add missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS sponsor_name TEXT,
ADD COLUMN IF NOT EXISTS sponsor_contact TEXT,
ADD COLUMN IF NOT EXISTS academic_history TEXT,
ADD COLUMN IF NOT EXISTS academic_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS transcript_file TEXT,
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add missing columns to departments table
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS head TEXT,
ADD COLUMN IF NOT EXISTS head_teacher_id TEXT,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Check the updated structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Insert sample data if tables are empty
INSERT INTO departments (id, name, name_en, description, head, head_teacher_id, is_locked) 
SELECT 'DEPT001', 'قسم علوم الحاسوب', 'Computer Science Department', 'تخصص علوم الحاسوب وتقنية المعلومات', 'د. أحمد محمد', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 'DEPT001');

INSERT INTO departments (id, name, name_en, description, head, head_teacher_id, is_locked) 
SELECT 'DEPT002', 'قسم الهندسة', 'Engineering Department', 'تخصص الهندسة المدنية والميكانيكية', 'د. فاطمة أحمد', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 'DEPT002');

INSERT INTO departments (id, name, name_en, description, head, head_teacher_id, is_locked) 
SELECT 'DEPT003', 'قسم إدارة الأعمال', 'Business Administration Department', 'تخصص إدارة الأعمال والاقتصاد', 'د. محمد عبدالله', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 'DEPT003');

INSERT INTO departments (id, name, name_en, description, head, head_teacher_id, is_locked) 
SELECT 'DEPT004', 'قسم الطب', 'Medicine Department', 'تخصص الطب البشري', 'د. نورا سعد', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 'DEPT004');

INSERT INTO departments (id, name, name_en, description, head, head_teacher_id, is_locked) 
SELECT 'DEPT005', 'قسم التربية', 'Education Department', 'تخصص التربية والتعليم', 'د. خالد عبدالرحمن', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 'DEPT005');

-- Insert sample students if table is empty
INSERT INTO students (id, name, name_en, email, national_id_passport, phone, address, department_id, year, gender, nationality, birth_date, enrollment_date, sponsor_name, sponsor_contact, academic_history, academic_score) 
SELECT 'ST100001', 'أحمد محمد علي', 'Ahmed Mohammed Ali', 'ahmed.ali@university.edu', '1234567890', '+966501234567', 'الرياض، المملكة العربية السعودية', 'DEPT001', 1, 'male', 'سعودي', '2000-01-15', '2024-09-01', 'محمد علي', '+966501234567', 'خريج ثانوية عامة', 85.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE id = 'ST100001');

INSERT INTO students (id, name, name_en, email, national_id_passport, phone, address, department_id, year, gender, nationality, birth_date, enrollment_date, sponsor_name, sponsor_contact, academic_history, academic_score) 
SELECT 'ST100002', 'فاطمة أحمد السعد', 'Fatima Ahmed Al-Saad', 'fatima.alsaad@university.edu', '1234567891', '+966501234568', 'جدة، المملكة العربية السعودية', 'DEPT001', 1, 'female', 'سعودي', '2000-03-20', '2024-09-01', 'أحمد السعد', '+966501234568', 'خريج ثانوية عامة', 88.0
WHERE NOT EXISTS (SELECT 1 FROM students WHERE id = 'ST100002');

INSERT INTO students (id, name, name_en, email, national_id_passport, phone, address, department_id, year, gender, nationality, birth_date, enrollment_date, sponsor_name, sponsor_contact, academic_history, academic_score) 
SELECT 'ST100003', 'محمد عبدالله النور', 'Mohammed Abdullah Al-Nour', 'mohammed.alnour@university.edu', '1234567892', '+966501234569', 'الدمام، المملكة العربية السعودية', 'DEPT002', 1, 'male', 'سعودي', '1999-12-10', '2024-09-01', 'عبدالله النور', '+966501234569', 'خريج ثانوية عامة', 82.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE id = 'ST100003');

-- Test the frontend query
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

