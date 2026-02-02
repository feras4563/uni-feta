-- Debug why subjects aren't showing for feras department and semester 1
-- This will help us understand the exact issue

-- 1. Check if the student department was actually updated
SELECT 'Student department check:' as info;
SELECT id, name, department_id, status 
FROM students 
WHERE name = 'تجربة';

-- 2. Check subjects that exist for feras department and semester 1
SELECT 'Subjects in subjects table for feras, semester 1:' as info;
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.department_id,
    s.semester_number,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required
FROM subjects s
WHERE s.department_id = 'feras'
AND s.semester_number = 1
ORDER BY s.name;

-- 3. Check department_semester_subjects entries for feras and semester 1
SELECT 'Department semester subjects for feras, semester 1:' as info;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    dss.is_active,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
ORDER BY s.name;

-- 4. Test the exact API query that should return results
SELECT 'API Query Test - This should return subjects:' as info;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    dss.is_active,
    s.id as subject_id_check,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number as subject_semester_number,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;
