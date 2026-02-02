-- ==============================================
-- FETCH SEMESTER SUBJECTS FOR STUDENT DEPARTMENT
-- This script shows how to get subjects for a specific department and semester
-- ==============================================

-- Method 1: Direct query from subjects table (simplest approach)
-- This gets subjects that belong to a department and have a specific semester_number
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
WHERE s.department_id = 'DEPT_MANAGEMENT'  -- Replace with actual department ID
AND s.semester_number = 1                  -- Replace with selected semester number
AND s.department_id IS NOT NULL
ORDER BY s.name;

-- Method 2: Using department_curriculum table (if it has data)
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
    dc.department_id,
    d.name as department_name
FROM department_curriculum dc
LEFT JOIN subjects s ON dc.subject_id = s.id
LEFT JOIN departments d ON dc.department_id = d.id
WHERE dc.department_id = 'DEPT_MANAGEMENT'  -- Replace with actual department ID
AND dc.semester_number = 1                  -- Replace with selected semester number
AND dc.is_active = true
ORDER BY s.name;

-- Method 3: Using department_semester_subjects table (fallback)
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
    dss.department_id,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.department_id = 'DEPT_MANAGEMENT'  -- Replace with actual department ID
AND dss.semester_number = 1                  -- Replace with selected semester number
AND dss.is_active = true
ORDER BY s.name;

-- Method 4: Get department ID by name (for dynamic queries)
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
WHERE d.name ILIKE '%feras%'                -- Replace with department name
AND s.semester_number = 1                  -- Replace with selected semester number
AND s.department_id IS NOT NULL
ORDER BY s.name;







