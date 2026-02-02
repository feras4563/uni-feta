-- Quick diagnostic to check if teacher assignments exist
-- Run this to see what's actually in your database

-- Check if teacher_subjects table has any data
SELECT 'teacher_subjects count' as check_type, COUNT(*) as count FROM teacher_subjects WHERE is_active = true;

-- Check if there are any departments
SELECT 'departments count' as check_type, COUNT(*) as count FROM departments;

-- Check if there are any semesters  
SELECT 'semesters count' as check_type, COUNT(*) as count FROM semesters;

-- Check if there are any teachers
SELECT 'teachers count' as check_type, COUNT(*) as count FROM teachers;

-- Check if there are any subjects
SELECT 'subjects count' as check_type, COUNT(*) as count FROM subjects;

-- Check if there are any student groups
SELECT 'student_groups count' as check_type, COUNT(*) as count FROM student_groups;

-- Show sample teacher assignments with relationships
SELECT 
    ts.id,
    ts.teacher_id,
    ts.subject_id,
    ts.department_id,
    ts.semester_id,
    ts.semester,
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
LIMIT 5;
