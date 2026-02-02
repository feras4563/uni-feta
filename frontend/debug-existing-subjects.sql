-- Debug existing subjects configuration
-- This script checks why subjects aren't showing in student registration

-- 1. Check what department the student "تجربة" actually belongs to
SELECT 'Student تجربة department:' as info;
SELECT id, name, department_id, status 
FROM students 
WHERE name ILIKE '%تجربة%';

-- 2. Check all departments to see what's available
SELECT 'All departments:' as info;
SELECT id, name, name_en 
FROM departments 
ORDER BY name;

-- 3. Check subjects that have semester_number = 1
SELECT 'All subjects for semester 1:' as info;
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.department_id,
    s.semester_number,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.semester_number = 1
ORDER BY d.name, s.name;

-- 4. Check department_semester_subjects table for semester 1
SELECT 'Department semester subjects for semester 1:' as info;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    s.code,
    s.name,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.semester_number = 1
ORDER BY d.name, s.name;

-- 5. Check specifically for the student's department
-- First, let's see what department the student has
WITH student_dept AS (
    SELECT department_id 
    FROM students 
    WHERE name ILIKE '%تجربة%'
)
SELECT 'Subjects for student تجربة department and semester 1:' as info;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
CROSS JOIN student_dept sd
WHERE dss.department_id = sd.department_id
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;

-- 6. Check if subjects exist directly in subjects table for the student's department
WITH student_dept AS (
    SELECT department_id 
    FROM students 
    WHERE name ILIKE '%تجربة%'
)
SELECT 'Direct subjects for student department and semester 1:' as info;
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number,
    s.department_id,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
CROSS JOIN student_dept sd
WHERE s.department_id = sd.department_id
AND s.semester_number = 1
ORDER BY s.name;


