-- Fix duplicate teacher assignments
-- This script will:
-- 1. Remove existing duplicate assignments (keeping the most recent one)
-- 2. Add a unique constraint to prevent future duplicates

-- Step 1: Remove duplicate assignments, keeping the most recent one
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY teacher_id, subject_id, department_id, study_year_id, semester_id 
            ORDER BY created_at DESC, id DESC
        ) as rn
    FROM teacher_subjects
    WHERE is_active = true
)
DELETE FROM teacher_subjects 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
-- First, drop the existing constraint if it exists
ALTER TABLE teacher_subjects 
DROP CONSTRAINT IF EXISTS teacher_subjects_unique_assignment;

-- Add the new unique constraint
ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_unique_assignment 
UNIQUE (teacher_id, subject_id, department_id, study_year_id, semester_id);

-- Step 3: Show the results
SELECT 
    'Cleanup completed!' as status,
    COUNT(*) as remaining_assignments
FROM teacher_subjects 
WHERE is_active = true;

-- Step 4: Show any remaining potential duplicates (should be 0)
SELECT 
    teacher_id,
    subject_id,
    department_id,
    study_year_id,
    semester_id,
    COUNT(*) as duplicate_count
FROM teacher_subjects
WHERE is_active = true
GROUP BY teacher_id, subject_id, department_id, study_year_id, semester_id
HAVING COUNT(*) > 1;
