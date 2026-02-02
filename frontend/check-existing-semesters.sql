-- Check what semesters you currently have in your database
-- Run this first to see what needs to be mapped

-- Show all existing semesters
SELECT DISTINCT 
  dss.semester_id,
  s.name as semester_name,
  s.name_en as semester_name_en,
  COUNT(*) as assignment_count
FROM department_semester_subjects dss
JOIN semesters s ON dss.semester_id = s.id
GROUP BY dss.semester_id, s.name, s.name_en
ORDER BY s.name;

-- Show which departments use which semesters
SELECT 
  d.name as department_name,
  s.name as semester_name,
  COUNT(*) as subject_count,
  STRING_AGG(sub.code, ', ') as subjects
FROM department_semester_subjects dss
JOIN departments d ON dss.department_id = d.id
JOIN semesters s ON dss.semester_id = s.id
JOIN subjects sub ON dss.subject_id = sub.id
GROUP BY d.name, s.name
ORDER BY d.name, s.name;
