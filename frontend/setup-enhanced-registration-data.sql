-- ==============================================
-- SETUP SAMPLE DATA FOR ENHANCED STUDENT REGISTRATION
-- Run this after the enhanced-student-registration-migration.sql
-- ==============================================

-- ==============================================
-- 1. UPDATE SUBJECT COSTS
-- ==============================================

-- Update existing subjects with sample costs
UPDATE subjects 
SET 
  cost_per_credit = CASE 
    WHEN department_id = 'DEPT_MANAGEMENT' THEN 150.00
    WHEN department_id = 'DEPT_COMPUTER' THEN 200.00
    WHEN department_id = 'DEPT_ENGINEERING' THEN 180.00
    ELSE 120.00
  END,
  total_cost = COALESCE(credits, 0) * CASE 
    WHEN department_id = 'DEPT_MANAGEMENT' THEN 150.00
    WHEN department_id = 'DEPT_COMPUTER' THEN 200.00
    WHEN department_id = 'DEPT_ENGINEERING' THEN 180.00
    ELSE 120.00
  END,
  is_required = true,
  semester_number = CASE 
    WHEN name LIKE '%أساس%' OR name LIKE '%مقدمة%' THEN 1
    WHEN name LIKE '%متقدم%' OR name LIKE '%تطبيق%' THEN 2
    ELSE 1
  END
WHERE cost_per_credit = 0 OR cost_per_credit IS NULL;

-- ==============================================
-- 2. CREATE DEPARTMENT CURRICULUM
-- ==============================================

-- Get the first semester ID
DO $$
DECLARE
    first_semester_id TEXT;
    dept_id TEXT;
BEGIN
    -- Get first semester
    SELECT id INTO first_semester_id FROM semesters LIMIT 1;
    
    -- Create curriculum for each department
    FOR dept_id IN SELECT id FROM departments LOOP
        -- Insert curriculum for existing subjects in this department
        INSERT INTO department_curriculum (department_id, semester_id, subject_id, semester_number, is_required)
        SELECT 
            dept_id,
            first_semester_id,
            s.id,
            COALESCE(s.semester_number, 1),
            COALESCE(s.is_required, true)
        FROM subjects s
        WHERE s.department_id = dept_id
        ON CONFLICT (department_id, semester_id, subject_id) DO NOTHING;
    END LOOP;
END $$;

-- ==============================================
-- 3. CREATE SAMPLE STUDENT ENROLLMENTS (Optional)
-- ==============================================

-- Uncomment this section if you want to create sample enrollments
/*
DO $$
DECLARE
    student_record RECORD;
    semester_record RECORD;
    curriculum_record RECORD;
    total_cost DECIMAL(10,2);
BEGIN
    -- Get first semester
    SELECT * INTO semester_record FROM semesters LIMIT 1;
    
    -- For each student, create enrollments
    FOR student_record IN 
        SELECT id, department_id FROM students 
        WHERE status = 'active' 
        LIMIT 5  -- Limit to first 5 students
    LOOP
        -- Calculate total cost for this student's department curriculum
        SELECT SUM(s.total_cost) INTO total_cost
        FROM department_curriculum dc
        JOIN subjects s ON dc.subject_id = s.id
        WHERE dc.department_id = student_record.department_id
        AND dc.semester_id = semester_record.id;
        
        -- Create enrollments for required subjects
        INSERT INTO student_subject_enrollments (
            student_id, subject_id, semester_id, department_id, 
            subject_cost, status, payment_status
        )
        SELECT 
            student_record.id,
            dc.subject_id,
            semester_record.id,
            student_record.department_id,
            s.total_cost,
            'enrolled',
            'unpaid'
        FROM department_curriculum dc
        JOIN subjects s ON dc.subject_id = s.id
        WHERE dc.department_id = student_record.department_id
        AND dc.semester_id = semester_record.id
        AND dc.is_required = true
        ON CONFLICT (student_id, subject_id, semester_id) DO NOTHING;
        
        -- Generate invoice
        INSERT INTO student_invoices (
            student_id, semester_id, department_id, 
            total_amount, status
        )
        VALUES (
            student_record.id,
            semester_record.id,
            student_record.department_id,
            COALESCE(total_cost, 0),
            'pending'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
*/

-- ==============================================
-- 4. VERIFICATION QUERIES
-- ==============================================

-- Check subjects with costs
SELECT 'Subjects with Costs:' as info;
SELECT 
  s.code,
  s.name,
  s.credits,
  s.cost_per_credit,
  s.total_cost,
  s.semester_number,
  s.is_required,
  d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY d.name, s.semester_number, s.name;

-- Check curriculum
SELECT 'Department Curriculum:' as info;
SELECT 
  d.name as department_name,
  sem.name as semester_name,
  COUNT(dc.subject_id) as subject_count,
  SUM(s.total_cost) as total_cost
FROM department_curriculum dc
JOIN departments d ON dc.department_id = d.id
JOIN semesters sem ON dc.semester_id = sem.id
JOIN subjects s ON dc.subject_id = s.id
GROUP BY d.name, sem.name
ORDER BY d.name, sem.name;

-- Check enrollments (if created)
SELECT 'Student Enrollments:' as info;
SELECT COUNT(*) as enrollment_count FROM student_subject_enrollments;

-- Check invoices (if created)
SELECT 'Student Invoices:' as info;
SELECT COUNT(*) as invoice_count FROM student_invoices;

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ENHANCED REGISTRATION DATA SETUP COMPLETE!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Setup includes:';
    RAISE NOTICE '✅ Subject costs and pricing';
    RAISE NOTICE '✅ Department curriculum mapping';
    RAISE NOTICE '✅ Semester-based subject organization';
    RAISE NOTICE '✅ Required/optional subject classification';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test the Enhanced Student Registration page';
    RAISE NOTICE '2. Register students in subjects';
    RAISE NOTICE '3. Check invoice generation';
    RAISE NOTICE '4. Verify payment tracking';
    RAISE NOTICE '==============================================';
END $$;







