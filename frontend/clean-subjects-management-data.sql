-- ==============================================
-- CLEAN SAMPLE DATA FOR SUBJECTS MANAGEMENT
-- ==============================================

-- ==============================================
-- 1. INSERT SUBJECTS
-- ==============================================

INSERT INTO subjects (id, name, name_en, code, description, credits, department_id, cost_per_credit, is_required, semester_number, semester, prerequisites, teacher_id, max_students) VALUES
-- Computer Science Subjects
('SUB001', 'مقدمة في البرمجة', 'Introduction to Programming', 'CS101', 'مقدمة في أساسيات البرمجة والخوارزميات', 3, 'DEPT001', 150.00, true, 1, '1', NULL, NULL, 30),
('SUB002', 'هياكل البيانات', 'Data Structures', 'CS201', 'دراسة هياكل البيانات والخوارزميات المتقدمة', 3, 'DEPT001', 200.00, true, 2, '2', ARRAY['CS101'], NULL, 25),
('SUB003', 'قواعد البيانات', 'Database Systems', 'CS301', 'تصميم وإدارة قواعد البيانات', 3, 'DEPT001', 250.00, true, 3, '3', ARRAY['CS201'], NULL, 20),
('SUB004', 'الذكاء الاصطناعي', 'Artificial Intelligence', 'CS401', 'مقدمة في الذكاء الاصطناعي والتعلم الآلي', 3, 'DEPT001', 300.00, false, 4, '4', ARRAY['CS201'], NULL, 15),
('SUB005', 'أمن المعلومات', 'Information Security', 'CS402', 'مبادئ أمن المعلومات والحماية', 3, 'DEPT001', 280.00, false, 4, '4', ARRAY['CS301'], NULL, 18),

-- Engineering Subjects
('SUB006', 'الرياضيات الهندسية', 'Engineering Mathematics', 'ENG101', 'الرياضيات التطبيقية في الهندسة', 4, 'DEPT002', 180.00, true, 1, '1', NULL, NULL, 35),
('SUB007', 'الفيزياء الهندسية', 'Engineering Physics', 'ENG102', 'مبادئ الفيزياء التطبيقية', 3, 'DEPT002', 160.00, true, 1, '1', NULL, NULL, 30),
('SUB008', 'الميكانيكا الهندسية', 'Engineering Mechanics', 'ENG201', 'دراسة القوى والحركة في الأنظمة الهندسية', 3, 'DEPT002', 220.00, true, 2, '2', ARRAY['ENG101', 'ENG102'], NULL, 25),
('SUB009', 'تصميم الآلات', 'Machine Design', 'ENG301', 'تصميم وتحليل الآلات والمعدات', 3, 'DEPT002', 280.00, true, 3, '3', ARRAY['ENG201'], NULL, 20),
('SUB010', 'التحكم الآلي', 'Automatic Control', 'ENG401', 'نظم التحكم الآلي والروبوتات', 3, 'DEPT002', 320.00, false, 4, '4', ARRAY['ENG301'], NULL, 15),

-- Business Administration Subjects
('SUB011', 'مبادئ الإدارة', 'Principles of Management', 'BUS101', 'أساسيات الإدارة والقيادة', 3, 'DEPT003', 120.00, true, 1, '1', NULL, NULL, 40),
('SUB012', 'المحاسبة المالية', 'Financial Accounting', 'BUS102', 'مبادئ المحاسبة المالية', 3, 'DEPT003', 140.00, true, 1, '1', NULL, NULL, 35),
('SUB013', 'التسويق', 'Marketing', 'BUS201', 'استراتيجيات التسويق وإدارة المبيعات', 3, 'DEPT003', 160.00, true, 2, '2', ARRAY['BUS101'], NULL, 30),
('SUB014', 'إدارة الموارد البشرية', 'Human Resource Management', 'BUS202', 'إدارة وتطوير الموارد البشرية', 3, 'DEPT003', 150.00, true, 2, '2', ARRAY['BUS101'], NULL, 25),
('SUB015', 'الاقتصاد الإداري', 'Managerial Economics', 'BUS301', 'تطبيق النظريات الاقتصادية في الإدارة', 3, 'DEPT003', 180.00, false, 3, '3', ARRAY['BUS102'], NULL, 20),

-- Medicine Subjects
('SUB016', 'التشريح', 'Anatomy', 'MED101', 'دراسة تشريح جسم الإنسان', 4, 'DEPT004', 400.00, true, 1, '1', NULL, NULL, 20),
('SUB017', 'الفيزيولوجيا', 'Physiology', 'MED102', 'وظائف أعضاء جسم الإنسان', 4, 'DEPT004', 420.00, true, 1, '1', NULL, NULL, 18),
('SUB018', 'الكيمياء الحيوية', 'Biochemistry', 'MED201', 'الكيمياء الحيوية والتمثيل الغذائي', 3, 'DEPT004', 380.00, true, 2, '2', ARRAY['MED101', 'MED102'], NULL, 15),
('SUB019', 'علم الأمراض', 'Pathology', 'MED301', 'دراسة الأمراض وآليات حدوثها', 3, 'DEPT004', 450.00, true, 3, '3', ARRAY['MED201'], NULL, 12),
('SUB020', 'الصيدلة السريرية', 'Clinical Pharmacy', 'MED401', 'تطبيق الصيدلة في الممارسة السريرية', 3, 'DEPT004', 500.00, false, 4, '4', ARRAY['MED301'], NULL, 10),

-- Education Subjects
('SUB021', 'علم النفس التربوي', 'Educational Psychology', 'EDU101', 'نظريات التعلم وعلم النفس التربوي', 3, 'DEPT005', 130.00, true, 1, '1', NULL, NULL, 35),
('SUB022', 'طرق التدريس', 'Teaching Methods', 'EDU102', 'استراتيجيات وطرق التدريس الحديثة', 3, 'DEPT005', 140.00, true, 1, '1', NULL, NULL, 30),
('SUB023', 'تكنولوجيا التعليم', 'Educational Technology', 'EDU201', 'استخدام التكنولوجيا في التعليم', 3, 'DEPT005', 160.00, true, 2, '2', ARRAY['EDU101', 'EDU102'], NULL, 25),
('SUB024', 'تقييم الطلاب', 'Student Assessment', 'EDU202', 'طرق تقييم وتقويم الطلاب', 3, 'DEPT005', 150.00, true, 2, '2', ARRAY['EDU101'], NULL, 28),
('SUB025', 'الإدارة المدرسية', 'School Administration', 'EDU301', 'إدارة المؤسسات التعليمية', 3, 'DEPT005', 170.00, false, 3, '3', ARRAY['EDU202'], NULL, 22);

-- ==============================================
-- 2. VERIFY DATA
-- ==============================================

-- Check data counts
SELECT 'subjects' as table_name, COUNT(*) as count FROM subjects;

-- Test the exact query the frontend will make
SELECT 
    s.id,
    s.name,
    s.name_en,
    s.code,
    s.description,
    s.credits,
    s.department_id,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number,
    s.prerequisites,
    s.is_active,
    s.created_at,
    s.updated_at,
    d.name as department_name,
    d.name_en as department_name_en,
    d.head as department_head
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY s.semester_number, s.name;

-- Test the view
SELECT * FROM subjects_with_departments ORDER BY semester_number, name;

-- ==============================================
-- SAMPLE DATA INSERTION COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Clean sample data inserted successfully!';
    RAISE NOTICE '📚 Subjects: 25';
    RAISE NOTICE '🏫 Computer Science: 5 subjects';
    RAISE NOTICE '🔧 Engineering: 5 subjects';
    RAISE NOTICE '💼 Business: 5 subjects';
    RAISE NOTICE '🏥 Medicine: 5 subjects';
    RAISE NOTICE '🎓 Education: 5 subjects';
    RAISE NOTICE '🎯 Ready for subjects management page!';
END $$;
