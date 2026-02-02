-- Safe fix for timetable generation issue
-- This script works with existing data instead of deleting it

-- 1. First, let's see what we actually have
SELECT 'Current state' as check_type,
       (SELECT COUNT(*) FROM departments) as departments_count,
       (SELECT COUNT(*) FROM semesters) as semesters_count,
       (SELECT COUNT(*) FROM teachers) as teachers_count,
       (SELECT COUNT(*) FROM subjects) as subjects_count,
       (SELECT COUNT(*) FROM teacher_subjects WHERE is_active = true) as assignments_count;

-- 2. Show existing departments
SELECT 'Existing departments' as info, id, name, name_en FROM departments ORDER BY name;

-- 3. Show existing semesters  
SELECT 'Existing semesters' as info, id, name, name_en FROM semesters ORDER BY name;

-- 4. Show existing teachers
SELECT 'Existing teachers' as info, id, name, name_en FROM teachers WHERE is_active = true ORDER BY name;

-- 5. Show existing subjects
SELECT 'Existing subjects' as info, id, name, name_en, code FROM subjects WHERE is_active = true ORDER BY code;

-- 6. Show existing teacher assignments
SELECT 
    'Existing teacher assignments' as info,
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

-- 7. Now let's create assignments using existing data
-- First, get the first available department and semester
WITH existing_dept AS (
    SELECT id, name FROM departments WHERE is_active = true LIMIT 1
),
existing_sem AS (
    SELECT id, name FROM semesters WHERE is_active = true LIMIT 1
),
existing_teacher AS (
    SELECT id, name FROM teachers WHERE is_active = true LIMIT 1
),
existing_subject AS (
    SELECT id, name FROM subjects WHERE is_active = true LIMIT 1
)
-- Create a teacher assignment using existing data
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    et.id,
    es.id,
    ed.id,
    sem.id,
    sy.id,
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM existing_dept ed, existing_sem sem, existing_teacher et, existing_subject es
LEFT JOIN study_years sy ON sy.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts2 
    WHERE ts2.teacher_id = et.id 
    AND ts2.subject_id = es.id 
    AND ts2.department_id = ed.id 
    AND ts2.semester_id = sem.id
);

-- 8. Create more assignments if we have more teachers and subjects
WITH existing_dept AS (
    SELECT id, name FROM departments WHERE is_active = true LIMIT 1
),
existing_sem AS (
    SELECT id, name FROM semesters WHERE is_active = true LIMIT 1
),
teachers_subjects AS (
    SELECT t.id as teacher_id, s.id as subject_id, t.name as teacher_name, s.name as subject_name
    FROM teachers t, subjects s
    WHERE t.is_active = true AND s.is_active = true
    LIMIT 5  -- Create up to 5 assignments
)
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    ts.teacher_id,
    ts.subject_id,
    ed.id,
    sem.id,
    sy.id,
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM existing_dept ed, existing_sem sem, teachers_subjects ts
LEFT JOIN study_years sy ON sy.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts2 
    WHERE ts2.teacher_id = ts.teacher_id 
    AND ts2.subject_id = ts.subject_id 
    AND ts2.department_id = ed.id 
    AND ts2.semester_id = sem.id
);

-- 9. Create student groups using existing data
WITH existing_dept AS (
    SELECT id, name FROM departments WHERE is_active = true LIMIT 1
),
existing_sem AS (
    SELECT id, name FROM semesters WHERE is_active = true LIMIT 1
)
INSERT INTO student_groups (
    id, group_name, department_id, semester_id, semester_number, max_students, current_students, is_active
)
SELECT 
    gen_random_uuid()::text,
    'Group A',
    ed.id,
    sem.id,
    1,  -- Default semester number
    30,
    25,
    true
FROM existing_dept ed, existing_sem sem
WHERE NOT EXISTS (
    SELECT 1 FROM student_groups sg 
    WHERE sg.group_name = 'Group A' 
    AND sg.department_id = ed.id 
    AND sg.semester_id = sem.id
);

-- 10. Final verification
SELECT 'Final verification' as check_type,
       (SELECT COUNT(*) FROM teacher_subjects WHERE is_active = true) as total_assignments,
       (SELECT COUNT(*) FROM student_groups) as total_groups;

-- 11. Show what the frontend should find
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
ORDER BY ts.created_at DESC;
