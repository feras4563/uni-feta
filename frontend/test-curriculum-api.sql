-- ==============================================
-- TEST CURRICULUM API DATA
-- This script tests what the API function should return
-- ==============================================

-- Test 1: Check department_curriculum table
SELECT 'department_curriculum check' as test_type;
SELECT COUNT(*) as total_records FROM department_curriculum;
SELECT COUNT(*) as semester_1_records FROM department_curriculum WHERE semester_number = 1;

-- Test 2: Check department_semester_subjects table  
SELECT 'department_semester_subjects check' as test_type;
SELECT COUNT(*) as total_records FROM department_semester_subjects;
SELECT COUNT(*) as semester_1_records FROM department_semester_subjects WHERE semester_number = 1;

-- Test 3: Get the feras department ID
SELECT 'feras department ID' as test_type;
SELECT id, name FROM departments WHERE name ILIKE '%feras%';

-- Test 4: Simulate what the API should return for feras department, semester 1
SELECT 'API simulation for feras department, semester 1' as test_type;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    true as is_required,
    dss.is_active,
    s.id as subject_id_check,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required as subject_is_required,
    s.semester_number as subject_semester_number,
    sem.id as semester_id_check,
    sem.name as semester_name,
    sem.name_en as semester_name_en,
    d.id as department_id_check,
    d.name as department_name,
    d.name_en as department_name_en
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN semesters sem ON dss.semester_id = sem.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.department_id = (SELECT id FROM departments WHERE name ILIKE '%feras%' LIMIT 1)
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;

-- Test 5: Check if there are any current semesters
SELECT 'current semesters check' as test_type;
SELECT id, name, name_en, is_current FROM semesters WHERE is_current = true;







