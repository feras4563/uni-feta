-- Migration script to convert existing semester data to the new structure
-- Run this AFTER running fix-semester-structure.sql

-- Step 1: Check what semesters you currently have
SELECT DISTINCT semester_id, s.name, s.name_en 
FROM department_semester_subjects dss 
JOIN semesters s ON dss.semester_id = s.id;

-- Step 2: Update existing records to use semester numbers
-- You'll need to manually map your existing semesters to numbers
-- For example, if you have "fall-2024" and "spring-2025", map them to 1 and 2

-- Example mappings (adjust based on your actual data):
UPDATE department_semester_subjects 
SET semester_number = 1 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%fall%' OR name LIKE '%الفصل الأول%' OR name LIKE '%أول%'
);

UPDATE department_semester_subjects 
SET semester_number = 2 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%spring%' OR name LIKE '%الفصل الثاني%' OR name LIKE '%ثاني%'
);

UPDATE department_semester_subjects 
SET semester_number = 3 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%الفصل الثالث%' OR name LIKE '%ثالث%'
);

UPDATE department_semester_subjects 
SET semester_number = 4 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%الفصل الرابع%' OR name LIKE '%رابع%'
);

-- Add more mappings as needed for semesters 5, 6, 7, 8...

-- Step 3: Verify the migration
SELECT 
  department_id,
  semester_number,
  COUNT(*) as subject_count,
  STRING_AGG(s.code, ', ') as subjects
FROM department_semester_subjects dss
JOIN subjects s ON dss.subject_id = s.id
GROUP BY department_id, semester_number
ORDER BY department_id, semester_number;

-- Step 4: After verifying everything works, you can clean up:
-- ALTER TABLE department_semester_subjects DROP COLUMN semester_id;
-- DROP TABLE semesters;
