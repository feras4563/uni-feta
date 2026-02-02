-- Direct fix for timetable generation issue
-- This creates the exact data structure the frontend expects

-- First, let's clean up and start fresh
DELETE FROM teacher_subjects WHERE teacher_id IN ('teacher-001', 'teacher-002');
DELETE FROM subjects WHERE id IN ('subj-001', 'subj-002', 'subj-003');
DELETE FROM teachers WHERE id IN ('teacher-001', 'teacher-002');
DELETE FROM student_groups WHERE group_name = 'Group A';
DELETE FROM departments WHERE name = 'ادارة اعمال';
DELETE FROM semesters WHERE name = 'marsul';

-- Now create the data step by step with proper IDs

-- 1. Create department
INSERT INTO departments (id, name, name_en, is_active)
VALUES ('dept-business-admin', 'ادارة اعمال', 'Business Administration', true);

-- 2. Create study year if it doesn't exist
INSERT INTO study_years (id, name, name_en, is_current)
VALUES ('year-2024-2025', '2024-2025', '2024-2025', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create semester
INSERT INTO semesters (id, name, name_en, code, is_current, study_year_id)
VALUES ('sem-marsul', 'marsul', 'marsul', 'MARS001', true, 'year-2024-2025');

-- 4. Create teachers
INSERT INTO teachers (id, name, name_en, email, phone, is_active)
VALUES 
('teacher-ahmed', 'أحمد محمد', 'Ahmed Mohamed', 'ahmed@example.com', '123456789', true),
('teacher-fatima', 'فاطمة علي', 'Fatima Ali', 'fatima@example.com', '987654321', true);

-- 5. Create subjects (without total_cost since it's generated)
INSERT INTO subjects (id, name, name_en, code, credits, is_active)
VALUES 
('subj-management', 'مبادئ الإدارة', 'Principles of Management', 'MGMT101', 3, true),
('subj-accounting', 'المحاسبة المالية', 'Financial Accounting', 'ACCT101', 3, true),
('subj-marketing', 'التسويق', 'Marketing', 'MKTG101', 2, true);

-- 6. Create teacher-subject assignments
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id, 
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
VALUES 
-- Ahmed teaches Management
(gen_random_uuid()::text, 'teacher-ahmed', 'subj-management', 'dept-business-admin', 'sem-marsul', 'year-2024-2025', '2024-2025', 'fall', true, true, true, true),
-- Ahmed teaches Accounting  
(gen_random_uuid()::text, 'teacher-ahmed', 'subj-accounting', 'dept-business-admin', 'sem-marsul', 'year-2024-2025', '2024-2025', 'fall', true, true, true, true),
-- Fatima teaches Marketing
(gen_random_uuid()::text, 'teacher-fatima', 'subj-marketing', 'dept-business-admin', 'sem-marsul', 'year-2024-2025', '2024-2025', 'fall', true, true, true, true);

-- 7. Create student group
INSERT INTO student_groups (
    id, group_name, department_id, semester_id, max_students, current_students, is_active
)
VALUES ('group-a', 'Group A', 'dept-business-admin', 'sem-marsul', 30, 25, true);

-- 8. Verify everything was created
SELECT 'Verification' as check_type,
       (SELECT COUNT(*) FROM departments WHERE name = 'ادارة اعمال') as dept_count,
       (SELECT COUNT(*) FROM semesters WHERE name = 'marsul') as semester_count,
       (SELECT COUNT(*) FROM teachers WHERE name IN ('أحمد محمد', 'فاطمة علي')) as teacher_count,
       (SELECT COUNT(*) FROM subjects WHERE code IN ('MGMT101', 'ACCT101', 'MKTG101')) as subject_count,
       (SELECT COUNT(*) FROM teacher_subjects WHERE is_active = true) as assignment_count,
       (SELECT COUNT(*) FROM student_groups WHERE group_name = 'Group A') as group_count;

-- 9. Show the exact data the frontend should find
SELECT 
    'Frontend should find these assignments' as info,
    ts.id,
    ts.teacher_id,
    ts.subject_id,
    ts.department_id,
    ts.semester_id,
    ts.is_active,
    t.name as teacher_name,
    s.name as subject_name,
    d.name as department_name,
    sem.name as semester_name
FROM teacher_subjects ts
LEFT JOIN teachers t ON ts.teacher_id = t.id
LEFT JOIN subjects s ON ts.subject_id = s.id
LEFT JOIN departments d ON ts.department_id = d.id
LEFT JOIN semesters sem ON ts.semester_id = sem.id
WHERE ts.is_active = true
AND d.name = 'ادارة اعمال'
AND sem.name = 'marsul';
