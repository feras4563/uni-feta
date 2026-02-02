-- ==============================================
-- CHECK MISSING SUBJECT "تجربة"
-- This script checks why "تجربة" subject is not showing in our query
-- ==============================================

-- Check the "تجربة" subject specifically
SELECT 'تجربة subject details' as check_type;
SELECT 
    id,
    code,
    name,
    name_en,
    credits,
    cost_per_credit,
    total_cost,
    is_required,
    semester_number,
    department_id
FROM subjects 
WHERE name ILIKE '%تجربة%' OR code = '00128';

-- Check all subjects with code 00128
SELECT 'All subjects with code 00128' as check_type;
SELECT 
    id,
    code,
    name,
    name_en,
    credits,
    cost_per_credit,
    total_cost,
    is_required,
    semester_number,
    department_id
FROM subjects 
WHERE code = '00128';

-- Check if there are multiple subjects with similar names
SELECT 'All subjects with تجربة in name' as check_type;
SELECT 
    id,
    code,
    name,
    name_en,
    credits,
    cost_per_credit,
    total_cost,
    is_required,
    semester_number,
    department_id
FROM subjects 
WHERE name ILIKE '%تجربة%';

-- Check all subjects for DEPT_MANAGEMENT with semester_number = 1
SELECT 'All DEPT_MANAGEMENT subjects for semester 1' as check_type;
SELECT 
    id,
    code,
    name,
    name_en,
    credits,
    cost_per_credit,
    total_cost,
    is_required,
    semester_number,
    department_id
FROM subjects 
WHERE department_id = 'DEPT_MANAGEMENT' 
AND semester_number = 1
ORDER BY name;

-- Check if there are subjects with different department_id but same name
SELECT 'Subjects with تجربة name but different department' as check_type;
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
WHERE s.name ILIKE '%تجربة%'
ORDER BY s.department_id, s.name;







