-- Quick script to check students in the database
-- Run this in Supabase SQL Editor to see what students exist

-- Check total students
SELECT 'Total Students:' as info, COUNT(*) as count FROM students;

-- Check active students
SELECT 'Active Students:' as info, COUNT(*) as count FROM students WHERE status = 'active';

-- Check students by department
SELECT 'Students by Department:' as info;
SELECT 
  d.name as department_name,
  COUNT(s.id) as student_count
FROM departments d
LEFT JOIN students s ON d.id = s.department_id AND s.status = 'active'
GROUP BY d.id, d.name
ORDER BY student_count DESC;

-- Check students without groups
SELECT 'Students without groups:' as info;
SELECT COUNT(*) as count
FROM students s
WHERE s.status = 'active'
AND s.id NOT IN (
  SELECT DISTINCT student_id 
  FROM student_semester_registrations 
  WHERE status = 'active'
);

-- Sample students
SELECT 'Sample Students:' as info;
SELECT 
  s.id,
  s.name,
  s.email,
  s.status,
  d.name as department_name
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.status = 'active'
LIMIT 10;
