-- Simple debug script to check why subjects aren't showing
-- This version avoids CTE syntax issues

-- 1. Check the student "تجربة" details
SELECT 'STUDENT DETAILS' as section;
SELECT 
    id, 
    name, 
    department_id, 
    status,
    email
FROM students 
WHERE name ILIKE '%تجربة%';

-- 2. Check all departments
SELECT 'ALL DEPARTMENTS' as section;
SELECT id, name, name_en, semester_count 
FROM departments 
ORDER BY name;

-- 3. Check all subjects with semester_number = 1
SELECT 'ALL SUBJECTS FOR SEMESTER 1' as section;
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
    s.is_required,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.semester_number = 1
ORDER BY d.name, s.code;

-- 4. Check department_semester_subjects table for semester 1
SELECT 'DEPARTMENT_SEMESTER_SUBJECTS FOR SEMESTER 1' as section;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    dss.is_active,
    s.code as subject_code,
    s.name as subject_name,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.semester_number = 1
ORDER BY d.name, s.name;

-- 5. Test the API query for department 'feras' and semester 1
SELECT 'API QUERY TEST FOR FERAS DEPARTMENT' as section;
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

-- 6. If no results from step 5, check what department the student actually has
-- Run this after getting the department_id from step 1
SELECT 'API QUERY TEST FOR ACTUAL STUDENT DEPARTMENT' as section;
-- Replace 'ACTUAL_DEPARTMENT_ID' with the department_id from step 1
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
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.department_id = 'ACTUAL_DEPARTMENT_ID'  -- Replace this with actual department_id
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;
