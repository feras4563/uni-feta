-- ==============================================
-- QUICK FIX: ADD TEACHER_ID COLUMN TO SUBJECTS
-- ==============================================
-- This script adds the missing teacher_id column to the subjects table

-- ==============================================
-- 1. ADD TEACHER_ID COLUMN
-- ==============================================

-- Add the teacher_id column to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS teacher_id TEXT;

-- ==============================================
-- 2. UPDATE EXISTING RECORDS
-- ==============================================

-- Update existing subjects with NULL teacher_id (can be assigned later)
UPDATE subjects 
SET teacher_id = NULL 
WHERE teacher_id IS NULL;

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
AND column_name = 'teacher_id';

-- Check sample data
SELECT 
    id, 
    name, 
    code, 
    teacher_id 
FROM subjects 
LIMIT 5;

-- ==============================================
-- FIX COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ teacher_id column added successfully!';
    RAISE NOTICE '📊 Column: teacher_id (TEXT, NULLABLE)';
    RAISE NOTICE '🎯 SubjectCreate.tsx should now work without teacher_id errors';
END $$;
