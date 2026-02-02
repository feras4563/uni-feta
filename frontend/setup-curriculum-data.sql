-- ==============================================
-- SETUP CURRICULUM DATA
-- This script creates sample curriculum data for testing
-- ==============================================

-- First, let's check what we have
SELECT 'Current state check' as step;

-- Check if we have the feras department
SELECT id, name FROM departments WHERE name ILIKE '%feras%';

-- Check if we have subjects with semester_number = 1
SELECT id, code, name, semester_number, department_id 
FROM subjects 
WHERE semester_number = 1;

-- If you have subjects but no curriculum entries, we need to create them
-- This will create curriculum entries for all subjects that have semester_number = 1

-- Step 1: Create department_curriculum entries for semester 1 subjects
INSERT INTO department_curriculum (
    department_id,
    semester_id,
    subject_id,
    semester_number,
    is_required,
    is_active
)
SELECT 
    s.department_id,
    (SELECT id FROM semesters WHERE is_current = true LIMIT 1), -- Use current semester
    s.id,
    s.semester_number,
    s.is_required,
    true
FROM subjects s
WHERE s.semester_number = 1
AND s.department_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM department_curriculum dc 
    WHERE dc.department_id = s.department_id 
    AND dc.subject_id = s.id 
    AND dc.semester_number = s.semester_number
);

-- Step 2: Also create entries in department_semester_subjects if needed
INSERT INTO department_semester_subjects (
    department_id,
    semester_id,
    subject_id,
    semester_number,
    is_active
)
SELECT 
    s.department_id,
    (SELECT id FROM semesters WHERE is_current = true LIMIT 1), -- Use current semester
    s.id,
    s.semester_number,
    true
FROM subjects s
WHERE s.semester_number = 1
AND s.department_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM department_semester_subjects dss 
    WHERE dss.department_id = s.department_id 
    AND dss.subject_id = s.id 
    AND dss.semester_number = s.semester_number
);

-- Step 3: Verify the created entries
SELECT 'Created curriculum entries' as step;
SELECT 
    dc.id,
    dc.department_id,
    dc.semester_number,
    dc.subject_id,
    dc.is_active,
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code
FROM department_curriculum dc
LEFT JOIN departments d ON dc.department_id = d.id
LEFT JOIN subjects s ON dc.subject_id = s.id
WHERE dc.semester_number = 1
ORDER BY d.name, s.name;

-- Step 4: Check department_semester_subjects entries
SELECT 'Created department_semester_subjects entries' as step;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code
FROM department_semester_subjects dss
LEFT JOIN departments d ON dss.department_id = d.id
LEFT JOIN subjects s ON dss.subject_id = s.id
WHERE dss.semester_number = 1
ORDER BY d.name, s.name;







