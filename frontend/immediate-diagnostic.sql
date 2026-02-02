-- Immediate diagnostic to check what actually exists in the database
-- Run this to see exactly what data we have

-- 1. Check if our sample data was created
SELECT 'Sample data check' as check_type,
       (SELECT COUNT(*) FROM departments WHERE name = 'ادارة اعمال') as business_dept_exists,
       (SELECT COUNT(*) FROM semesters WHERE name = 'marsul') as marsul_semester_exists,
       (SELECT COUNT(*) FROM teachers WHERE name = 'أحمد محمد') as teacher_ahmed_exists,
       (SELECT COUNT(*) FROM subjects WHERE code = 'MGMT101') as mgmt_subject_exists;

-- 2. Check teacher_subjects table specifically
SELECT 'Teacher assignments check' as check_type,
       COUNT(*) as total_assignments,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_assignments,
       COUNT(CASE WHEN semester_id IS NOT NULL THEN 1 END) as with_semester_id,
       COUNT(CASE WHEN department_id IS NOT NULL THEN 1 END) as with_department_id
FROM teacher_subjects;

-- 3. Show all teacher assignments with full details
SELECT 
    'All teacher assignments' as check_type,
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
ORDER BY ts.created_at DESC;

-- 4. Check what departments and semesters actually exist
SELECT 'Available departments' as check_type, id, name, name_en FROM departments ORDER BY name;
SELECT 'Available semesters' as check_type, id, name, name_en FROM semesters ORDER BY name;

-- 5. Check student groups
SELECT 'Student groups' as check_type, id, group_name, department_id, semester_id FROM student_groups ORDER BY group_name;
