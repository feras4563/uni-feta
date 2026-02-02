-- Get the department ID for student "تجربة"
SELECT 
    id, 
    name, 
    department_id, 
    status
FROM students 
WHERE name ILIKE '%تجربة%';


