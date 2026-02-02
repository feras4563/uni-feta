-- Test what the frontend API function should return
-- This simulates the exact query from fetchDepartmentCurriculumBySemesterNumber

SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    true as is_required,  -- This is hardcoded in the API
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
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;
