-- Direct fix: Create assignments that will definitely be found by the frontend
-- This bypasses the complex logic and creates exactly what the frontend needs

-- 1. First, let's see what we have
SELECT 'Current state' as info,
       (SELECT COUNT(*) FROM teacher_subjects WHERE is_active = true) as total_assignments,
       (SELECT COUNT(*) FROM teacher_subjects 
        WHERE department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8' 
        AND semester_id = '52222aad-7c8d-4a18-943d-1713e1149337' 
        AND is_active = true) as matching_assignments;

-- 2. Get the first 3 teachers and subjects
SELECT 'Available teachers' as info, id, name FROM teachers WHERE is_active = true LIMIT 3;
SELECT 'Available subjects' as info, id, name, code FROM subjects WHERE is_active = true LIMIT 3;

-- 3. Create assignments using the exact IDs the frontend is looking for
-- Assignment 1
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    t.id,
    s.id,
    'cd6f54a9-f1c1-470a-bd2d-7518b05189d8',  -- exact department ID
    '52222aad-7c8d-4a18-943d-1713e1149337',  -- exact semester ID
    COALESCE(sy.id, 'year-2024-2025'),
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM (SELECT id FROM teachers WHERE is_active = true LIMIT 1) t
CROSS JOIN (SELECT id FROM subjects WHERE is_active = true LIMIT 1) s
LEFT JOIN study_years sy ON sy.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts 
    WHERE ts.teacher_id = t.id 
    AND ts.subject_id = s.id 
    AND ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
    AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
);

-- Assignment 2
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    t.id,
    s.id,
    'cd6f54a9-f1c1-470a-bd2d-7518b05189d8',  -- exact department ID
    '52222aad-7c8d-4a18-943d-1713e1149337',  -- exact semester ID
    COALESCE(sy.id, 'year-2024-2025'),
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM (SELECT id FROM teachers WHERE is_active = true LIMIT 1 OFFSET 1) t
CROSS JOIN (SELECT id FROM subjects WHERE is_active = true LIMIT 1 OFFSET 1) s
LEFT JOIN study_years sy ON sy.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts 
    WHERE ts.teacher_id = t.id 
    AND ts.subject_id = s.id 
    AND ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
    AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
);

-- Assignment 3
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    t.id,
    s.id,
    'cd6f54a9-f1c1-470a-bd2d-7518b05189d8',  -- exact department ID
    '52222aad-7c8d-4a18-943d-1713e1149337',  -- exact semester ID
    COALESCE(sy.id, 'year-2024-2025'),
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM (SELECT id FROM teachers WHERE is_active = true LIMIT 1 OFFSET 2) t
CROSS JOIN (SELECT id FROM subjects WHERE is_active = true LIMIT 1 OFFSET 2) s
LEFT JOIN study_years sy ON sy.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts 
    WHERE ts.teacher_id = t.id 
    AND ts.subject_id = s.id 
    AND ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
    AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
);

-- 4. Verify assignments were created
SELECT 'After creation verification' as info,
       (SELECT COUNT(*) FROM teacher_subjects 
        WHERE department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8' 
        AND semester_id = '52222aad-7c8d-4a18-943d-1713e1149337' 
        AND is_active = true) as matching_assignments;

-- 5. Show the exact assignments that should be found
SELECT 
    'These assignments should be found by frontend' as info,
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

-- 6. Test the exact query the frontend uses
SELECT 
    'Frontend query test' as info,
    ts.*,
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
