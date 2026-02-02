-- Check student 'تجربة' details and department
SELECT 'Student تجربة Details:' as info;
SELECT id, name, department_id, status 
FROM students 
WHERE name ILIKE '%تجربة%';

-- Check if department exists
SELECT 'Department Details:' as info;
SELECT id, name, name_en 
FROM departments 
WHERE id = 'feras';

-- Check subjects for department 'feras' and semester 1
SELECT 'Subjects for department feras, semester 1:' as info;
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
WHERE s.department_id = 'feras'
AND s.semester_number = 1
ORDER BY s.name;

-- Check department_semester_subjects for 'feras' department and semester 1
SELECT 'Department Semester Subjects for feras, semester 1:' as info;
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
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;

-- Check all departments to see what's available
SELECT 'All Departments:' as info;
SELECT id, name, name_en 
FROM departments 
ORDER BY name;

-- Check if there are any subjects at all for semester 1
SELECT 'All subjects for semester 1:' as info;
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.department_id,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.semester_number = 1
ORDER BY d.name, s.name;


