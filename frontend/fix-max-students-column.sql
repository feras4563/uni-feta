-- ==============================================
-- QUICK FIX: ADD MAX_STUDENTS COLUMN TO SUBJECTS
-- ==============================================
-- This script adds the missing max_students column to the subjects table

-- ==============================================
-- 1. ADD MAX_STUDENTS COLUMN
-- ==============================================

-- Add the max_students column to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 30;

-- ==============================================
-- 2. UPDATE EXISTING RECORDS
-- ==============================================

-- Update existing subjects with default max_students values
UPDATE subjects 
SET max_students = 30 
WHERE max_students IS NULL;

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
AND column_name = 'max_students';

-- Check sample data
SELECT 
    id, 
    name, 
    code, 
    max_students 
FROM subjects 
LIMIT 5;

-- ==============================================
-- FIX COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ max_students column added successfully!';
    RAISE NOTICE '📊 Column: max_students (INTEGER, DEFAULT 30)';
    RAISE NOTICE '🎯 SubjectDetail.tsx should now work without errors';
END $$;
