-- Complete fix for timetable generation issue
-- This script will create sample data if none exists and fix the relationships

-- Step 1: Check current state
SELECT 'Current state check' as step, 
       (SELECT COUNT(*) FROM teacher_subjects WHERE is_active = true) as teacher_assignments,
       (SELECT COUNT(*) FROM departments) as departments,
       (SELECT COUNT(*) FROM semesters) as semesters,
       (SELECT COUNT(*) FROM teachers) as teachers,
       (SELECT COUNT(*) FROM subjects) as subjects,
       (SELECT COUNT(*) FROM student_groups) as student_groups;

-- Step 2: Ensure we have basic data
-- If no departments exist, create a sample one
INSERT INTO departments (id, name, name_en, is_active)
SELECT 'dept-001', 'ادارة اعمال', 'Business Administration', true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'ادارة اعمال');

-- If no semesters exist, create sample ones
INSERT INTO semesters (id, name, name_en, code, is_current, study_year_id)
SELECT 'sem-001', 'marsul', 'marsul', 'M001', true, sy.id
FROM study_years sy
WHERE sy.is_current = true
AND NOT EXISTS (SELECT 1 FROM semesters WHERE name = 'marsul');

-- If no study_years exist, create one
INSERT INTO study_years (id, name, name_en, is_current)
SELECT 'year-001', '2024-2025', '2024-2025', true
WHERE NOT EXISTS (SELECT 1 FROM study_years WHERE name = '2024-2025');

-- Step 3: Create sample teachers if none exist
INSERT INTO teachers (id, name, name_en, email, phone, is_active)
SELECT 'teacher-001', 'أحمد محمد', 'Ahmed Mohamed', 'ahmed@example.com', '123456789', true
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE name = 'أحمد محمد');

INSERT INTO teachers (id, name, name_en, email, phone, is_active)
SELECT 'teacher-002', 'فاطمة علي', 'Fatima Ali', 'fatima@example.com', '987654321', true
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE name = 'فاطمة علي');

-- Step 4: Create sample subjects if none exist
INSERT INTO subjects (id, name, name_en, code, credits, is_active)
SELECT 'subj-001', 'مبادئ الإدارة', 'Principles of Management', 'MGMT101', 3, true
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'MGMT101');

INSERT INTO subjects (id, name, name_en, code, credits, is_active)
SELECT 'subj-002', 'المحاسبة المالية', 'Financial Accounting', 'ACCT101', 3, true
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'ACCT101');

INSERT INTO subjects (id, name, name_en, code, credits, is_active)
SELECT 'subj-003', 'التسويق', 'Marketing', 'MKTG101', 2, true
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'MKTG101');

-- Step 5: Create teacher-subject assignments
-- Get the IDs we just created
WITH dept_id AS (SELECT id FROM departments WHERE name = 'ادارة اعمال' LIMIT 1),
     sem_id AS (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1),
     year_id AS (SELECT id FROM study_years WHERE name = '2024-2025' LIMIT 1)
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id, 
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    'teacher-001',
    'subj-001',
    dept_id.id,
    sem_id.id,
    year_id.id,
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM dept_id, sem_id, year_id
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects 
    WHERE teacher_id = 'teacher-001' AND subject_id = 'subj-001'
);

-- Create more assignments
WITH dept_id AS (SELECT id FROM departments WHERE name = 'ادارة اعمال' LIMIT 1),
     sem_id AS (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1),
     year_id AS (SELECT id FROM study_years WHERE name = '2024-2025' LIMIT 1)
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id, 
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    'teacher-001',
    'subj-002',
    dept_id.id,
    sem_id.id,
    year_id.id,
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM dept_id, sem_id, year_id
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects 
    WHERE teacher_id = 'teacher-001' AND subject_id = 'subj-002'
);

WITH dept_id AS (SELECT id FROM departments WHERE name = 'ادارة اعمال' LIMIT 1),
     sem_id AS (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1),
     year_id AS (SELECT id FROM study_years WHERE name = '2024-2025' LIMIT 1)
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id, 
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    'teacher-002',
    'subj-003',
    dept_id.id,
    sem_id.id,
    year_id.id,
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM dept_id, sem_id, year_id
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects 
    WHERE teacher_id = 'teacher-002' AND subject_id = 'subj-003'
);

-- Step 6: Create sample student groups
WITH dept_id AS (SELECT id FROM departments WHERE name = 'ادارة اعمال' LIMIT 1),
     sem_id AS (SELECT id FROM semesters WHERE name = 'marsul' LIMIT 1)
INSERT INTO student_groups (
    id, group_name, department_id, semester_id, max_students, current_students, is_active
)
SELECT 
    'group-001',
    'Group A',
    dept_id.id,
    sem_id.id,
    30,
    25,
    true
FROM dept_id, sem_id
WHERE NOT EXISTS (
    SELECT 1 FROM student_groups 
    WHERE group_name = 'Group A' AND department_id = dept_id.id
);

-- Step 7: Verify the fix
SELECT 'After fix verification' as step,
       (SELECT COUNT(*) FROM teacher_subjects WHERE is_active = true) as teacher_assignments,
       (SELECT COUNT(*) FROM student_groups) as student_groups;

-- Step 8: Show the created assignments
SELECT 
    'Created assignments' as info,
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
ORDER BY ts.created_at DESC;
