-- Simple fix: Update existing assignments to have the correct semester_id
-- This avoids the duplicate key error by updating instead of inserting

-- 1. Check what assignments exist
SELECT 'Existing assignments' as info,
       ts.id,
       ts.teacher_id,
       ts.subject_id,
       ts.department_id,
       ts.semester_id,
       ts.semester,
       ts.academic_year,
       ts.is_active,
       t.name as teacher_name,
       s.name as subject_name
FROM teacher_subjects ts
LEFT JOIN teachers t ON ts.teacher_id = t.id
LEFT JOIN subjects s ON ts.subject_id = s.id
WHERE ts.is_active = true
ORDER BY ts.created_at DESC;

-- 2. Update existing assignments to have the correct semester_id
UPDATE teacher_subjects 
SET semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'  -- exact semester ID from debug
WHERE semester_id IS NULL 
AND academic_year = '2024-2025'
AND semester = 'fall';

-- 3. Update assignments to have the correct department_id
UPDATE teacher_subjects 
SET department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'  -- exact department ID from debug
WHERE department_id != 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
OR department_id IS NULL;

-- 4. Create student group if it doesn't exist
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

-- 5. Verify the fix worked
SELECT 'After update verification' as info,
       (SELECT COUNT(*) FROM teacher_subjects 
        WHERE department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8' 
        AND semester_id = '52222aad-7c8d-4a18-943d-1713e1149337' 
        AND is_active = true) as assignments_count,
       (SELECT COUNT(*) FROM student_groups 
        WHERE department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8' 
        AND semester_id = '52222aad-7c8d-4a18-943d-1713e1149337') as groups_count;

-- 6. Show the exact assignments that should now be found
SELECT 
    'These assignments should now be found by the frontend' as info,
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
