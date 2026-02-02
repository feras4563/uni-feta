-- ==============================================
-- DEBUG CURRICULUM DATA
-- This script helps diagnose why curriculum is not showing
-- ==============================================

-- 1. Check if department_curriculum table exists and has data
SELECT 'department_curriculum table check' as check_type;
SELECT COUNT(*) as total_records FROM department_curriculum;

-- 2. Check departments and their IDs
SELECT 'departments check' as check_type;
SELECT id, name, name_en FROM departments ORDER BY name;

-- 3. Check subjects and their semester numbers
SELECT 'subjects with semester numbers' as check_type;
SELECT id, code, name, semester_number, department_id 
FROM subjects 
WHERE semester_number IS NOT NULL 
ORDER BY department_id, semester_number, name;

-- 4. Check department_curriculum entries
SELECT 'department_curriculum entries' as check_type;
SELECT 
    dc.id,
    dc.department_id,
    dc.semester_number,
    dc.subject_id,
    dc.is_active,
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code
FROM department_curriculum dc
LEFT JOIN departments d ON dc.department_id = d.id
LEFT JOIN subjects s ON dc.subject_id = s.id
ORDER BY dc.department_id, dc.semester_number, s.name;

-- 5. Check if there are any subjects for semester 1
SELECT 'subjects for semester 1' as check_type;
SELECT 
    s.id,
    s.code,
    s.name,
    s.semester_number,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.semester_number = 1
ORDER BY d.name, s.name;

-- 6. Check department_semester_subjects table (alternative structure)
SELECT 'department_semester_subjects check' as check_type;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code
FROM department_semester_subjects dss
LEFT JOIN departments d ON dss.department_id = d.id
LEFT JOIN subjects s ON dss.subject_id = s.id
WHERE dss.semester_number = 1
ORDER BY d.name, s.name;

-- 7. Check if the specific department "feras" exists
SELECT 'feras department check' as check_type;
SELECT id, name, name_en FROM departments WHERE name ILIKE '%feras%' OR name_en ILIKE '%feras%';

-- 8. Check subjects for feras department
SELECT 'subjects for feras department' as check_type;
SELECT 
    s.id,
    s.code,
    s.name,
    s.semester_number,
    s.department_id,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE d.name ILIKE '%feras%' OR s.department_id IN (
    SELECT id FROM departments WHERE name ILIKE '%feras%'
)
ORDER BY s.semester_number, s.name;







