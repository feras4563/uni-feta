-- Test the API query for DEPT_MANAGEMENT department and semester 1
-- This simulates exactly what fetchDepartmentCurriculumBySemesterNumber does

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
WHERE dss.department_id = 'DEPT_MANAGEMENT'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;
