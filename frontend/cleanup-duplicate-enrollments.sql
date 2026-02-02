-- Clean up existing duplicate enrollments
-- Run this in Supabase SQL Editor

-- ======================================================================
-- 1. IDENTIFY DUPLICATE ENROLLMENTS
-- ======================================================================

-- Show duplicate enrollments before cleanup
SELECT 
    student_id,
    subject_id,
    semester_id,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as enrollment_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as creation_dates
FROM student_subject_enrollments
GROUP BY student_id, subject_id, semester_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ======================================================================
-- 2. CLEAN UP DUPLICATES (KEEP ONLY THE FIRST ENROLLMENT)
-- ======================================================================

-- Delete duplicate enrollments, keeping only the first one created
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY student_id, subject_id, semester_id 
            ORDER BY created_at ASC
        ) as rn
    FROM student_subject_enrollments
)
DELETE FROM student_subject_enrollments 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- ======================================================================
-- 3. VERIFY CLEANUP
-- ======================================================================

-- Check if duplicates still exist
SELECT 
    'Duplicates remaining:' as status,
    COUNT(*) as duplicate_groups
FROM (
    SELECT student_id, subject_id, semester_id
    FROM student_subject_enrollments
    GROUP BY student_id, subject_id, semester_id
    HAVING COUNT(*) > 1
) duplicates;

-- Show total enrollments after cleanup
SELECT 
    'Total enrollments after cleanup:' as status,
    COUNT(*) as total_enrollments
FROM student_subject_enrollments;

-- ======================================================================
-- 4. ADD UNIQUE CONSTRAINT (IF NOT ALREADY ADDED)
-- ======================================================================

-- Add unique constraint to prevent future duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_student_subject_semester'
    ) THEN
        ALTER TABLE student_subject_enrollments 
        ADD CONSTRAINT unique_student_subject_semester 
        UNIQUE (student_id, subject_id, semester_id);
        
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

SELECT 'SUCCESS: Duplicate enrollments cleaned up and prevention added!' as result;
