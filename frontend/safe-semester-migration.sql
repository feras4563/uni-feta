-- Safe migration script that handles existing constraints
-- Run this step by step

-- Step 1: Add semester_number column if it doesn't exist
ALTER TABLE department_semester_subjects 
ADD COLUMN IF NOT EXISTS semester_number INTEGER;

-- Step 2: Check what semesters you currently have
SELECT DISTINCT semester_id, s.name, s.name_en 
FROM department_semester_subjects dss 
JOIN semesters s ON dss.semester_id = s.id;

-- Step 3: Update existing records (customize these mappings based on your data)
-- Example mappings - adjust based on your actual semester names:

-- Map first semester (adjust the WHERE condition)
UPDATE department_semester_subjects 
SET semester_number = 1 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%fall%' OR name LIKE '%الفصل الأول%' OR name LIKE '%أول%'
);

-- Map second semester (adjust the WHERE condition)
UPDATE department_semester_subjects 
SET semester_number = 2 
WHERE semester_id IN (
  SELECT id FROM semesters 
  WHERE name LIKE '%spring%' OR name LIKE '%الفصل الثاني%' OR name LIKE '%ثاني%'
);

-- Add more mappings as needed for semesters 3, 4, 5, 6, 7, 8...

-- Step 4: Check if all records have semester_number set
SELECT COUNT(*) as total_records, 
       COUNT(semester_number) as records_with_semester_number,
       COUNT(*) - COUNT(semester_number) as missing_semester_number
FROM department_semester_subjects;

-- Step 5: Only proceed if all records have semester_number
-- If there are missing records, you need to add more UPDATE statements above

-- Step 6: Make semester_number NOT NULL (only if all records are updated)
-- ALTER TABLE department_semester_subjects 
-- ALTER COLUMN semester_number SET NOT NULL;

-- Step 7: Drop existing constraint if it exists, then add new one
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_department_semester_subject') THEN
        ALTER TABLE department_semester_subjects DROP CONSTRAINT unique_department_semester_subject;
    END IF;
    
    -- Add new constraint
    ALTER TABLE department_semester_subjects 
    ADD CONSTRAINT unique_department_semester_subject 
    UNIQUE (department_id, semester_number, subject_id);
END $$;

-- Step 8: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_semester_number 
ON department_semester_subjects (semester_number);

-- Step 9: Verify the migration
SELECT 
  dss.department_id,
  dss.semester_number,
  COUNT(*) as subject_count,
  STRING_AGG(s.code, ', ') as subjects
FROM department_semester_subjects dss
JOIN subjects s ON dss.subject_id = s.id
WHERE dss.semester_number IS NOT NULL
GROUP BY dss.department_id, dss.semester_number
ORDER BY dss.department_id, dss.semester_number;
