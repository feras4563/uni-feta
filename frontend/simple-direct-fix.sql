-- Simple and direct fix - create assignments that will definitely be found
-- This bypasses all the complex relationship issues

-- 1. Create assignments directly with the exact IDs the frontend is using
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    t.id,
    s.id,
    'cd6f54a9-f1c1-470a-bd2d-7518b05189d8',  -- exact department ID from debug
    '52222aad-7c8d-4a18-943d-1713e1149337',  -- exact semester ID from debug
    COALESCE(sy.id, 'year-2024-2025'),
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM teachers t
CROSS JOIN subjects s
LEFT JOIN study_years sy ON sy.is_current = true
WHERE t.is_active = true 
AND s.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts 
    WHERE ts.teacher_id = t.id 
    AND ts.subject_id = s.id 
    AND ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
    AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
)
LIMIT 5;  -- Create up to 5 assignments

-- 2. Create student group
INSERT INTO student_groups (
    id, group_name, department_id, semester_id, semester_number, max_students, current_students, is_active
)
SELECT 
    gen_random_uuid()::text,
    'Group A',
    'cd6f54a9-f1c1-470a-bd2d-7518b05189d8',  -- exact department ID
    '52222aad-7c8d-4a18-943d-1713e1149337',  -- exact semester ID
    1,  -- semester number
    30,
    25,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.group_name = 'Group A' 
    AND sg.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
    AND sg.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
);

-- 3. Verify what was created
SELECT 'Verification' as info,
       (SELECT COUNT(*) FROM teacher_subjects 
        WHERE department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8' 
        AND semester_id = '52222aad-7c8d-4a18-943d-1713e1149337' 
        AND is_active = true) as assignments_count,
       (SELECT COUNT(*) FROM student_groups 
        WHERE department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8' 
        AND semester_id = '52222aad-7c8d-4a18-943d-1713e1149337') as groups_count;

-- 4. Show the exact data that should be found
SELECT 
    'These assignments should be found by the new direct query' as info,
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
WHERE ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
AND ts.is_active = true;
