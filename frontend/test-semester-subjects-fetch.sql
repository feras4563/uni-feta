-- ==============================================
-- TEST SEMESTER SUBJECTS FETCH
-- This script tests fetching subjects for a specific department and semester
-- ==============================================

-- Test 1: Check what subjects are assigned to semester 1 for DEPT_MANAGEMENT
SELECT 'Subjects for DEPT_MANAGEMENT, Semester 1' as test_type;
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
WHERE dss.department_id = 'DEPT_MANAGEMENT'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;

-- Test 2: Check what subjects are assigned to semester 2 for DEPT_MANAGEMENT
SELECT 'Subjects for DEPT_MANAGEMENT, Semester 2' as test_type;
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
WHERE dss.department_id = 'DEPT_MANAGEMENT'
AND dss.semester_number = 2
AND dss.is_active = true
ORDER BY s.name;

-- Test 3: Check all semester assignments for DEPT_MANAGEMENT
SELECT 'All semester assignments for DEPT_MANAGEMENT' as test_type;
SELECT 
    dss.semester_number,
    COUNT(*) as subject_count,
    STRING_AGG(s.name, ', ') as subject_names
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
WHERE dss.department_id = 'DEPT_MANAGEMENT'
AND dss.is_active = true
GROUP BY dss.semester_number
ORDER BY dss.semester_number;

-- Test 4: Simulate the API call for student registration
-- This is what the fetchDepartmentCurriculumBySemesterNumber function should return
SELECT 'API Simulation - Curriculum for Registration' as test_type;
SELECT 
    dss.id as curriculum_id,
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
WHERE dss.department_id = 'DEPT_MANAGEMENT'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;







