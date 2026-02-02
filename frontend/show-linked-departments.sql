-- ============================================================================
-- Show All Linked Departments for Subjects
-- This query shows the many-to-many relationship between subjects and departments
-- ============================================================================

-- Query 1: Show all subjects with their linked departments
SELECT 
    s.id as subject_id,
    s.code as subject_code,
    s.name as subject_name,
    s.name_en as subject_name_en,
    d.id as department_id,
    d.name as department_name,
    d.name_en as department_name_en,
    sd.is_primary_department,
    sd.is_active,
    sd.created_at as link_created_at
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id
LEFT JOIN departments d ON sd.department_id = d.id
ORDER BY s.name, sd.is_primary_department DESC, d.name;

-- Query 2: Summary of department links per subject
SELECT 
    s.code as subject_code,
    s.name as subject_name,
    COUNT(sd.department_id) as total_departments,
    COUNT(CASE WHEN sd.is_primary_department = true THEN 1 END) as primary_departments,
    STRING_AGG(
        CASE 
            WHEN sd.is_primary_department = true THEN '★ ' || d.name
            ELSE d.name
        END, 
        ', ' 
        ORDER BY sd.is_primary_department DESC, d.name
    ) as linked_departments
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON sd.department_id = d.id
GROUP BY s.id, s.code, s.name
ORDER BY s.name;

-- Query 3: Show departments with their linked subjects count
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.name_en as department_name_en,
    COUNT(sd.subject_id) as total_subjects,
    COUNT(CASE WHEN sd.is_primary_department = true THEN 1 END) as primary_subjects,
    STRING_AGG(s.code, ', ' ORDER BY s.code) as subject_codes
FROM departments d
LEFT JOIN subject_departments sd ON d.id = sd.department_id AND sd.is_active = true
LEFT JOIN subjects s ON sd.subject_id = s.id
GROUP BY d.id, d.name, d.name_en
ORDER BY d.name;

-- Query 4: Check for subjects without any department links
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    'No departments linked' as status
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
WHERE sd.department_id IS NULL
ORDER BY s.name;

-- Query 5: Check for departments without any subject links
SELECT 
    d.id,
    d.name,
    d.name_en,
    'No subjects linked' as status
FROM departments d
LEFT JOIN subject_departments sd ON d.id = sd.department_id AND sd.is_active = true
WHERE sd.subject_id IS NULL
ORDER BY d.name;


