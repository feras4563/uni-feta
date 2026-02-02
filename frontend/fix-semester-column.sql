-- ==============================================
-- QUICK FIX: ADD SEMESTER COLUMN TO SUBJECTS
-- ==============================================
-- This script adds the missing semester column to the subjects table

-- ==============================================
-- 1. ADD SEMESTER COLUMN
-- ==============================================

-- Add the semester column to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS semester TEXT;

-- ==============================================
-- 2. UPDATE EXISTING RECORDS
-- ==============================================

-- Update existing subjects with semester values based on semester_number
UPDATE subjects 
SET semester = CASE 
  WHEN semester_number = 1 THEN '1'
  WHEN semester_number = 2 THEN '2'
  WHEN semester_number = 3 THEN '3'
  WHEN semester_number = 4 THEN '4'
  WHEN semester_number = 5 THEN '5'
  WHEN semester_number = 6 THEN '6'
  WHEN semester_number = 7 THEN '7'
  WHEN semester_number = 8 THEN '8'
  ELSE '1'
END
WHERE semester IS NULL;

-- ==============================================
-- 3. VERIFY THE FIX
-- ==============================================

-- Check if the column exists and has data
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND column_name = 'semester';

-- Check sample data
SELECT 
    id, 
    name, 
    code, 
    semester_number,
    semester 
FROM subjects 
LIMIT 5;

-- ==============================================
-- FIX COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ semester column added successfully!';
    RAISE NOTICE '📊 Column: semester (TEXT)';
    RAISE NOTICE '🎯 SubjectCreate.tsx should now work without errors';
END $$;
