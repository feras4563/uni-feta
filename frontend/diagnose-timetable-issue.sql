-- Check database state for timetable generation issue
-- This script will help diagnose why auto-create timetable shows no teacher assignments

-- 1. Check if teacher_subjects table exists and has data
SELECT 'teacher_subjects' as table_name, COUNT(*) as record_count 
FROM teacher_subjects 
WHERE is_active = true;

-- 2. Check departments
SELECT 'departments' as table_name, COUNT(*) as record_count 
FROM departments;

-- 3. Check semesters
SELECT 'semesters' as table_name, COUNT(*) as record_count 
FROM semesters;

-- 4. Check student_groups
SELECT 'student_groups' as table_name, COUNT(*) as record_count 
FROM student_groups;

-- 5. Check teachers
SELECT 'teachers' as table_name, COUNT(*) as record_count 
FROM teachers;

-- 6. Check subjects
SELECT 'subjects' as table_name, COUNT(*) as record_count 
FROM subjects;

-- 7. Sample teacher_subjects data with relationships
SELECT 
    ts.id,
    ts.teacher_id,
    ts.subject_id,
    ts.department_id,
    ts.academic_year,
    ts.semester,
    ts.is_active,
    t.name as teacher_name,
    s.name as subject_name,
    d.name as department_name
FROM teacher_subjects ts
LEFT JOIN teachers t ON ts.teacher_id = t.id
LEFT JOIN subjects s ON ts.subject_id = s.id
LEFT JOIN departments d ON ts.department_id = d.id
WHERE ts.is_active = true
LIMIT 5;

-- 8. Check if there are any teacher assignments for specific department/semester combinations
SELECT 
    ts.department_id,
    ts.semester,
    COUNT(*) as assignment_count,
    d.name as department_name
FROM teacher_subjects ts
LEFT JOIN departments d ON ts.department_id = d.id
WHERE ts.is_active = true
GROUP BY ts.department_id, ts.semester, d.name
ORDER BY assignment_count DESC;

-- 9. Check student groups by department and semester
SELECT 
    sg.department_id,
    sg.semester_id,
    COUNT(*) as group_count,
    d.name as department_name,
    s.name as semester_name
FROM student_groups sg
LEFT JOIN departments d ON sg.department_id = d.id
LEFT JOIN semesters s ON sg.semester_id = s.id
GROUP BY sg.department_id, sg.semester_id, d.name, s.name
ORDER BY group_count DESC;
