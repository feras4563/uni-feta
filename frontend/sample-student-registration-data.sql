-- ==============================================
-- SAMPLE DATA FOR STUDENT REGISTRATION SYSTEM
-- ==============================================
-- This script populates the clean database with sample data
-- for testing the student registration functionality

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
-- 2. INSERT STUDY YEARS
-- ==============================================

INSERT INTO study_years (id, name, name_en, start_date, end_date) VALUES
('YEAR001', '2024-2025', '2024-2025', '2024-09-01', '2025-08-31'),
('YEAR002', '2023-2024', '2023-2024', '2023-09-01', '2024-08-31'),
('YEAR003', '2025-2026', '2025-2026', '2025-09-01', '2026-08-31');

-- ==============================================
-- 3. INSERT SEMESTERS
-- ==============================================

INSERT INTO semesters (id, name, name_en, study_year_id, start_date, end_date, registration_start_date, registration_end_date) VALUES
('SEM001', 'fall-2024', 'Fall 2024', 'YEAR001', '2024-09-15', '2024-12-15', '2024-08-01', '2024-09-10'),
('SEM002', 'spring-2025', 'Spring 2025', 'YEAR001', '2025-01-15', '2025-04-15', '2024-12-01', '2025-01-10'),
('SEM003', 'summer-2025', 'Summer 2025', 'YEAR001', '2025-05-15', '2025-08-15', '2025-04-01', '2025-05-10'),
('SEM004', 'fall-2023', 'Fall 2023', 'YEAR002', '2023-09-15', '2023-12-15', '2023-08-01', '2023-09-10'),
('SEM005', 'spring-2024', 'Spring 2024', 'YEAR002', '2024-01-15', '2024-04-15', '2023-12-01', '2024-01-10');

-- ==============================================
-- 4. INSERT SUBJECTS
-- ==============================================

-- Computer Science Subjects
INSERT INTO subjects (id, code, name, name_en, credits, cost_per_credit, department_id, is_required) VALUES
('SUB001', 'CS101', 'مقدمة في البرمجة', 'Introduction to Programming', 3, 50.00, 'DEPT001', true),
('SUB002', 'CS102', 'هياكل البيانات', 'Data Structures', 3, 50.00, 'DEPT001', true),
('SUB003', 'CS103', 'قواعد البيانات', 'Database Systems', 3, 50.00, 'DEPT001', true),
('SUB004', 'CS104', 'الذكاء الاصطناعي', 'Artificial Intelligence', 3, 50.00, 'DEPT001', false),
('SUB005', 'CS105', 'أمن المعلومات', 'Information Security', 3, 50.00, 'DEPT001', false);

-- Engineering Subjects
INSERT INTO subjects (id, code, name, name_en, credits, cost_per_credit, department_id, is_required) VALUES
('SUB006', 'ENG101', 'الرياضيات الهندسية', 'Engineering Mathematics', 4, 45.00, 'DEPT002', true),
('SUB007', 'ENG102', 'الفيزياء الهندسية', 'Engineering Physics', 3, 45.00, 'DEPT002', true),
('SUB008', 'ENG103', 'الرسم الهندسي', 'Engineering Drawing', 2, 45.00, 'DEPT002', true),
('SUB009', 'ENG104', 'الميكانيكا', 'Mechanics', 3, 45.00, 'DEPT002', false),
('SUB010', 'ENG105', 'المواد الهندسية', 'Engineering Materials', 3, 45.00, 'DEPT002', false);

-- Business Administration Subjects
INSERT INTO subjects (id, code, name, name_en, credits, cost_per_credit, department_id, is_required) VALUES
('SUB011', 'BUS101', 'مبادئ الإدارة', 'Principles of Management', 3, 40.00, 'DEPT003', true),
('SUB012', 'BUS102', 'المحاسبة المالية', 'Financial Accounting', 3, 40.00, 'DEPT003', true),
('SUB013', 'BUS103', 'التسويق', 'Marketing', 3, 40.00, 'DEPT003', true),
('SUB014', 'BUS104', 'الاقتصاد الجزئي', 'Microeconomics', 3, 40.00, 'DEPT003', false),
('SUB015', 'BUS105', 'الاقتصاد الكلي', 'Macroeconomics', 3, 40.00, 'DEPT003', false);

-- Medicine Subjects
INSERT INTO subjects (id, code, name, name_en, credits, cost_per_credit, department_id, is_required) VALUES
('SUB016', 'MED101', 'التشريح', 'Anatomy', 4, 60.00, 'DEPT004', true),
('SUB017', 'MED102', 'الفيزيولوجيا', 'Physiology', 4, 60.00, 'DEPT004', true),
('SUB018', 'MED103', 'الكيمياء الحيوية', 'Biochemistry', 3, 60.00, 'DEPT004', true),
('SUB019', 'MED104', 'علم الأمراض', 'Pathology', 3, 60.00, 'DEPT004', false),
('SUB020', 'MED105', 'علم الأدوية', 'Pharmacology', 3, 60.00, 'DEPT004', false);

-- Education Subjects
INSERT INTO subjects (id, code, name, name_en, credits, cost_per_credit, department_id, is_required) VALUES
('SUB021', 'EDU101', 'علم النفس التربوي', 'Educational Psychology', 3, 35.00, 'DEPT005', true),
('SUB022', 'EDU102', 'طرق التدريس', 'Teaching Methods', 3, 35.00, 'DEPT005', true),
('SUB023', 'EDU103', 'تكنولوجيا التعليم', 'Educational Technology', 3, 35.00, 'DEPT005', true),
('SUB024', 'EDU104', 'الإدارة التربوية', 'Educational Administration', 3, 35.00, 'DEPT005', false),
('SUB025', 'EDU105', 'المناهج الدراسية', 'Curriculum Development', 3, 35.00, 'DEPT005', false);

-- ==============================================
-- 5. INSERT STUDENTS
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
-- 6. INSERT STUDENT SEMESTER REGISTRATIONS
-- ==============================================

INSERT INTO student_semester_registrations (id, student_id, semester_id, department_id, semester_number, registration_date, status, tuition_paid) VALUES
('REG001', 'ST100001', 'SEM001', 'DEPT001', 1, '2024-08-15', 'active', false),
('REG002', 'ST100002', 'SEM001', 'DEPT001', 1, '2024-08-16', 'active', false),
('REG003', 'ST100003', 'SEM001', 'DEPT002', 1, '2024-08-17', 'active', false),
('REG004', 'ST100004', 'SEM001', 'DEPT002', 1, '2024-08-18', 'active', false),
('REG005', 'ST100005', 'SEM001', 'DEPT003', 1, '2024-08-19', 'active', false),
('REG006', 'ST100006', 'SEM001', 'DEPT003', 1, '2024-08-20', 'active', false),
('REG007', 'ST100007', 'SEM001', 'DEPT004', 1, '2024-08-21', 'active', false),
('REG008', 'ST100008', 'SEM001', 'DEPT004', 1, '2024-08-22', 'active', false),
('REG009', 'ST100009', 'SEM001', 'DEPT005', 1, '2024-08-23', 'active', false),
('REG010', 'ST100010', 'SEM001', 'DEPT005', 1, '2024-08-24', 'active', false);

-- ==============================================
-- 7. INSERT STUDENT SUBJECT ENROLLMENTS
-- ==============================================

-- Computer Science Students Enrollments
INSERT INTO student_subject_enrollments (id, student_id, subject_id, semester_id, department_id, enrollment_date, status, subject_cost, paid_amount, payment_status) VALUES
-- Student ST100001 (Ahmed) - CS101, CS102
('ENR001', 'ST100001', 'SUB001', 'SEM001', 'DEPT001', '2024-08-15', 'enrolled', 150.00, 0.00, 'unpaid'),
('ENR002', 'ST100001', 'SUB002', 'SEM001', 'DEPT001', '2024-08-15', 'enrolled', 150.00, 0.00, 'unpaid'),

-- Student ST100002 (Fatima) - CS101, CS103
('ENR003', 'ST100002', 'SUB001', 'SEM001', 'DEPT001', '2024-08-16', 'enrolled', 150.00, 0.00, 'unpaid'),
('ENR004', 'ST100002', 'SUB003', 'SEM001', 'DEPT001', '2024-08-16', 'enrolled', 150.00, 0.00, 'unpaid'),

-- Student ST100003 (Mohammed) - ENG101, ENG102
('ENR005', 'ST100003', 'SUB006', 'SEM001', 'DEPT002', '2024-08-17', 'enrolled', 180.00, 0.00, 'unpaid'),
('ENR006', 'ST100003', 'SUB007', 'SEM001', 'DEPT002', '2024-08-17', 'enrolled', 135.00, 0.00, 'unpaid'),

-- Student ST100004 (Nora) - ENG101, ENG103
('ENR007', 'ST100004', 'SUB006', 'SEM001', 'DEPT002', '2024-08-18', 'enrolled', 180.00, 0.00, 'unpaid'),
('ENR008', 'ST100004', 'SUB008', 'SEM001', 'DEPT002', '2024-08-18', 'enrolled', 90.00, 0.00, 'unpaid'),

-- Student ST100005 (Khalid) - BUS101, BUS102
('ENR009', 'ST100005', 'SUB011', 'SEM001', 'DEPT003', '2024-08-19', 'enrolled', 120.00, 0.00, 'unpaid'),
('ENR010', 'ST100005', 'SUB012', 'SEM001', 'DEPT003', '2024-08-19', 'enrolled', 120.00, 0.00, 'unpaid'),

-- Student ST100006 (Sara) - BUS101, BUS103
('ENR011', 'ST100006', 'SUB011', 'SEM001', 'DEPT003', '2024-08-20', 'enrolled', 120.00, 0.00, 'unpaid'),
('ENR012', 'ST100006', 'SUB013', 'SEM001', 'DEPT003', '2024-08-20', 'enrolled', 120.00, 0.00, 'unpaid'),

-- Student ST100007 (Abdullah) - MED101, MED102
('ENR013', 'ST100007', 'SUB016', 'SEM001', 'DEPT004', '2024-08-21', 'enrolled', 240.00, 0.00, 'unpaid'),
('ENR014', 'ST100007', 'SUB017', 'SEM001', 'DEPT004', '2024-08-21', 'enrolled', 240.00, 0.00, 'unpaid'),

-- Student ST100008 (Mariam) - MED101, MED103
('ENR015', 'ST100008', 'SUB016', 'SEM001', 'DEPT004', '2024-08-22', 'enrolled', 240.00, 0.00, 'unpaid'),
('ENR016', 'ST100008', 'SUB018', 'SEM001', 'DEPT004', '2024-08-22', 'enrolled', 180.00, 0.00, 'unpaid'),

-- Student ST100009 (Yousef) - EDU101, EDU102
('ENR017', 'ST100009', 'SUB021', 'SEM001', 'DEPT005', '2024-08-23', 'enrolled', 105.00, 0.00, 'unpaid'),
('ENR018', 'ST100009', 'SUB022', 'SEM001', 'DEPT005', '2024-08-23', 'enrolled', 105.00, 0.00, 'unpaid'),

-- Student ST100010 (Hind) - EDU101, EDU103
('ENR019', 'ST100010', 'SUB021', 'SEM001', 'DEPT005', '2024-08-24', 'enrolled', 105.00, 0.00, 'unpaid'),
('ENR020', 'ST100010', 'SUB023', 'SEM001', 'DEPT005', '2024-08-24', 'enrolled', 105.00, 0.00, 'unpaid');

-- ==============================================
-- 8. INSERT STUDENT INVOICES
-- ==============================================

INSERT INTO student_invoices (id, invoice_number, student_id, semester_id, department_id, total_amount, paid_amount, status, due_date, issued_date) VALUES
('INV001', 'INV-100001', 'ST100001', 'SEM001', 'DEPT001', 300.00, 0.00, 'pending', '2024-09-15', '2024-08-15'),
('INV002', 'INV-100002', 'ST100002', 'SEM001', 'DEPT001', 300.00, 0.00, 'pending', '2024-09-15', '2024-08-16'),
('INV003', 'INV-100003', 'ST100003', 'SEM001', 'DEPT002', 315.00, 0.00, 'pending', '2024-09-15', '2024-08-17'),
('INV004', 'INV-100004', 'ST100004', 'SEM001', 'DEPT002', 270.00, 0.00, 'pending', '2024-09-15', '2024-08-18'),
('INV005', 'INV-100005', 'ST100005', 'SEM001', 'DEPT003', 240.00, 0.00, 'pending', '2024-09-15', '2024-08-19'),
('INV006', 'INV-100006', 'ST100006', 'SEM001', 'DEPT003', 240.00, 0.00, 'pending', '2024-09-15', '2024-08-20'),
('INV007', 'INV-100007', 'ST100007', 'SEM001', 'DEPT004', 480.00, 0.00, 'pending', '2024-09-15', '2024-08-21'),
('INV008', 'INV-100008', 'ST100008', 'SEM001', 'DEPT004', 420.00, 0.00, 'pending', '2024-09-15', '2024-08-22'),
('INV009', 'INV-100009', 'ST100009', 'SEM001', 'DEPT005', 210.00, 0.00, 'pending', '2024-09-15', '2024-08-23'),
('INV010', 'INV-100010', 'ST100010', 'SEM001', 'DEPT005', 210.00, 0.00, 'pending', '2024-09-15', '2024-08-24');

-- ==============================================
-- SAMPLE DATA INSERTION COMPLETE
-- ==============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Sample data inserted successfully!';
    RAISE NOTICE '🏫 Departments: 5';
    RAISE NOTICE '📅 Study Years: 3';
    RAISE NOTICE '📚 Semesters: 5';
    RAISE NOTICE '📖 Subjects: 25 (5 per department)';
    RAISE NOTICE '👥 Students: 10 (2 per department)';
    RAISE NOTICE '📝 Registrations: 10';
    RAISE NOTICE '🎓 Enrollments: 20';
    RAISE NOTICE '💰 Invoices: 10';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready for testing student registration functionality!';
END $$;
