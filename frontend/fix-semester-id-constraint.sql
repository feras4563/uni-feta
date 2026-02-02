-- Fix the semester_id constraint issue
-- The semester_id column still has NOT NULL constraint but we're using semester_number now

-- Step 1: Make semester_id nullable temporarily
ALTER TABLE department_semester_subjects 
ALTER COLUMN semester_id DROP NOT NULL;

-- Step 2: Set existing semester_id to NULL since we're using semester_number now
UPDATE department_semester_subjects 
SET semester_id = NULL 
WHERE semester_number IS NOT NULL;

-- Step 3: Verify the change
SELECT 
  COUNT(*) as total_records,
  COUNT(semester_id) as records_with_semester_id,
  COUNT(semester_number) as records_with_semester_number
FROM department_semester_subjects;

-- Step 4: Test insert (this should work now)
-- You can test by trying to insert a record with only semester_number
-- INSERT INTO department_semester_subjects (department_id, semester_number, subject_id, is_active) 
-- VALUES ('YOUR_DEPT_ID', 1, 'YOUR_SUBJECT_ID', true);
