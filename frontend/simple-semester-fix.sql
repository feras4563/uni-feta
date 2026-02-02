-- Simple fix: Just add semester_number to existing table
-- This avoids the complexity of creating new tables

-- Step 1: Add semester_number column to department_semester_subjects
ALTER TABLE department_semester_subjects 
ADD COLUMN IF NOT EXISTS semester_number INTEGER;

-- Step 2: Create a simple mapping of your existing semesters to numbers
-- You'll need to manually set these based on your existing data
-- First, let's see what semesters you have:
-- SELECT DISTINCT semester_id, s.name FROM department_semester_subjects dss 
-- JOIN semesters s ON dss.semester_id = s.id;

-- Step 3: Update existing records (adjust these mappings based on your actual data)
-- Example mappings - you'll need to customize these:

-- If you have "fall-2024" or similar, map to semester 1
UPDATE department_semester_subjects 
SET semester_number = 1 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%fall%' OR name LIKE '%الفصل الأول%' OR name LIKE '%أول%'
);

-- If you have "spring-2025" or similar, map to semester 2
UPDATE department_semester_subjects 
SET semester_number = 2 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%spring%' OR name LIKE '%الفصل الثاني%' OR name LIKE '%ثاني%'
);

-- Add more mappings as needed:
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

-- Step 4: Make semester_number NOT NULL after updating all records
ALTER TABLE department_semester_subjects 
ALTER COLUMN semester_number SET NOT NULL;

-- Step 5: Add unique constraint
ALTER TABLE department_semester_subjects 
ADD CONSTRAINT unique_department_semester_subject 
UNIQUE (department_id, semester_number, subject_id);

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_semester_number 
ON department_semester_subjects (semester_number);

-- Step 7: Verify the migration
SELECT 
  department_id,
  semester_number,
  COUNT(*) as subject_count,
  STRING_AGG(s.code, ', ') as subjects
FROM department_semester_subjects dss
JOIN subjects s ON dss.subject_id = s.id
GROUP BY department_id, semester_number
ORDER BY department_id, semester_number;
