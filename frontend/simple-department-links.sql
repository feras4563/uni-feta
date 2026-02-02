-- Simple query to show subject-department links
-- Run this in your Supabase SQL Editor

-- Show all subjects with their linked departments
SELECT 
    s.code as "Subject Code",
    s.name as "Subject Name",
    d.name as "Department Name",
    CASE 
        WHEN sd.is_primary_department = true THEN '★ Primary'
        ELSE 'Secondary'
    END as "Department Type",
    CASE 
        WHEN sd.is_active = true THEN 'Active'
        ELSE 'Inactive'
    END as "Status"
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id
LEFT JOIN departments d ON sd.department_id = d.id
ORDER BY s.name, sd.is_primary_department DESC;
