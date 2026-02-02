-- ==============================================
-- CLEAN SAMPLE DATA FOR STUDENT MANAGEMENT
-- ==============================================

-- ==============================================
-- 1. INSERT DEPARTMENTS
-- ==============================================

INSERT INTO departments (id, name, name_en, description, head, head_teacher_id, is_locked) VALUES
('DEPT001', 'قسم علوم الحاسوب', 'Computer Science Department', 'تخصص علوم الحاسوب وتقنية المعلومات', 'د. أحمد محمد', NULL, false),
('DEPT002', 'قسم الهندسة', 'Engineering Department', 'تخصص الهندسة المدنية والميكانيكية', 'د. فاطمة أحمد', NULL, false),
('DEPT003', 'قسم إدارة الأعمال', 'Business Administration Department', 'تخصص إدارة الأعمال والاقتصاد', 'د. محمد عبدالله', NULL, false),
('DEPT004', 'قسم الطب', 'Medicine Department', 'تخصص الطب البشري', 'د. نورا سعد', NULL, false),
('DEPT005', 'قسم التربية', 'Education Department', 'تخصص التربية والتعليم', 'د. خالد عبدالرحمن', NULL, false);

-- ==============================================
-- 2. INSERT STUDENTS
-- ==============================================

INSERT INTO students (id, name, name_en, email, national_id_passport, phone, address, department_id, year, gender, nationality, birth_date, enrollment_date, sponsor_name, sponsor_contact, academic_history, academic_score) VALUES
('ST100001', 'أحمد محمد علي', 'Ahmed Mohammed Ali', 'ahmed.ali@university.edu', '1234567890', '+966501234567', 'الرياض، المملكة العربية السعودية', 'DEPT001', 1, 'male', 'سعودي', '2000-01-15', '2024-09-01', 'محمد علي', '+966501234567', 'خريج ثانوية عامة', 85.5),
('ST100002', 'فاطمة أحمد السعد', 'Fatima Ahmed Al-Saad', 'fatima.alsaad@university.edu', '1234567891', '+966501234568', 'جدة، المملكة العربية السعودية', 'DEPT001', 1, 'female', 'سعودي', '2000-03-20', '2024-09-01', 'أحمد السعد', '+966501234568', 'خريج ثانوية عامة', 88.0),
('ST100003', 'محمد عبدالله النور', 'Mohammed Abdullah Al-Nour', 'mohammed.alnour@university.edu', '1234567892', '+966501234569', 'الدمام، المملكة العربية السعودية', 'DEPT002', 1, 'male', 'سعودي', '1999-12-10', '2024-09-01', 'عبدالله النور', '+966501234569', 'خريج ثانوية عامة', 82.5),
('ST100004', 'نورا سعد الدوسري', 'Nora Saad Al-Dosari', 'nora.aldosari@university.edu', '1234567893', '+966501234570', 'الرياض، المملكة العربية السعودية', 'DEPT002', 1, 'female', 'سعودي', '2000-05-25', '2024-09-01', 'سعد الدوسري', '+966501234570', 'خريج ثانوية عامة', 90.0),
('ST100005', 'خالد عبدالرحمن المطيري', 'Khalid Abdulrahman Al-Mutairi', 'khalid.almutairi@university.edu', '1234567894', '+966501234571', 'الرياض، المملكة العربية السعودية', 'DEPT003', 1, 'male', 'سعودي', '1999-08-12', '2024-09-01', 'عبدالرحمن المطيري', '+966501234571', 'خريج ثانوية عامة', 87.5),
('ST100006', 'سارة محمد القحطاني', 'Sara Mohammed Al-Qahtani', 'sara.alqahtani@university.edu', '1234567895', '+966501234572', 'جدة، المملكة العربية السعودية', 'DEPT003', 1, 'female', 'سعودي', '2000-07-08', '2024-09-01', 'محمد القحطاني', '+966501234572', 'خريج ثانوية عامة', 89.0),
('ST100007', 'عبدالله أحمد الشمري', 'Abdullah Ahmed Al-Shammari', 'abdullah.alshammari@university.edu', '1234567896', '+966501234573', 'الرياض، المملكة العربية السعودية', 'DEPT004', 1, 'male', 'سعودي', '1999-11-30', '2024-09-01', 'أحمد الشمري', '+966501234573', 'خريج ثانوية عامة', 91.5),
('ST100008', 'مريم عبدالعزيز العتيبي', 'Mariam Abdulaziz Al-Otaibi', 'mariam.alotaibi@university.edu', '1234567897', '+966501234574', 'الدمام، المملكة العربية السعودية', 'DEPT004', 1, 'female', 'سعودي', '2000-04-18', '2024-09-01', 'عبدالعزيز العتيبي', '+966501234574', 'خريج ثانوية عامة', 86.0),
('ST100009', 'يوسف سعد الغامدي', 'Yousef Saad Al-Ghamdi', 'yousef.alghamdi@university.edu', '1234567898', '+966501234575', 'الرياض، المملكة العربية السعودية', 'DEPT005', 1, 'male', 'سعودي', '1999-09-22', '2024-09-01', 'سعد الغامدي', '+966501234575', 'خريج ثانوية عامة', 84.5),
('ST100010', 'هند محمد الزهراني', 'Hind Mohammed Al-Zahrani', 'hind.alzahrani@university.edu', '1234567899', '+966501234576', 'جدة، المملكة العربية السعودية', 'DEPT005', 1, 'female', 'سعودي', '2000-06-14', '2024-09-01', 'محمد الزهراني', '+966501234576', 'خريج ثانوية عامة', 88.5);

-- ==============================================
-- 3. VERIFY DATA
-- ==============================================

-- Check data counts
SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'students' as table_name, COUNT(*) as count FROM students;

-- Test the exact query the frontend will make
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
ORDER BY s.created_at DESC;

-- ==============================================
-- SAMPLE DATA INSERTION COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Clean sample data inserted successfully!';
    RAISE NOTICE '🏫 Departments: 5';
    RAISE NOTICE '👥 Students: 10';
    RAISE NOTICE '🎯 Ready for student management page!';
END $$;

