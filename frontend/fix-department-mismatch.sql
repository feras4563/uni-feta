-- Fix the department mismatch issue
-- The student "تجربة" is in DEPT_MANAGEMENT but subjects are assigned to "feras"

-- Option 1: Update the student to belong to "feras" department
UPDATE students 
SET department_id = 'feras' 
WHERE name = 'تجربة' AND id = 'ST252414';

-- Verify the update
SELECT 'Updated student department:' as info;
SELECT id, name, department_id, status 
FROM students 
WHERE name = 'تجربة';

-- Option 2: Alternative - Move subjects from "feras" to DEPT_MANAGEMENT
-- Uncomment this section if you prefer to move subjects instead of changing student department
/*
-- Update subjects to belong to DEPT_MANAGEMENT
UPDATE subjects 
SET department_id = 'DEPT_MANAGEMENT' 
WHERE department_id = 'feras' AND semester_number = 1;

-- Update department_semester_subjects entries
UPDATE department_semester_subjects 
SET department_id = 'DEPT_MANAGEMENT' 
WHERE department_id = 'feras' AND semester_number = 1;

-- Verify the changes
SELECT 'Updated subjects for DEPT_MANAGEMENT:' as info;
SELECT 
    s.id,
    s.code,
    s.name,
    s.department_id,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.department_id = 'DEPT_MANAGEMENT' AND s.semester_number = 1
ORDER BY s.name;
*/

-- Test the API query after the fix
SELECT 'API Query Test After Fix:' as info;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
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
WHERE dss.department_id = 'feras'  -- This will match after the student update
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;


