-- ======================================================================
-- FIX STUDENT ENROLLMENT DEPARTMENT_ID COLUMN ERROR
-- ======================================================================
-- This script adds the missing 'department_id' column to student_subject_enrollments table

-- ======================================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- ======================================================================

-- Check if the table exists and its current structure
SELECT 
    'Current student_subject_enrollments table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_subject_enrollments'
ORDER BY ordinal_position;

-- ======================================================================
-- 2. ADD MISSING DEPARTMENT_ID COLUMN
-- ======================================================================

-- Add department_id column if it doesn't exist
DO $$
BEGIN
    -- Check if department_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_subject_enrollments' 
        AND column_name = 'department_id'
    ) THEN
        -- Add the department_id column
        ALTER TABLE student_subject_enrollments 
        ADD COLUMN department_id TEXT;
        
        RAISE NOTICE 'Added department_id column to student_subject_enrollments table';
    ELSE
        RAISE NOTICE 'department_id column already exists in student_subject_enrollments table';
    END IF;
END $$;

-- ======================================================================
-- 3. ADD FOREIGN KEY CONSTRAINT
-- ======================================================================

-- Add foreign key constraint to departments table
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_subject_enrollments_department_id_fkey'
        AND table_name = 'student_subject_enrollments'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id);
        
        RAISE NOTICE 'Added foreign key constraint for department_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for department_id already exists';
    END IF;
END $$;

-- ======================================================================
-- 4. UPDATE EXISTING RECORDS WITH DEPARTMENT_ID
-- ======================================================================

-- Update existing records to populate department_id from subjects table
UPDATE student_subject_enrollments 
SET department_id = s.department_id
FROM subjects s
WHERE student_subject_enrollments.subject_id = s.id
AND student_subject_enrollments.department_id IS NULL;

-- Show how many records were updated
SELECT 
    'Updated records count:' as info,
    COUNT(*) as updated_count
FROM student_subject_enrollments 
WHERE department_id IS NOT NULL;

-- ======================================================================
-- 5. VERIFY THE FIX
-- ======================================================================

-- Check the updated table structure
SELECT 
    'Updated student_subject_enrollments table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_subject_enrollments'
ORDER BY ordinal_position;

-- Test the API query that was failing
SELECT 
    'Testing API query:' as test,
    student_id,
    subject_id,
    semester_id,
    department_id,
    subject_cost,
    status,
    payment_status
FROM student_subject_enrollments
LIMIT 5;

-- ======================================================================
-- 6. DISABLE RLS FOR TESTING (OPTIONAL)
-- ======================================================================

-- Disable RLS on student_subject_enrollments table for testing
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Fixed student_subject_enrollments table - added department_id column!' as result;
